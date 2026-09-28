'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  GraduationCap,
  FileText,
  Compass,
  Award,
  Globe,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { RecommendationResult, Offer } from '@/types';

// Resilient imports for shared conventions
import { trackEvent } from '@/lib/analytics';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Disclaimer } from '@/components/ui/Disclaimer';

function ResultContent() {
  const router = useRouter();
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadResultAndOffer() {
      try {
        // Read quiz result from sessionStorage
        const storedResult = typeof window !== 'undefined' ? sessionStorage.getItem('edde_quiz_result') : null;
        if (!storedResult) {
          router.push('/quiz');
          return;
        }

        const parsedResult: RecommendationResult = JSON.parse(storedResult);
        if (isMounted) {
          setResult(parsedResult);
        }

        trackEvent('result_viewed');

        // Fetch active offer from Supabase
        const session = getSession();
        const sessionCampaign = session.campaign || session.utm_campaign || null;

        if (supabase && typeof supabase.from === 'function') {
          let query = supabase
            .from('offers')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });

          const { data, error } = await query;

          if (!error && data && data.length > 0) {
            // Filter by campaign matching if applicable
            let matchedOffer = data.find(
              (o: Offer) => o.campaign && sessionCampaign && o.campaign === sessionCampaign
            );
            if (!matchedOffer) {
              matchedOffer = data.find((o: Offer) => !o.campaign) || data[0];
            }

            if (matchedOffer && isMounted) {
              setOffer(matchedOffer);
              trackEvent('offer_viewed', { offer_id: matchedOffer.id, offer_title: matchedOffer.title });

              // Save offer to sessionStorage
              if (typeof window !== 'undefined') {
                sessionStorage.setItem(
                  'edde_offer',
                  JSON.stringify({ id: matchedOffer.id, title: matchedOffer.title })
                );
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading result page:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadResultAndOffer();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleClaimBenefit = () => {
    // Write offer details to sessionStorage before navigating
    if (typeof window !== 'undefined') {
      if (offer) {
        sessionStorage.setItem('edde_offer', JSON.stringify({ id: offer.id, title: offer.title }));
      } else {
        sessionStorage.setItem(
          'edde_offer',
          JSON.stringify({ id: 'default_expo_offer', title: 'Expo Special Advisory Session' })
        );
      }
    }
    router.push('/lead');
  };

  const handleRetakeQuiz = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('edde_quiz_result');
      sessionStorage.removeItem('edde_quiz_answers');
      sessionStorage.removeItem('edde_lead_prefill');
    }
    router.push('/quiz');
  };

  if (loading || !result) {
    return (
      <div className="min-h-screen bg-[#FDFCFE] flex items-center justify-center p-4 font-poppins">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#53226C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#53226C]">Matching your global profile...</p>
        </div>
      </div>
    );
  }

  const helpServices = [
    {
      title: 'University Selection',
      desc: 'Shortlisting top-ranked institutions suited to your profile and budget.',
      icon: GraduationCap,
    },
    {
      title: 'Application Support',
      desc: 'Expert guidance on personal statements, CVs, and official documentation.',
      icon: FileText,
    },
    {
      title: 'Admission Guidance',
      desc: 'Direct liaison with international university admissions offices.',
      icon: Compass,
    },
    {
      title: 'Scholarship Guidance',
      desc: 'Identifying merit-based, regional, and institutional financial aid.',
      icon: Award,
    },
    {
      title: 'Visa Support',
      desc: 'End-to-end student visa preparation and interview readiness.',
      icon: Globe,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFE] text-[#1a1a1a] font-poppins p-4 sm:p-6 md:p-8 max-w-xl mx-auto flex flex-col justify-between">
      <div className="space-y-8">
        {/* Header Match Hero */}
        <div className="text-center pt-2 pb-4 border-b border-gray-100">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#6a0deb] text-xs font-bold tracking-widest uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 stroke-[2]" />
            <span>YOUR GLOBAL EDUCATION MATCH</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a] uppercase mb-2">
            {result.primaryDestination}
          </h1>

          <p className="text-sm sm:text-base font-medium text-gray-600">
            {result.field} · {result.studyLevel}
          </p>

          {result.alternativeDestination && (
            <p className="text-xs text-gray-400 mt-2">
              Alternative Match: <span className="font-semibold text-gray-600">{result.alternativeDestination}</span>
            </p>
          )}
        </div>

        {/* Section: WHY IT MAY FIT */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-[#53226C] uppercase">
            WHY IT MAY FIT
          </h2>

          <ul className="space-y-3">
            {result.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-700 leading-snug">
                <div className="w-5 h-5 rounded-full bg-purple-50 text-[#53226C] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section: HOW EDDE GLOBAL CAN HELP */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-[#53226C] uppercase">
            HOW EDDE GLOBAL CAN HELP
          </h2>

          <div className="divide-y divide-gray-100">
            {helpServices.map((service, idx) => {
              const IconComp = service.icon;
              return (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#53226C] flex items-center justify-center shrink-0 mt-0.5">
                    <IconComp className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1a1a1a] mb-0.5">{service.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{service.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefit Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#53226C] via-[#431b57] to-[#2d1245] text-white p-6 shadow-md relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-[#ffde00]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffde00] text-[#1a1a1a] text-[11px] font-bold tracking-wide uppercase">
            <span>EXPO EXCLUSIVE BENEFIT</span>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight mb-1 text-white">
              {offer?.title || 'Free 1-on-1 Expo Advisory & Application Review'}
            </h3>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              {offer?.description ||
                'Claim your complimentary consultation with an EDDE Global education advisor to evaluate your application strategy and university options.'}
            </p>
          </div>

          <Button
            onClick={handleClaimBenefit}
            className="w-full py-4 px-6 rounded-xl bg-[#ffde00] text-[#1a1a1a] font-bold hover:bg-[#ebd200] transition-colors shadow-sm flex items-center justify-center gap-2 text-base"
          >
            <span>{offer?.cta_text || 'UNLOCK MY EXPO BENEFIT'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Button>
        </div>
      </div>

      {/* Footer & Retake Quiz */}
      <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-4">
        <button
          onClick={handleRetakeQuiz}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#53226C] transition-colors py-1 px-3 rounded-lg hover:bg-purple-50"
        >
          <RotateCcw className="w-3.5 h-3.5 stroke-[1.8]" />
          <span>Retake destination quiz</span>
        </button>

        <Disclaimer />
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFCFE] flex items-center justify-center p-4">
          <div className="animate-pulse text-[#53226C] font-semibold text-sm">
            Preparing your match result...
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
