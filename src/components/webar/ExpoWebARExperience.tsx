'use client';

import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GlobeScene } from './GlobeScene';

export interface ExpoWebARExperienceProps {
  onFallback: () => void;
  onComplete?: () => void;
  reducedMotion?: boolean;
}

function GyroCameraRig({ targetTiltRef }: { targetTiltRef: React.MutableRefObject<{ x: number; y: number }> }) {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetTiltRef.current.y * 1.2, 0.08);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, -targetTiltRef.current.x * 1.2, 0.08);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export function ExpoWebARExperience({
  onFallback,
  onComplete,
  reducedMotion = false,
}: ExpoWebARExperienceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTiltRef = useRef({ x: 0, y: 0 });
  const hasTriggeredFallbackRef = useRef(false);

  const triggerFallbackOnce = () => {
    if (!hasTriggeredFallbackRef.current) {
      hasTriggeredFallbackRef.current = true;
      onFallback();
    }
  };

  useEffect(() => {
    let isMounted = true;
    let activeStream: MediaStream | null = null;

    async function setupCameraAndSensors() {
      // 1. Check if getUserMedia is supported
      if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        triggerFallbackOnce();
        return;
      }

      // 2. Handle iOS 13+ DeviceOrientation permission check
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission !== 'granted') {
            triggerFallbackOnce();
            return;
          }
        } catch {
          triggerFallbackOnce();
          return;
        }
      }

      // 3. Request camera stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (isMounted) {
          triggerFallbackOnce();
        }
      }
    }

    setupCameraAndSensors();

    // 4. Listen to gyro / deviceorientation for subtle AR parallax tilt
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null && event.gamma !== null) {
        // Normalize pitch & roll angles
        const normalizedPitch = (event.beta - 45) / 45; // center around ~45 deg hold angle
        const normalizedRoll = event.gamma / 45;

        targetTiltRef.current = {
          x: Math.max(-1, Math.min(1, normalizedPitch)),
          y: Math.max(-1, Math.min(1, normalizedRoll)),
        };
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      isMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* Live Environment Camera Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Subtle Dark Vignette Overlay for Contrast */}
      <div className="absolute inset-0 z-10 bg-radial-vignette pointer-events-none opacity-40" />

      {/* Transparent R3F Canvas containing 3D Globe */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <Canvas
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          style={{ background: 'transparent' }}
        >
          <GyroCameraRig targetTiltRef={targetTiltRef} />
          <GlobeScene reducedMotion={reducedMotion} />
        </Canvas>
      </div>
    </div>
  );
}

export default ExpoWebARExperience;
