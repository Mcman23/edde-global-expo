'use client';

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToVector3 } from '@/lib/config/destinations';

/**
 * CINEMATIC WEBAR SCENE
 * =====================
 * One continuous camera move, driven by a single timeline (seconds since mount):
 *
 *  0 –  2s   environment   real camera view, virtual scene hidden
 *  2 –  4.5s clouds        soft clouds materialize around the viewer
 *  4.5– 7s  descent       camera descends through the cloud layer
 *  7 –  9s  baku          Baku revealed from the air (Caspian Sea, coastline, city lights)
 *  9 – 12s  pullback      continuous pull away from Baku
 * 12 – 15s  earth         Baku shrinks to a glowing origin point on the 3D Earth
 * 15 – 20s  routes        BAKU → LONDON → TORONTO → SYDNEY, one route at a time
 * 20s+      cta           overlay message handled by the page
 *
 * The Baku city is parented to the globe surface at Baku's real lat/lon,
 * so the pullback to Earth is a true continuous move, never a cut.
 */

export const TIMELINE = {
  clouds: 2,
  descent: 4.5,
  baku: 7,
  pullback: 9,
  earth: 12,
  routes: 15,
  cta: 20,
} as const;

export const ROUTE_ORDER = ['london', 'toronto', 'sydney'] as const;
export type RouteKey = (typeof ROUTE_ORDER)[number];
export const ROUTE_DURATION = 1.7;

const ROUTE_META: Record<RouteKey, { name: string; country: string; lat: number; lon: number }> = {
  london: { name: 'London', country: 'United Kingdom', lat: 51.5, lon: -0.13 },
  toronto: { name: 'Toronto', country: 'Canada', lat: 43.65, lon: -79.38 },
  sydney: { name: 'Sydney', country: 'Australia', lat: -33.87, lon: 151.21 },
};

const GLOBE_R = 2;
const BRAND_GOLD = '#ffde00';

interface TimelineState {
  t: number;
  routeIndex: number; // -1 = none active
  routeProgress: number; // 0..1 draw progress of the active route
}

interface CinematicSceneProps {
  onPhaseChange?: (phase: string) => void;
  parallaxRef?: React.MutableRefObject<{ x: number; y: number }>;
  reducedMotion?: boolean;
  showStars?: boolean;
}

/* ------------------------------------------------------------------ */
/* Procedural textures (canvas — zero network cost, tiny memory)      */
/* ------------------------------------------------------------------ */

function makeRadialTexture(stops: Array<[number, string]>, size = 128): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([offset, color]) => grad.addColorStop(offset, color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/** Soft, volumetric-feeling cloud puff built from overlapping radial blobs. */
function makeCloudTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  // ~16 overlapping soft blobs = wispy, cinematic cloud (not cartoon)
  for (let i = 0; i < 16; i++) {
    const cx = size * (0.2 + Math.random() * 0.6);
    const cy = size * (0.25 + Math.random() * 0.5);
    const r = size * (0.08 + Math.random() * 0.16);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const a = 0.16 + Math.random() * 0.2;
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/** Soft edge-fade alpha map so map layers composite like Google Maps zoom levels. */
function makeEdgeFadeAlpha(frac = 0.15): THREE.Texture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const edge = frac * size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.min(x, size - 1 - x, y, size - 1 - y);
      let t = clamp01(d / edge);
      t = t * t * (3 - 2 * t); // smoothstep
      const v = Math.round(t * 255);
      const i = (y * size + x) * 4;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

const BAKU_POS = latLonToVector3(40.4, 49.87, GLOBE_R);
const BAKU_NORMAL = BAKU_POS.clone().normalize();
// Stable tangent frame around the Baku axis
const TAN1 = new THREE.Vector3(0, 1, 0).cross(BAKU_NORMAL).normalize();
const TAN2 = BAKU_NORMAL.clone().cross(TAN1).normalize();

const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const phaseProgress = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));

/** Camera altitude above the globe surface along the Baku axis, per timeline. */
/**
 * Orbit distance that fits the ENTIRE globe (all countries) on any screen —
 * portrait phones need to pull back much further than landscape/desktop.
 */
