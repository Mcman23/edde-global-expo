'use client';

import React, { useEffect, useRef } from 'react';
import { CinematicScene } from './CinematicScene';

export interface ExpoWebARExperienceProps {
  /** Called with `true` when the camera stream starts, `false` when unavailable. */
  onCameraResult?: (granted: boolean) => void;
  /** Called once when the camera cannot be used at all — page switches to the no-camera level. */
  onFallback: () => void;
  onPhaseChange?: (phase: string) => void;
  reducedMotion?: boolean;
}

/**
 * LEVEL 1/2 — CAMERA EXPERIENCE
 * Real environment feed (rear camera) with the cinematic 3D sequence layered
 * transparently on top. Gyroscope adds a subtle parallax so the virtual scene
 * feels anchored in the user's real surroundings. No marker, no tracking UI.
 */
export function ExpoWebARExperience({
  onCameraResult,
  onFallback,
  onPhaseChange,
  reducedMotion = false,
}: ExpoWebARExperienceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const parallaxRef = useRef({ x: 0, y: 0 });
  const hasTriggeredFallbackRef = useRef(false);

  // Keep callbacks stable for the mount effect
  const cameraResultRef = useRef(onCameraResult);
  const fallbackRef = useRef(onFallback);
  useEffect(() => {
    cameraResultRef.current = onCameraResult;
    fallbackRef.current = onFallback;
  }, [onCameraResult, onFallback]);

  useEffect(() => {
    let isMounted = true;
    let activeStream: MediaStream | null = null;

    const triggerFallbackOnce = () => {
      if (!hasTriggeredFallbackRef.current) {
        hasTriggeredFallbackRef.current = true;
        fallbackRef.current();
      }
    };

    async function setupCamera() {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        cameraResultRef.current?.(false);
        triggerFallbackOnce();
        return;
      }

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
        cameraResultRef.current?.(true);
      } catch {
        if (isMounted) {
          cameraResultRef.current?.(false);
          triggerFallbackOnce();
        }
      }
    }

    setupCamera();

    // Subtle device-tilt parallax (no on-screen indicators of any kind)
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null && event.gamma !== null) {
        const pitch = Math.max(-1, Math.min(1, (event.beta - 45) / 45));
        const roll = Math.max(-1, Math.min(1, event.gamma / 45));
        parallaxRef.current = { x: pitch, y: roll };
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
      {/* Live environment camera feed — never covered by opaque UI */}
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-0" />

      {/* Subtle vignette for legibility, camera stays visible */}
      <div className="absolute inset-0 z-10 bg-radial-vignette pointer-events-none opacity-40" />

      {/* Transparent 3D layer: clouds → Baku → Earth → routes */}
      <div className="absolute inset-0 z-20">
        <CinematicScene onPhaseChange={onPhaseChange} parallaxRef={parallaxRef} reducedMotion={reducedMotion} />
      </div>
    </div>
  );
}

export default ExpoWebARExperience;
