'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GlobeScene } from './GlobeScene';

export interface Expo3DExperienceProps {
  onComplete?: () => void;
  reducedMotion?: boolean;
}

// Interactive Mouse/Touch Parallax Rig
function PointerCameraRig({ targetTiltRef }: { targetTiltRef: React.MutableRefObject<{ x: number; y: number }> }) {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetTiltRef.current.x * 0.8, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetTiltRef.current.y * 0.8, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

// Subtle Background Starfield
function Starfield({ count = 300 }: { count?: number }) {
  const pointsGeometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [count]);

  return (
    <points geometry={pointsGeometry}>
      <pointsMaterial
        size={0.02}
        color="#d9d9d9"
        transparent
        opacity={0.35}
        sizeAttenuation
      />
    </points>
  );
}

export function Expo3DExperience({
  onComplete,
  reducedMotion = false,
}: Expo3DExperienceProps) {
  const targetTiltRef = useRef({ x: 0, y: 0 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const { clientWidth, clientHeight } = e.currentTarget;
    const x = (e.clientX / clientWidth) * 2 - 1;
    const y = -(e.clientY / clientHeight) * 2 + 1;
    targetTiltRef.current = { x: x * 0.5, y: y * 0.5 };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (reducedMotion || e.touches.length === 0) return;
    const touch = e.touches[0];
    const { clientWidth, clientHeight } = e.currentTarget;
    const x = (touch.clientX / clientWidth) * 2 - 1;
    const y = -(touch.clientY / clientHeight) * 2 + 1;
    targetTiltRef.current = { x: x * 0.5, y: y * 0.5 };
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-black"
      style={{
        background: 'radial-gradient(circle at 50% 50%, #53226C 0%, #150620 55%, #000000 100%)',
      }}
      onPointerMove={handlePointerMove}
      onTouchMove={handleTouchMove}
    >
      {/* Glow Ambient Layer */}
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />

      {/* R3F Canvas with 3D Globe & Starfield */}
      <div className="absolute inset-0 z-10">
        <Canvas
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 4.5], fov: 45 }}
        >
          <PointerCameraRig targetTiltRef={targetTiltRef} />
          <Starfield count={350} />
          <GlobeScene reducedMotion={reducedMotion} />
        </Canvas>
      </div>
    </div>
  );
}

export default Expo3DExperience;
