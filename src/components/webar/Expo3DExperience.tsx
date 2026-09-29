'use client';

import React, { useRef } from 'react';
import { CinematicScene } from './CinematicScene';

export interface Expo3DExperienceProps {
  onPhaseChange?: (phase: string) => void;
  reducedMotion?: boolean;
}

/**
 * LEVEL 3 — NO CAMERA
 * The exact same cinematic sequence (clouds → Baku → Earth → routes) played
 * over a premium branded gradient instead of a camera feed. The user never
 * sees an error — the experience simply continues.
 */
export function Expo3DExperience({
  onPhaseChange,
  reducedMotion = false,
}: Expo3DExperienceProps) {
  const parallaxRef = useRef({ x: 0, y: 0 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const { clientWidth, clientHeight } = e.currentTarget;
    const x = (e.clientX / clientWidth) * 2 - 1;
    const y = -(e.clientY / clientHeight) * 2 + 1;
    parallaxRef.current = { x: x * 0.5, y: y * 0.5 };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (reducedMotion || e.touches.length === 0) return;
    const touch = e.touches[0];
    const { clientWidth, clientHeight } = e.currentTarget;
    const x = (touch.clientX / clientWidth) * 2 - 1;
    const y = -(touch.clientY / clientHeight) * 2 + 1;
    parallaxRef.current = { x: x * 0.5, y: y * 0.5 };
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-black"
      style={{
        background: 'radial-gradient(circle at 50% 60%, #2a1140 0%, #150620 55%, #000000 100%)',
      }}
      onPointerMove={handlePointerMove}
      onTouchMove={handleTouchMove}
    >
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />
      {/* Cinematic 3D sequence with a soft starfield backdrop */}
      <div className="absolute inset-0 z-10">
        <CinematicScene onPhaseChange={onPhaseChange} parallaxRef={parallaxRef} reducedMotion={reducedMotion} showStars />
      </div>
    </div>
  );
}

export default Expo3DExperience;
