'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ORIGIN_DESTINATION, DESTINATIONS, latLonToVector3 } from '@/lib/config/destinations';

export interface GlobeSceneProps {
  reducedMotion?: boolean;
}

const GLOBE_RADIUS = 1.6;

// Helper to construct dot cloud geometry via Fibonacci spiral
function createFibonacciGlobeGeometry(count: number, radius: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const colorPurple = new THREE.Color('#6a0deb');
  const colorYellow = new THREE.Color('#ffde00');
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < count; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Distribute ~85% brand purple, ~15% brand yellow accent dots
    const isYellow = (i * 13) % 7 === 0;
    const c = isYellow ? colorYellow : colorPurple;

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

export function GlobeScene({ reducedMotion = false }: GlobeSceneProps) {
  const globeGroupRef = useRef<THREE.Group>(null);
  const routeMaterialsRef = useRef<THREE.LineDashedMaterial[]>([]);
  const markerRefs = useRef<THREE.Mesh[]>([]);
  const planeRefs = useRef<THREE.Mesh[]>([]);

  // 1. Procedural dot globe geometry
  const dotGeometry = useMemo(() => {
    return createFibonacciGlobeGeometry(1800, GLOBE_RADIUS);
  }, []);

  // 2. Destination coordinates & 3D position vectors
  const originPos = useMemo(() => {
    return latLonToVector3(ORIGIN_DESTINATION.lat, ORIGIN_DESTINATION.lon, GLOBE_RADIUS * 1.01);
  }, []);

  const destPositions = useMemo(() => {
    return DESTINATIONS.map((d) =>
      latLonToVector3(d.lat, d.lon, GLOBE_RADIUS * 1.01)
    );
  }, []);

  // 3. Curved flight routes from Baku to each destination
  const routeCurvesAndGeometries = useMemo(() => {
    return DESTINATIONS.map((d, index) => {
      const p1 = latLonToVector3(ORIGIN_DESTINATION.lat, ORIGIN_DESTINATION.lon, GLOBE_RADIUS * 1.01);
      const p2 = latLonToVector3(d.lat, d.lon, GLOBE_RADIUS * 1.01);

      // Calculate arc midpoint pushed outward away from center
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const distance = p1.distanceTo(p2);
      const arcHeight = Math.min(Math.max(distance * 0.45, 0.4), 0.9);
      mid.normalize().multiplyScalar(GLOBE_RADIUS + arcHeight);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(50);

      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const material = new THREE.LineDashedMaterial({
        color: 0xffde00,
        dashSize: 0.08,
        gapSize: 0.05,
        transparent: true,
        opacity: 0.82,
      });
      const line = new THREE.Line(geometry, material);
      line.computeLineDistances();
      routeMaterialsRef.current[index] = material;

      return { curve, geometry, line };
    });
  }, []);

  // Frame animation loop
  useFrame((state, delta) => {
    if (!globeGroupRef.current) return;

    // Auto rotate globe
    if (!reducedMotion) {
      globeGroupRef.current.rotation.y += delta * 0.1;
    }

    const elapsedTime = state.clock.getElapsedTime();

    // Animate dashed route lines (flight path simulation)
    routeMaterialsRef.current.forEach((mat) => {
      if (mat) {
        (mat as any).dashOffset -= delta * 0.35;
      }
    });

    // Animate pulsing destination markers
    markerRefs.current.forEach((marker, index) => {
      if (marker) {
        const pulse = Math.sin(elapsedTime * 3 + index) * 0.18 + 1.0;
        marker.scale.set(pulse, pulse, pulse);
      }
    });

    // Animate subtle plane/flight markers along route curves
    planeRefs.current.forEach((plane, index) => {
      if (plane && routeCurvesAndGeometries[index]) {
        const { curve } = routeCurvesAndGeometries[index];
        const progress = (elapsedTime * 0.18 + index * 0.2) % 1;
        const pt = curve.getPoint(progress);
        plane.position.copy(pt);
      }
    });
  });

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, -5, -5]} intensity={0.5} color="#53226C" />

      <group ref={globeGroupRef}>
        {/* 1. Procedural Dot Cloud Globe */}
        <points geometry={dotGeometry}>
          <pointsMaterial
            size={0.024}
            vertexColors
            transparent
            opacity={0.88}
            sizeAttenuation
            depthWrite={false}
          />
        </points>

        {/* 2. Soft Inner Glowing Sphere */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS * 0.985, 32, 32]} />
          <meshBasicMaterial
            color="#53226C"
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </mesh>

        {/* 3. Subtle Globe Wireframe */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS * 1.002, 24, 24]} />
          <meshBasicMaterial
            color="#6a0deb"
            wireframe
            transparent
            opacity={0.06}
            depthWrite={false}
          />
        </mesh>

        {/* 4. Baku Origin Marker */}
        <group position={originPos}>
          <mesh>
            <sphereGeometry args={[0.038, 16, 16]} />
            <meshStandardMaterial
              color="#ffde00"
              emissive="#ffde00"
              emissiveIntensity={0.8}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[0.045, 0.055, 32]} />
            <meshBasicMaterial color="#ffde00" side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
        </group>

        {/* 5. Destination Markers */}
        {destPositions.map((pos, index) => (
          <mesh
            key={DESTINATIONS[index].key}
            position={pos}
            ref={(el) => {
              if (el) markerRefs.current[index] = el;
            }}
          >
            <sphereGeometry args={[0.032, 16, 16]} />
            <meshStandardMaterial
              color="#ffde00"
              emissive="#ffde00"
              emissiveIntensity={0.9}
            />
          </mesh>
        ))}

        {/* 6. Animated Flight Route Arcs & Plane Markers */}
        {routeCurvesAndGeometries.map(({ curve, line }, index) => (
          <group key={DESTINATIONS[index].key}>
            {/* Dashed Route Line */}
            <primitive object={line} />

            {/* Subtle moving plane marker */}
            <mesh
              ref={(el) => {
                if (el) planeRefs.current[index] = el;
              }}
            >
              <sphereGeometry args={[0.02, 12, 12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

export default GlobeScene;
