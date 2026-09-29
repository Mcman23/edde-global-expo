'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { trackEvent } from '@/lib/analytics';
import { useWebARSupport } from '@/components/webar/useWebARSupport';

// Lazy load the heavy 3D experience only after the (fast) start screen renders
const ExpoWebARExperience = dynamic(
  () => import('@/components/webar/ExpoWebARExperience'),
  { ssr: false }
);

const Expo3DExperience = dynamic(
  () => import('@/components/webar/Expo3DExperience'),
  { ssr: false }
);

type Stage = 'intro' | 'experience';
type ExperienceMode = 'camera' | 'nocamera';

/** Caption shown per scene phase — minimal, elegant, never a UI card. */
const PHASE_CAPTIONS: Record<string, { title: string; sub?: string }> = {
  baku: { title: 'BAKU', sub: 'FROM BAKU' },
  earth: { title: 'BAKU' },
  'route:london': { title: 'LONDON', sub: 'UNITED KINGDOM' },
  'route:toronto': { title: 'TORONTO', sub: 'CANADA' },
  'route:sydney': { title: 'SYDNEY', sub: 'AUSTRALIA' },
};

function ShieldCrownLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 44C24 44 38 36 38 22V8L24 4L10 8V22C10 36 24 44 24 44Z"
        stroke="#6a0deb"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 26L18 18L24 22L30 18L32 26H16Z"
        stroke="#ffde00"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="18" r="1" fill="#ffde00" />
      <circle cx="24" cy="22" r="1" fill="#ffde00" />
      <circle cx="30" cy="18" r="1" fill="#ffde00" />
    </svg>
  );
}

function ExpoPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supported, needsPermissionRequest, requestPermission } = useWebARSupport();

  const [stage, setStage] = useState<Stage>('intro');
  const [mode, setMode] = useState<ExperienceMode>('camera');
  const [isPreparing, setIsPreparing] = useState(false);
  const [phase, setPhase] = useState<string>('environment');
  const [reducedMotion, setReducedMotion] = useState(false);

  const utmMetadataRef = useRef<Record<string, string>>({});
  const trackedPhasesRef = useRef<Set<string>>(new Set());
  const hasTrackedFallbackRef = useRef(false);

  const isCtaPhase = phase === 'cta';
  const caption = PHASE_CAPTIONS[phase];

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
    }
  }, []);

  // 1. Extract UTM parameters and track landing view on mount
  useEffect(() => {
    const utms: Record<string, string> = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
      const val = searchParams.get(key);
      if (val) utms[key] = val;
    });
    utmMetadataRef.current = utms;
    trackEvent('landing_view', utms);
  }, [searchParams]);

  const trackPhaseOnce = (eventKey: string, metadata: Record<string, unknown> = {}) => {
    const bucketKey = `${eventKey}:${JSON.stringify(metadata)}`;
    if (trackedPhasesRef.current.has(bucketKey)) return;
    trackedPhasesRef.current.add(bucketKey);
    trackEvent(eventKey, { ...utmMetadataRef.current, ...metadata });
  };

  // 2. Scene phase → captions + analytics (called once per phase by the 3D scene)
  const handlePhaseChange = (phaseKey: string) => {
    setPhase(phaseKey);

    switch (phaseKey) {
      case 'clouds':
        trackPhaseOnce('webar_cloud_sequence_started');
        break;
      case 'baku':
        trackPhaseOnce('webar_baku_revealed');
        break;
      case 'earth':
        trackPhaseOnce('webar_earth_revealed');
        break;
      case 'cta':
        trackPhaseOnce('webar_completed');
        break;
      default:
        if (phaseKey.startsWith('route:')) {
          trackPhaseOnce('webar_route_started', { destination: phaseKey.slice(6) });
        }
    }
  };

  const handleCameraResult = (granted: boolean) => {
    if (granted) {
      trackPhaseOnce('webar_camera_permission_granted');
    } else {
      trackPhaseOnce('webar_camera_permission_denied');
      // Silent continuation: the no-camera level takes over, no error is shown
      setMode('nocamera');
      if (!hasTrackedFallbackRef.current) {
        hasTrackedFallbackRef.current = true;
        trackEvent('webar_fallback', { ...utmMetadataRef.current, reason: 'camera_unavailable' });
      }
    }
  };

  const handleStartExperience = async () => {
    trackEvent('webar_started', utmMetadataRef.current);
    setIsPreparing(true);

    // Motion-sensor permission must be requested inside the user gesture (iOS)
    if (needsPermissionRequest) {
      await requestPermission().catch(() => false);
    }

    // Devices without any camera capability go straight to the cinematic no-camera level
    if (!supported) {
      setMode('nocamera');
      if (!hasTrackedFallbackRef.current) {
        hasTrackedFallbackRef.current = true;
        trackEvent('webar_fallback', { ...utmMetadataRef.current, reason: 'no_getusermedia' });
      }
    }

    setIsPreparing(false);
    setStage('experience');
  };

  const handleSkipToQuiz = () => {
    trackEvent('webar_skipped', { ...utmMetadataRef.current, phase });
    trackEvent('webar_cta_clicked', { ...utmMetadataRef.current, via: 'skip' });
    router.push('/quiz');
  };

  const handleCtaClick = () => {
    trackEvent('webar_cta_clicked', { ...utmMetadataRef.current, via: 'primary' });
    if (phase !== 'cta') {
      trackEvent('webar_completed', { ...utmMetadataRef.current, skipped: true });
    }
    router.push('/quiz');
  };

  return (
    <main
      className="relative w-screen h-screen overflow-hidden text-white bg-black select-none font-sans"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* -------------------- STAGE 1: START SCREEN -------------------- */}
      {stage === 'intro' && (
        <div className="relative z-10 flex flex-col items-center justify-between w-full h-full px-6 py-12 text-center bg-radial-dark">
          {/* Brand header */}
          <div className="flex flex-col items-center gap-3 pt-6 animate-fade-in">
            <ShieldCrownLogo className="w-12 h-12" />
            <h2 className="text-xs font-semibold tracking-widest uppercase text-edde-gray/80 font-poppins">
              EDDE GLOBAL
            </h2>
          </div>

          {/* Hero */}
          <div className="max-w-md my-auto space-y-4 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase leading-tight text-white font-poppins">
              Your Future
              <br />
              Has No Borders.
            </h1>
            <p className="text-sm sm:text-base text-edde-gray/90 tracking-wide font-poppins">
              From Baku to the world.
            </p>
          </div>

          {/* Actions */}
          <div className="w-full max-w-xs pb-6 space-y-4">
            <button
              onClick={handleStartExperience}
              disabled={isPreparing}
              className="w-full py-4 px-6 text-sm font-bold tracking-wider uppercase text-black bg-[#ffde00] hover:bg-[#ffe533] active:scale-[0.98] transition-all rounded-full shadow-lg shadow-[#ffde00]/20 font-poppins"
            >
              {isPreparing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Preparing…
                </span>
              ) : (
                'Start Experience'
              )}
            </button>

            <button
              onClick={handleSkipToQuiz}
              className="block w-full text-xs text-edde-gray/70 hover:text-white transition-colors underline underline-offset-4 py-2 font-poppins"
            >
              Skip to quiz
            </button>
          </div>
        </div>
      )}

      {/* -------------------- STAGE 2: CINEMATIC EXPERIENCE -------------------- */}
      {stage === 'experience' && (
        <div className="relative w-full h-full">
          {mode === 'camera' ? (
            <ExpoWebARExperience
              onCameraResult={handleCameraResult}
              onFallback={() => {
                setMode('nocamera');
                if (!hasTrackedFallbackRef.current) {
                  hasTrackedFallbackRef.current = true;
                  trackEvent('webar_fallback', { ...utmMetadataRef.current, reason: 'camera_failed' });
                }
              }}
              onPhaseChange={handlePhaseChange}
              reducedMotion={reducedMotion}
            />
          ) : (
            <Expo3DExperience onPhaseChange={handlePhaseChange} reducedMotion={reducedMotion} />
          )}

          {/* Overlay: minimal, non-blocking, phase-driven */}
          <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-6">
            {/* Top bar */}
            <div className="flex items-center justify-between w-full pt-2">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <ShieldCrownLogo className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-white font-poppins">
                  EDDE GLOBAL
                </span>
              </div>
              <button
                onClick={handleSkipToQuiz}
                className="pointer-events-auto px-4 py-1.5 text-xs font-semibold text-white/90 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 rounded-full transition-all active:scale-95 font-poppins"
              >
                Skip
              </button>
            </div>

            {/* Elegant phase caption (BAKU / destinations) */}
            <div className="my-auto text-center px-4">
              {caption && !isCtaPhase && (
                <div key={phase} className="animate-fade-in space-y-1">
                  <h2
                    className="font-poppins font-bold tracking-[0.3em] uppercase drop-shadow-lg"
                    style={{
                      fontSize: 'clamp(1.4rem, 6vw, 2.2rem)',
                      textShadow: '0 2px 18px rgba(0,0,0,0.65)',
                    }}
                  >
                    {caption.title}
                  </h2>
                  {caption.sub && (
                    <p
                      className="text-[10px] sm:text-xs tracking-[0.35em] uppercase text-white/75 font-poppins"
                      style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
                    >
                      {caption.sub}
                    </p>
                  )}
                  <div className="mx-auto mt-2 w-10 h-px bg-[#ffde00]/70" />
                </div>
              )}
            </div>

            {/* Bottom: final message + CTA */}
            <div className="w-full max-w-xs mx-auto pb-6 text-center space-y-5">
              {isCtaPhase ? (
                <div className="animate-fade-in space-y-5">
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase leading-tight text-white font-poppins drop-shadow-md">
                      Your Future
                      <br />
                      Has No Borders.
                    </h2>
                    <p className="text-sm sm:text-base font-bold text-white/90 font-poppins">
                      Where could your future take you?
                    </p>
                  </div>
                  <button
                    onClick={handleCtaClick}
                    className="pointer-events-auto w-full py-4 px-6 text-sm font-bold tracking-wider uppercase text-black bg-[#ffde00] hover:bg-[#ffe533] active:scale-[0.98] transition-all rounded-full shadow-xl shadow-[#ffde00]/30 font-poppins animate-bounce-subtle"
                  >
                    Find My Destination
                  </button>
                  <button
                    onClick={handleSkipToQuiz}
                    className="pointer-events-auto block w-full text-xs text-edde-gray/70 hover:text-white transition-colors underline underline-offset-4 py-1 font-poppins"
                  >
                    Skip to quiz
                  </button>
                </div>
              ) : (
                <div className="space-y-1 animate-fade-in">
                  <div className="text-[11px] text-white/40 tracking-widest uppercase font-poppins">
                    EDDE GLOBAL PRESENTS
                  </div>
                  <div className="text-[8px] text-white/25 tracking-wider uppercase font-poppins">
                    Satellite imagery &#8226; Esri World Imagery
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ExpoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-screen h-screen bg-black text-white font-poppins">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#ffde00] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-edde-gray/70 uppercase tracking-widest">Loading EDDE Global…</p>
          </div>
        </div>
      }
    >
      <ExpoPageInner />
    </Suspense>
  );
}