function globeFitDistance(camera: THREE.PerspectiveCamera): number {
  const halfV = THREE.MathUtils.degToRad(camera.fov) / 2;
  const aspect = Math.min(1, camera.aspect); // portrait crops width hardest
  return (GLOBE_R * 1.14) / (Math.tan(halfV) * aspect);
}

function altitudeAt(t: number, orbit: number): number {
  if (t < TIMELINE.clouds) return 1.5;
  if (t < TIMELINE.descent) return THREE.MathUtils.lerp(1.5, 1.32, phaseProgress(t, TIMELINE.clouds, TIMELINE.descent));
  if (t < TIMELINE.baku) return THREE.MathUtils.lerp(1.32, 0.34, easeInOut(phaseProgress(t, TIMELINE.descent, TIMELINE.baku)));
  if (t < TIMELINE.pullback) return THREE.MathUtils.lerp(0.34, 0.24, easeOut(phaseProgress(t, TIMELINE.baku, TIMELINE.pullback)));
  if (t < TIMELINE.earth) return THREE.MathUtils.lerp(0.24, orbit, easeInOut(phaseProgress(t, TIMELINE.pullback, TIMELINE.earth)));
  if (t < TIMELINE.routes) return THREE.MathUtils.lerp(orbit, orbit * 1.05, phaseProgress(t, TIMELINE.earth, TIMELINE.routes));
  return THREE.MathUtils.lerp(orbit * 1.05, orbit * 0.98, phaseProgress(t, TIMELINE.routes, TIMELINE.cta + 4));
}

/* ------------------------------------------------------------------ */
/* Timeline controller — emits phase transitions exactly once         */
/* ------------------------------------------------------------------ */

const PHASE_MARKS: Array<[number, string]> = [
  [TIMELINE.clouds, 'clouds'],
  [TIMELINE.descent, 'descent'],
  [TIMELINE.baku, 'baku'],
  [TIMELINE.pullback, 'pullback'],
  [TIMELINE.earth, 'earth'],
  [TIMELINE.routes, 'route:london'],
  [TIMELINE.routes + ROUTE_DURATION, 'route:toronto'],
  [TIMELINE.routes + ROUTE_DURATION * 2, 'route:sydney'],
  [TIMELINE.cta, 'cta'],
];

