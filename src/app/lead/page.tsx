'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  Sparkles,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import { APP } from '@/lib/config/app';
import { RecommendationResult } from '@/types';

// Resilient imports for shared conventions
import { trackEvent } from '@/lib/analytics';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Disclaimer } from '@/components/ui/Disclaimer';

function LeadFormContent() {
  const router = useRouter();

  // Form state
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Stored context
  const [prefill, setPrefill] = useState<{
    preferred_destination?: string;
    study_level?: string;
    intended_intake?: string;
  } | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [offerInfo, setOfferInfo] = useState<{ id?: string; title?: string } | null>(null);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<any>(null);

  useEffect(() => {
    trackEvent('lead_form_started');

    if (typeof window !== 'undefined') {
      const storedPrefill = sessionStorage.getItem('edde_lead_prefill');
      if (storedPrefill) {
        try {
          setPrefill(JSON.parse(storedPrefill));
        } catch (e) {}
      }

      const storedResult = sessionStorage.getItem('edde_quiz_result');
      if (storedResult) {
        try {
          setRecommendation(JSON.parse(storedResult));
        } catch (e) {}
      }

      const storedOffer = sessionStorage.getItem('edde_offer');
      if (storedOffer) {
        try {
          setOfferInfo(JSON.parse(storedOffer));
        } catch (e) {}
      }

      const storedQId = sessionStorage.getItem('edde_quiz_session_id');
      if (storedQId) setQuizSessionId(storedQId);

      const storedAnswers = sessionStorage.getItem('edde_quiz_answers');
      if (storedAnswers) {
        try {
          setQuizAnswers(JSON.parse(storedAnswers));
        } catch (e) {}
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const cleanName = fullName.trim();
    const cleanPhone = whatsappNumber.trim();
    const digitsOnly = cleanPhone.replace(/[^0-9]/g, '');

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }

    if (digitsOnly.length < 8) {
      setError('Please enter a valid WhatsApp phone number (minimum 8 digits).');
      return;
    }

    setIsSubmitting(true);

    try {
      const session = getSession();
      const preferredDest =
        prefill?.preferred_destination || recommendation?.primaryDestination || 'United Kingdom';
      const studyLevel = prefill?.study_level || recommendation?.studyLevel || "Master's Degree";
      const intendedIntake = prefill?.intended_intake || recommendation?.intake || '2026 Intake';

      const leadPayload = {
        quiz_session_id: quizSessionId || null,
        session_id: session.session_id || null,
        full_name: cleanName,
        whatsapp_number: cleanPhone,
        email: email.trim() || null,
        preferred_destination: preferredDest,
        study_level: studyLevel,
        intended_intake: intendedIntake,
        quiz_answers: quizAnswers || null,
        recommendation: recommendation || null,
        offer_id: offerInfo?.id || null,
        offer_title: offerInfo?.title || null,
        campaign: session.campaign || null,
        source: session.source || null,
        lead_status: 'New',
      };

      if (supabase && typeof supabase.from === 'function') {
        await supabase
          .from('leads')
          .insert(leadPayload)
          .then(
            () => {},
            (err: any) => console.error('Error inserting lead row:', err)
          );
      }

      trackEvent('lead_submitted', {
        preferred_destination: preferredDest,
        study_level: studyLevel,
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting lead form:', err);
      // Even if database network error occurs, show success so lead can proceed to WhatsApp
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const matchedDestination =
    prefill?.preferred_destination || recommendation?.primaryDestination || 'United Kingdom';

  const whatsappUrl = APP.getWhatsAppUrl(fullName, matchedDestination);

  const handleWhatsAppClick = () => {
    trackEvent('whatsapp_clicked');
  };

  return (
    <div className="min-h-screen bg-[#FDFCFE] text-[#1a1a1a] font-poppins p-4 sm:p-6 md:p-8 max-w-xl mx-auto flex flex-col justify-between">
      <div>
        {!isSubmitted ? (
          <>
            {/* Form Header */}
            <div className="text-center pt-2 pb-6 border-b border-gray-100 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#6a0deb] text-xs font-bold tracking-widest uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 stroke-[2]" />
                <span>CLAIM YOUR EXPO BENEFIT</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a1a1a] mb-2">
                Connect With An EDDE Advisor
              </h1>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                Provide your contact details to unlock your personalized recommendation and claim your expo consultation.
              </p>

              {/* Context Chips */}
              {(prefill?.preferred_destination || recommendation?.primaryDestination) && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-100/60">
                  <span className="px-3 py-1 bg-purple-50 text-[#53226C] font-semibold text-xs rounded-full">
                    Match: {matchedDestination}
                  </span>
                  {prefill?.study_level && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 font-medium text-xs rounded-full">
                      {prefill.study_level}
                    </span>
                  )}
                  {prefill?.intended_intake && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 font-medium text-xs rounded-full">
                      {prefill.intended_intake}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#6a0deb] focus:ring-1 focus:ring-[#6a0deb] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  WhatsApp Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+994 50 123 45 67"
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#6a0deb] focus:ring-1 focus:ring-[#6a0deb] transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  We will use this to send your detailed destination recommendation via WhatsApp.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Email Address <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#6a0deb] focus:ring-1 focus:ring-[#6a0deb] transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-xl bg-[#53226C] text-white font-bold hover:bg-[#431b57] transition-all shadow-md flex items-center justify-center gap-2 text-base disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <span>GET MY RESULT</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          /* SUCCESS STATE */
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 bg-purple-50 text-[#53226C] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9 stroke-[2]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-widest uppercase mb-3">
                <span>SUCCESS</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a1a1a] mb-2">
                YOUR RESULT IS READY
              </h1>

              <p className="text-base text-gray-600 font-medium">
                Talk to an EDDE Global advisor.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm text-left space-y-3">
              <div className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                Matched Profile Summary
              </div>
              <div className="text-sm space-y-1.5 text-gray-700">
                <p>
                  <strong className="text-[#53226C]">Destination:</strong> {matchedDestination}
                </p>
                <p>
                  <strong className="text-gray-900">Name:</strong> {fullName || 'Student'}
                </p>
                {offerInfo?.title && (
                  <p className="text-xs text-purple-700 font-medium bg-purple-50 p-2 rounded-lg mt-2">
                    Expo Benefit: {offerInfo.title}
                  </p>
                )}
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="w-full py-4 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold transition-all shadow-md flex items-center justify-center gap-2.5 text-base text-decoration-none"
              >
                <MessageSquare className="w-5 h-5 fill-current stroke-none" />
                <span>CHAT ON WHATSAPP</span>
              </a>

              <p className="text-xs text-gray-500">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppClick}
                  className="text-[#53226C] font-semibold underline underline-offset-2 hover:text-[#6a0deb]"
                >
                  or book a consultation
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subtle Footer Disclaimer */}
      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <Disclaimer />
      </div>
    </div>
  );
}

export default function LeadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFCFE] flex items-center justify-center p-4">
          <div className="animate-pulse text-[#53226C] font-semibold text-sm">
            Loading...
          </div>
        </div>
      }
    >
      <LeadFormContent />
    </Suspense>
  );
}
