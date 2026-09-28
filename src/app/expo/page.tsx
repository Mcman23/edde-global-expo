'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { trackEvent } from '@/lib/analytics';
import { useWebARSupport } from '@/components/webar/useWebARSupport';
import { DESTINATIONS } from '@/lib/config/destinations';

// Lazy load R3F WebAR & 3D components with ssr: false
const ExpoWebARExperience = dynamic(
  () => import('@/components/webar/ExpoWebARExperience'),
  { ssr: false }
);

const Expo3DExperience = dynamic(
  () => import('@/components/webar/Expo3DExperience'),
  { ssr: false }
);

type Stage = 'intro' | 'experience' | 'cta';
type ExperienceMode = 'ar' | 'fallback';

function ShieldCrownLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Shield Outline */}
      <path
        d="M24 44C24 44 38 36 38 22V8L24 4L10 8V22C10 36 24 44 24 44Z"
        stroke="#6a0deb"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Minimal Crown Inside */}
      <path
        d="M16 26L18 18L24 22L30 18L32 26H16Z"
        stroke="#ffde00"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crown Dots */}
      <circle cx="18" cy="18" r="1" fill="#ffde00" />
      <circle cx="24" cy="22" r="1" fill="#ffde00" />
      <circle cx="30" cy="18" r="1" fill="#ffde00" />
    </svg>
  );
}

function ExpoPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supported, checking, needsPermissionRequest, requestPermission } = useWebARSupport();

  const [stage, setStage] = useState<Stage>('intro');
  const [mode, setMode] = useState<ExperienceMode>('ar');
  const [isPreparing, setIsPreparing] = useState(false);
  const [sequenceTime, setSequenceTime] = useState(0);
  const [hasTrackedFallback, setHasTrackedFallback] = useState(false);
  const [hasTrackedCompleted, setHasTrackedCompleted] = useState(false);

  const utmMetadataRef = useRef<Record<string, string>>({});

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

  // 2. Timed sequence timer for the experience stage (0 - 10 seconds)
  useEffect(() => {
    if (stage !== 'experience') return;

    const interval = setInterval(() => {
      setSequenceTime((prev) => {
        const nextTime = prev + 0.1;
        if (nextTime >= 10 && !hasTrackedCompleted) {
          setHasTrackedCompleted(true);
          trackEvent('webar_completed', utmMetadataRef.current);
        }
        return nextTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [stage, hasTrackedCompleted]);

  // Helper to log fallback once
  const triggerFallbackMode = () => {
    setMode('fallback');
    if (!hasTrackedFallback) {
      setHasTrackedFallback(true);
      trackEvent('webar_fallback', utmMetadataRef.current);
    }
  };

  // Start experience button handler
  const handleStartExperience = async () => {
    trackEvent('webar_started', utmMetadataRef.current);
    setIsPreparing(true);

    // Request iOS orientation permission if required
    if (needsPermissionRequest) {
      const granted = await requestPermission();
      if (!granted) {
        triggerFallbackMode();
      }
    }

    setTimeout(() => {
      if (!supported) {
        triggerFallbackMode();
      } else {
        setMode('ar');
      }
      setIsPreparing(false);
      setStage('experience');
      setSequenceTime(0);
    }, 800);
  };

  // Skip button handler
  const handleSkipToQuiz = () => {
    if (!hasTrackedCompleted) {
      setHasTrackedCompleted(true);
      trackEvent('webar_completed', { ...utmMetadataRef.current, skipped: true });
    }
    router.push('/quiz');
  };

  // CTA button handler
  const handleCtaClick = () => {
    if (!hasTrackedCompleted) {
      setHasTrackedCompleted(true);
      trackEvent('webar_completed', utmMetadataRef.current);
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
      {/* -------------------- STAGE 1: INTRO SCREEN -------------------- */}
      {stage === 'intro' && (
        <div className="relative z-10 flex flex-col items-center justify-between w-full h-full px-6 py-12 text-center bg-radial-dark">
          {/* Top Brand Header */}
          <div className="flex flex-col items-center gap-3 pt-6 animate-fade-in">
            <ShieldCrownLogo className="w-12 h-12" />
            <h2 className="text-xs font-semibold tracking-widest uppercase text-edde-gray/80 font-poppins">
              EDDE GLOBAL
            </h2>
          </div>

          {/* Central Hero Intro Content */}
          <div className="max-w-md my-auto space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white font-poppins">
              Ready to explore?
            </h1>
            <p className="text-sm sm:text-base text-edde-gray/90 leading-relaxed font-poppins">
              Your global education journey starts here.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-xs pb-6 space-y-4">
            <button
              onClick={handleStartExperience}
              disabled={isPreparing}
              className="w-full py-4 px-6 text-sm font-bold tracking-wider uppercase text-black bg-[#ffde00] hover:bg-[#ffe533] active:scale-[0.98] transition-all rounded-full shadow-lg shadow-[#ffde00]/20 font-poppins"
            >
              {isPreparing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Preparing experience…
                </span>
              ) : (
                'START EXPERIENCE'
              )}
            </button>

            <button
              onClick={handleSkipToQuiz}
              className="block w-full text-xs text-edde-gray/70 hover:text-white transition-colors underline underline-offset-4 py-2 font-poppins"
            >
              Skip the AR intro
            </button>
          </div>
        </div>
      )}

      {/* -------------------- STAGE 2: EXPERIENCE STAGE -------------------- */}
      {stage === 'experience' && (
        <div className="relative w-full h-full">
          {/* 3D or WebAR View */}
          {mode === 'ar' ? (
            <ExpoWebARExperience
              onFallback={triggerFallbackMode}
              onComplete={() => setSequenceTime(10)}
            />
          ) : (
            <Expo3DExperience
              onComplete={() => setSequenceTime(10)}
            />
          )}

          {/* OVERLAY UI (Non-blocking layer for text, clickable for buttons) */}
          <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-6">
            {/* Top Bar Header */}
            <div className="flex items-center justify-between w-full pt-2">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <ShieldCrownLogo className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-white font-poppins">
                  EDDE GLOBAL
                </span>
              </div>

              {/* Top-Right Skip Button */}
              <button
                onClick={handleSkipToQuiz}
                className="pointer-events-auto px-4 py-1.5 text-xs font-semibold text-white/90 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 rounded-full transition-all active:scale-95 font-poppins"
              >
                Skip
              </button>
            </div>

            {/* Timed Animated Text Sequences (0-2s, 2-5s, 5-7s, 7-10s) */}
            <div className="my-auto text-center space-y-6 max-w-lg mx-auto px-4">
              {/* 2s - 5s: Destination Tags Fade In */}
              {sequenceTime >= 2 && sequenceTime < 5 && (
                <div className="flex flex-wrap justify-center gap-2 animate-fade-in">
                  {DESTINATIONS.map((dest) => (
                    <span
                      key={dest.key}
                      className="px-3 py-1 text-xs font-medium text-white/90 bg-white/10 backdrop-blur-md border border-white/10 rounded-full shadow-sm font-poppins"
                    >
                      {dest.name}
                    </span>
                  ))}
                </div>
              )}

              {/* 5s - 7s: Main Headline 1 */}
              {sequenceTime >= 5 && sequenceTime < 7 && (
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight uppercase text-white font-poppins animate-fade-in drop-shadow-md">
                  YOUR FUTURE HAS NO BORDERS.
                </h2>
              )}

              {/* 7s - 10s+: Headline 2 */}
              {sequenceTime >= 7 && (
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white font-poppins animate-fade-in drop-shadow-md">
                  WHERE COULD YOUR FUTURE TAKE YOU?
                </h2>
              )}
            </div>

            {/* Bottom CTA Area (Reveals after 10s or when sequence completes) */}
            <div className="w-full max-w-xs mx-auto pb-6 text-center">
              {sequenceTime >= 10 ? (
                <button
                  onClick={handleCtaClick}
                  className="pointer-events-auto w-full py-4 px-6 text-sm font-bold tracking-wider uppercase text-black bg-[#ffde00] hover:bg-[#ffe533] active:scale-[0.98] transition-all rounded-full shadow-xl shadow-[#ffde00]/30 font-poppins animate-bounce-subtle"
                >
                  FIND MY DESTINATION
                </button>
              ) : (
                <div className="text-[11px] text-white/50 tracking-widest uppercase font-poppins">
                  Exploring global destinations…
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
            <p className="text-xs text-edde-gray/70 uppercase tracking-widest">
              Loading EDDE Global…
            </p>
          </div>
        </div>
      }
    >
      <ExpoPageInner />
    </Suspense>
  );
}