function TimelineController({
  timeline,
  onPhaseChangeRef,
}: {
  timeline: React.MutableRefObject<TimelineState>;
  onPhaseChangeRef: React.MutableRefObject<(phase: string) => void>;
}) {
  const markRef = useRef(0);
  useFrame((state) => {
    timeline.current.t = state.clock.elapsedTime;
    const t = timeline.current.t;
    while (markRef.current < PHASE_MARKS.length && t >= PHASE_MARKS[markRef.current][0]) {
      const [, phase] = PHASE_MARKS[markRef.current];
      markRef.current += 1;
      try {
        onPhaseChangeRef.current(phase);
      } catch {
        /* never let a UI callback break the scene */
      }
    }
    // active route index + draw progress
    if (t >= TIMELINE.routes && t < TIMELINE.cta) {
      const idx = Math.min(ROUTE_ORDER.length - 1, Math.floor((t - TIMELINE.routes) / ROUTE_DURATION));
      const local = (t - TIMELINE.routes) / ROUTE_DURATION - idx;
      timeline.current.routeIndex = idx;
      timeline.current.routeProgress = clamp01(local / 0.6); // drawn during first 60% of the window
    } else if (t >= TIMELINE.cta) {
      timeline.current.routeIndex = ROUTE_ORDER.length - 1;
      timeline.current.routeProgress = 1;
    } else {
      timeline.current.routeIndex = -1;
      timeline.current.routeProgress = 0;
    }
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* Camera director — one continuous move along the Baku axis          */
/* ------------------------------------------------------------------ */

function CameraDirector({
  timeline,
  parallaxRef,
}: {
  timeline: React.MutableRefObject<TimelineState>;
  parallaxRef?: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    const t = timeline.current.t;
    const orbit = globeFitDistance(state.camera as THREE.PerspectiveCamera);
    const h = altitudeAt(t, orbit);
    // position on the Baku axis
    state.camera.position.copy(BAKU_NORMAL).multiplyScalar(GLOBE_R + h);

    // subtle gyro / pointer parallax, faded out once we are far from the surface
    if (parallaxRef) {
      const p = parallaxRef.current;
      const strength = 0.09 * clamp01((1.6 - h) / 1.4); // full near the city, zero in orbit
      state.camera.position.addScaledVector(TAN1, p.y * strength);
      state.camera.position.addScaledVector(TAN2, p.x * strength);
    }

    // look target: Baku surface point near the ground, globe center in orbit
    const w = clamp01((h - 0.26) / 2.2);
    target.copy(BAKU_POS).multiplyScalar(1 - w);
    state.camera.lookAt(target);
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* Cloud layer — soft sprite clouds the camera flies through          */
/* ------------------------------------------------------------------ */

interface CloudDef {
  alt: number;
  t1: number;
  t2: number;
  scale: number;
  rotation: number;
  drift: number;
  fadeStart: number;
  opacity: number;
}

function CloudLayer({
  timeline,
  reducedMotion,
}: {
  timeline: React.MutableRefObject<TimelineState>;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cloudTexture = useMemo(() => makeCloudTexture(), []);
  const spriteRefs = useRef<THREE.Sprite[]>([]);
  const materialRefs = useRef<THREE.SpriteMaterial[]>([]);

  const clouds = useMemo<CloudDef[]>(() => {
    const defs: CloudDef[] = [];
    for (let i = 0; i < 42; i++) {
      defs.push({
        alt: 0.5 + Math.random() * 1.15, // altitude band the camera descends through
        t1: (Math.random() - 0.5) * 3.4,
        t2: (Math.random() - 0.5) * 3.4,
        scale: 1.1 + Math.random() * 1.9,
        rotation: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * (reducedMotion ? 0.02 : 0.06),
        fadeStart: TIMELINE.clouds + Math.random() * 1.2,
        opacity: 0.35 + Math.random() * 0.4,
      });
    }
    return defs;
  }, [reducedMotion]);

  useEffect(() => {
    // Sprites are created imperatively for full per-instance control
    const group = groupRef.current;
    if (!group) return;
    clouds.forEach((def) => {
      const material = new THREE.SpriteMaterial({
        map: cloudTexture,
        color: new THREE.Color('#c9d4e8'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        rotation: def.rotation,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position
        .copy(BAKU_NORMAL)
        .multiplyScalar(GLOBE_R + def.alt)
        .addScaledVector(TAN1, def.t1)
        .addScaledVector(TAN2, def.t2);
      sprite.scale.setScalar(def.scale);
      group.add(sprite);
      spriteRefs.current.push(sprite);
      materialRefs.current.push(material);
    });
    return () => {
      spriteRefs.current = [];
      materialRefs.current = [];
      group.clear();
    };
  }, [clouds, cloudTexture]);

  useFrame((_, delta) => {
    const t = timeline.current.t;
    // Global lifecycle: fade in from ~2s, dissolve during the pullback
    const globalFade =
      clamp01((t - TIMELINE.clouds) / 1.2) * clamp01(1 - phaseProgress(t, TIMELINE.pullback, TIMELINE.pullback + 2.4));
    if (globalFade <= 0) {
      materialRefs.current.forEach((m) => (m.opacity = 0));
      return;
    }
    for (let i = 0; i < materialRefs.current.length; i++) {
      const def = clouds[i];
      const own = clamp01((t - def.fadeStart) / 0.9);
      materialRefs.current[i].opacity = def.opacity * own * globalFade;
      // gentle lateral drift so the layer feels alive while flying through
      spriteRefs.current[i].position.addScaledVector(TAN1, def.drift * delta);
    }
  });

  return <group ref={groupRef} />;
}

/* ------------------------------------------------------------------ */
/* Baku — real satellite imagery (Google-Maps-style), two zoom levels  */
/* ------------------------------------------------------------------ */

// City-scale frame: 1 local unit = 18.5 km (sizes derived from tile geometry)
const REGION_SIZE = 0.40287; // z15 layer: ~7.5 km of Caspian coast around Baku
const CITY_SIZE = 0.07555; // z17 layer: ~1.4 km of downtown detail
// Layer centers relative to the Baku anchor point (north = -Z in the map frame)
const REGION_OFFSET: [number, number] = [-0.014, 0.12];
const CITY_OFFSET: [number, number] = [-0.1651, 0.1829];

function BakuCity({ timeline }: { timeline: React.MutableRefObject<TimelineState> }) {
  const groupRef = useRef<THREE.Group>(null);
  const seaMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const regionMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const cityMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const regionAlpha = useMemo(() => makeEdgeFadeAlpha(0.14), []);
  const cityAlpha = useMemo(() => makeEdgeFadeAlpha(0.2), []);

  // Lazy progressive texture loading — the fast start screen is never blocked
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/assets/baku-region.jpg', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      if (regionMatRef.current) {
        regionMatRef.current.map = tex;
        regionMatRef.current.color.set('#ffffff');
        regionMatRef.current.userData.loaded = true;
        regionMatRef.current.needsUpdate = true;
      }
    });
    loader.load('/assets/baku-city.jpg', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      if (cityMatRef.current) {
        cityMatRef.current.map = tex;
        cityMatRef.current.color.set('#ffffff');
        cityMatRef.current.userData.loaded = true;
        cityMatRef.current.needsUpdate = true;
      }
    });
  }, []);

  // Align the map's north with the tangent-plane north at Baku
  const northYaw = useMemo(() => {
    const northWorld = latLonToVector3(41.4, 49.87, GLOBE_R)
      .sub(latLonToVector3(40.4, 49.87, GLOBE_R))
      .normalize();
    const northTangent = northWorld
      .clone()
      .sub(BAKU_NORMAL.clone().multiplyScalar(northWorld.dot(BAKU_NORMAL)))
      .normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), BAKU_NORMAL);
    const lx = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const lz = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    return Math.atan2(-northTangent.dot(lx), -northTangent.dot(lz));
  }, []);

  useFrame(() => {
    const t = timeline.current.t;
    const group = groupRef.current;
    if (!group) return;

    // Discover through the clouds: regional view first, downtown detail as we close in
    const fadeIn = clamp01(phaseProgress(t, TIMELINE.descent + 0.2, TIMELINE.descent + 2.2));
    const fadeInCity = clamp01(phaseProgress(t, TIMELINE.descent + 1.7, TIMELINE.descent + 2.7));
    const fadeOut = clamp01(1 - phaseProgress(t, TIMELINE.pullback + 2.2, TIMELINE.pullback + 3.4));
    const base = fadeIn * fadeOut;
    if (seaMatRef.current) seaMatRef.current.opacity = base;
    if (regionMatRef.current) {
      regionMatRef.current.opacity = base * (regionMatRef.current.userData.loaded ? 1 : 0);
    }
    if (cityMatRef.current) {
      cityMatRef.current.opacity =
        fadeInCity * fadeOut * (cityMatRef.current.userData.loaded ? 1 : 0);
    }

    // Continuous shrink into a single glowing point on the Earth during the pullback
    const shrink = phaseProgress(t, TIMELINE.pullback, TIMELINE.pullback + 2.6);
    group.scale.setScalar(THREE.MathUtils.lerp(1, 0.002, easeInOut(shrink)));
    group.visible = base > 0.005;
  });

  return (
    <group ref={groupRef}>
      {/* Caspian Sea base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[14, 48]} />
        <meshStandardMaterial
          ref={seaMatRef}
          color="#0a2c4a"
          metalness={0.3}
          roughness={0.5}
          emissive="#041020"
          emissiveIntensity={0.6}
          transparent
          opacity={0}
        />
      </mesh>

      {/* North-aligned map frame */}
      <group rotation={[0, northYaw, 0]}>
        {/* Regional satellite layer (z15) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[REGION_OFFSET[0], 0.004, REGION_OFFSET[1]]}>
          <planeGeometry args={[REGION_SIZE, REGION_SIZE]} />
          <meshBasicMaterial
            ref={regionMatRef}
            transparent
            opacity={0}
            alphaMap={regionAlpha}
            depthWrite={false}
          />
        </mesh>
        {/* Downtown satellite layer (z17) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CITY_OFFSET[0], 0.008, CITY_OFFSET[1]]}>
          <planeGeometry args={[CITY_SIZE, CITY_SIZE]} />
          <meshBasicMaterial
            ref={cityMatRef}
            transparent
            opacity={0}
            alphaMap={cityAlpha}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Earth globe — realistic texture (lazy) + fresnel atmosphere         */
/* ------------------------------------------------------------------ */

const atmosphereVertex = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const atmosphereFragment = `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.5);
    gl_FragColor = vec4(uColor, 1.0) * fresnel * uIntensity;
  }
`;

function EarthGlobe({
  timeline,
}: {
  timeline: React.MutableRefObject<TimelineState>;
}) {
  const globeGroupRef = useRef<THREE.Group>(null);
  const surfaceMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const atmosphereMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // Lazy, progressive texture loading — nothing blocks the first frames
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/assets/earth-satellite.jpg', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = surfaceMaterialRef.current;
      if (mat) {
        mat.map = tex;
        mat.color.set('#ffffff');
        mat.needsUpdate = true;
      }
    });
    loader.load('/assets/earth-topology.png', (tex) => {
      const mat = surfaceMaterialRef.current;
      if (mat) {
        mat.bumpMap = tex;
        mat.bumpScale = 0.05;
        mat.needsUpdate = true;
      }
    });
  }, []);

  useFrame(() => {
    const t = timeline.current.t;
    const group = globeGroupRef.current;
    if (!group) return;

    // The planet body emerges beneath the clouds during the pullback —
    // before that the real camera environment stays fully visible.
    const reveal = easeInOut(phaseProgress(t, TIMELINE.pullback + 0.6, TIMELINE.pullback + 2.6));
    if (surfaceMaterialRef.current) {
      surfaceMaterialRef.current.opacity = reveal;
    }
    if (atmosphereMaterialRef.current) {
      (atmosphereMaterialRef.current.uniforms.uIntensity as { value: number }).value = 1.1 * reveal;
    }
  });

  return (
    <group ref={globeGroupRef}>
      <mesh>
        <sphereGeometry args={[GLOBE_R, 64, 64]} />
        <meshStandardMaterial
          ref={surfaceMaterialRef}
          color="#0d2038"
          roughness={0.9}
          metalness={0.05}
          transparent
          opacity={0}
        />
      </mesh>
      {/* Subtle atmospheric rim glow */}
      <mesh scale={1.12}>
        <sphereGeometry args={[GLOBE_R, 48, 48]} />
        <shaderMaterial
          ref={atmosphereMaterialRef}
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={{
            uColor: { value: new THREE.Color('#4d8fd1') },
            uIntensity: { value: 0 },
          }}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Baku origin marker on the globe                                     */
/* ------------------------------------------------------------------ */

function BakuMarker({ timeline }: { timeline: React.MutableRefObject<TimelineState> }) {
  const glowTexture = useMemo(
    () =>
      makeRadialTexture([
        [0, 'rgba(255,222,0,0.95)'],
        [0.4, 'rgba(255,222,0,0.3)'],
        [1, 'rgba(255,222,0,0)'],
      ]),
    []
  );
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Sprite>(null);

  useFrame((state) => {
    const t = timeline.current.t;
    const group = groupRef.current;
    if (!group) return;
    // Appears as the city shrinks to a point during the pullback
    const appear = clamp01(phaseProgress(t, TIMELINE.pullback + 1.6, TIMELINE.pullback + 2.8));
    group.visible = appear > 0.01;
    if (glowRef.current) {
      const pulse = 0.9 + Math.sin(state.clock.elapsedTime * 2.4) * 0.15;
      glowRef.current.scale.setScalar(0.16 * pulse * appear);
      (glowRef.current.material as THREE.SpriteMaterial).opacity = 0.9 * appear;
    }
  });

  return (
    <group ref={groupRef} position={BAKU_POS.clone().multiplyScalar(1.008)}>
      <mesh>
        <sphereGeometry args={[0.014, 12, 12]} />
        <meshBasicMaterial color={BRAND_GOLD} />
      </mesh>
      <sprite ref={glowRef}>
        <spriteMaterial map={glowTexture} color={BRAND_GOLD} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Routes — one golden arc at a time, with a travelling comet          */
/* ------------------------------------------------------------------ */

interface RouteObject {
  key: RouteKey;
  curve: THREE.QuadraticBezierCurve3;
  line: THREE.Line;
  material: THREE.LineBasicMaterial;
  endGroup: THREE.Group;
  comet: THREE.Sprite;
  cometMaterial: THREE.SpriteMaterial;
}

function Routes({ timeline }: { timeline: React.MutableRefObject<TimelineState> }) {
  const groupRef = useRef<THREE.Group>(null);
  const routesRef = useRef<RouteObject[]>([]);
  const cometTexture = useMemo(
    () =>
      makeRadialTexture([
        [0, 'rgba(255,222,0,1)'],
        [0.3, 'rgba(255,222,0,0.45)'],
        [1, 'rgba(255,222,0,0)'],
      ]),
    []
  );

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const objects: RouteObject[] = ROUTE_ORDER.map((key) => {
      const meta = ROUTE_META[key];
      const p1 = BAKU_POS.clone().multiplyScalar(1.01);
      const p2 = latLonToVector3(meta.lat, meta.lon, GLOBE_R * 1.01);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const distance = p1.distanceTo(p2);
      const arcHeight = Math.min(Math.max(distance * 0.28, 0.25), 0.85);
      mid.normalize().multiplyScalar(GLOBE_R + arcHeight);
      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);

      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(120));
      geometry.setDrawRange(0, 0);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(BRAND_GOLD),
        transparent: true,
        opacity: 0.95,
      });
      const line = new THREE.Line(geometry, material);
      group.add(line);

      // Destination endpoint: small dot + glow, hidden until the arc arrives
      const endGroup = new THREE.Group();
      endGroup.position.copy(p2);
      endGroup.visible = false;
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.011, 12, 12),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(BRAND_GOLD) })
      );
      const endGlowMat = new THREE.SpriteMaterial({
        map: cometTexture,
        color: new THREE.Color(BRAND_GOLD),
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const endGlow = new THREE.Sprite(endGlowMat);
      endGlow.scale.setScalar(0.11);
      endGroup.add(dot, endGlow);
      group.add(endGroup);

      // Comet travelling along the arc while it draws
      const cometMaterial = new THREE.SpriteMaterial({
        map: cometTexture,
        color: new THREE.Color(BRAND_GOLD),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const comet = new THREE.Sprite(cometMaterial);
      comet.scale.setScalar(0.09);
      comet.visible = false;
      group.add(comet);

      return { key, curve, line, material, endGroup, comet, cometMaterial };
    });

    routesRef.current = objects;
    return () => {
      objects.forEach((o) => {
        group.remove(o.line, o.endGroup, o.comet);
        o.line.geometry.dispose();
        o.material.dispose();
      });
      routesRef.current = [];
    };
  }, [cometTexture]);

  useFrame(() => {
    const { routeIndex, routeProgress } = timeline.current;
    routesRef.current.forEach((route, i) => {
      const isPast = routeIndex >= 0 && i < routeIndex;
      const isActive = i === routeIndex;
      const anyActive = routeIndex >= 0;

      if (isActive) {
        const n = Math.floor(routeProgress * 120);
        route.line.geometry.setDrawRange(0, n);
        route.material.opacity = 0.95;
        const arrived = routeProgress >= 1;
        route.endGroup.visible = arrived;
        if (arrived) {
          route.comet.visible = false;
          route.cometMaterial.opacity = 0;
        } else if (routeProgress > 0.01) {
          route.comet.visible = true;
          route.cometMaterial.opacity = 0.9;
          route.comet.position.copy(route.curve.getPoint(Math.max(0.01, routeProgress)));
        }
      } else if (isPast) {
        // Previous route dims to keep focus on the current one
        route.material.opacity = 0.28;
        route.comet.visible = false;
      } else {
        route.material.opacity = anyActive ? 0 : route.material.opacity;
        route.line.geometry.setDrawRange(0, 0);
        route.endGroup.visible = false;
        route.comet.visible = false;
      }
    });
  });

  return <group ref={groupRef} />;
}

/* ------------------------------------------------------------------ */
/* Subtle starfield for the no-camera fallback only                    */
/* ------------------------------------------------------------------ */

function Starfield({ count = 260 }: { count?: number }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Distant shell around the scene
      const v = new THREE.Vector3().randomDirection().multiplyScalar(18 + Math.random() * 6);
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);
  return (
    <points geometry={geometry}>
      <pointsMaterial color="#d9d9d9" size={0.03} transparent opacity={0.4} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Light director — night ambience for the city, satellite daylight   */
/* for the Earth                                                      */
/* ------------------------------------------------------------------ */

function LightDirector({
  timeline,
  ambientRef,
  sunRef,
}: {
  timeline: React.MutableRefObject<TimelineState>;
  ambientRef: React.MutableRefObject<THREE.AmbientLight | null>;
  sunRef: React.MutableRefObject<THREE.DirectionalLight | null>;
}) {
  useFrame(() => {
    const t = timeline.current.t;
    // Ramp up as we pull away from night-time Baku toward the daylight globe
    const day = easeInOut(phaseProgress(t, TIMELINE.pullback, TIMELINE.earth));
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(0.55, 1.05, day);
    }
    if (sunRef.current) {
      sunRef.current.intensity = THREE.MathUtils.lerp(1.1, 0.45, day);
    }
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* World rotator — globe, city, markers and routes turn together       */
/* ------------------------------------------------------------------ */

interface DragState {
  dragging: boolean;
  lastX: number;
  velocity: number;
  offset: number;
  auto: number;
}

function WorldRotator({
  timeline,
  reducedMotion,
  dragRef,
  children,
}: {
  timeline: React.MutableRefObject<TimelineState>;
  reducedMotion: boolean;
  dragRef: React.MutableRefObject<DragState>;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const t = timeline.current.t;
    const group = groupRef.current;
    if (!group) return;
    const d = dragRef.current;
    // Subtle auto drift keeps the shot alive; user drag adds full-spin control
    if (t > TIMELINE.earth) {
      d.auto += delta * (reducedMotion ? 0.003 : 0.01);
    }
    if (!d.dragging) {
      d.offset += d.velocity;
      d.velocity *= 0.93; // gentle inertia
    }
    group.rotation.y = d.auto + d.offset;
  });
  return <group ref={groupRef}>{children}</group>;
}

/* ------------------------------------------------------------------ */
/* Scene root                                                          */
/* ------------------------------------------------------------------ */

export function CinematicScene({
  onPhaseChange,
  parallaxRef,
  reducedMotion = false,
  showStars = false,
}: CinematicSceneProps) {
  const timeline = useRef<TimelineState>({ t: 0, routeIndex: -1, routeProgress: 0 });
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const dragRef = useRef<DragState>({ dragging: false, lastX: 0, velocity: 0, offset: 0, auto: 0 });

  // Touch/pointer rotation of the Earth (active once the globe is revealed)
  const canRotate = () => timeline.current.t > TIMELINE.earth;
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canRotate()) return;
    dragRef.current.dragging = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.velocity = 0;
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const dx = e.clientX - d.lastX;
    d.lastX = e.clientX;
    d.offset += dx * 0.005;
    d.velocity = dx * 0.005;
  };
  const endDrag = () => {
    dragRef.current.dragging = false;
  };
  const onPhaseChangeRef = useRef(onPhaseChange ?? (() => {}));
  useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange ?? (() => {});
  }, [onPhaseChange]);

  return (
    <div
      className="w-full h-full"
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
    >
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: BAKU_NORMAL.clone().multiplyScalar(GLOBE_R + 1.5).toArray() as [number, number, number], fov: 45 }}
      dpr={[1, 1.75]}
      style={{ background: 'transparent' }}
    >
      {/* Lighting: moody night ambience for the city phases, brightening into
          a clean satellite-photo light once the Earth is revealed */}
      <ambientLight ref={ambientRef} intensity={0.55} />
      <directionalLight ref={sunRef} position={[4, 6, 4]} intensity={1.1} color="#cfd8ff" />
      <directionalLight position={[-4, -2, -4]} intensity={0.35} color="#53226C" />

      <TimelineController timeline={timeline} onPhaseChangeRef={onPhaseChangeRef} />
      <CameraDirector timeline={timeline} parallaxRef={parallaxRef} />
      <LightDirector timeline={timeline} ambientRef={ambientRef} sunRef={sunRef} />

      {showStars && <Starfield />}
      <WorldRotator timeline={timeline} reducedMotion={reducedMotion} dragRef={dragRef}>
        <EarthGlobe timeline={timeline} />
        <BakuMarker timeline={timeline} />
        <BakuCity timeline={timeline} />
        <Routes timeline={timeline} />
      </WorldRotator>
      <CloudLayer timeline={timeline} reducedMotion={reducedMotion} />
    </Canvas>
    </div>
  );
}

export default CinematicScene;
