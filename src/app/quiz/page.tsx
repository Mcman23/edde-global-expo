'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import { QUIZ_QUESTIONS, QuizQuestion } from '@/lib/config/quiz';
import { recommend } from '@/lib/recommendation/engine';

// Resilient module imports for shared conventions
import { trackEvent } from '@/lib/analytics';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { ProgressBar } from '@/components/ui/ProgressBar';

function QuizContent() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answersDetail, setAnswersDetail] = useState<Record<string, any>>({});
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or retrieve quiz_session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const storedSessionId = typeof window !== 'undefined' ? sessionStorage.getItem('edde_quiz_session_id') : null;
        if (storedSessionId) {
          if (isMounted) setQuizSessionId(storedSessionId);
          return;
        }

        // Restore any saved answers if user reloaded during quiz
        const storedAnswers = typeof window !== 'undefined' ? sessionStorage.getItem('edde_quiz_answers') : null;
        if (storedAnswers) {
          try {
            const parsed = JSON.parse(storedAnswers);
            if (parsed && typeof parsed === 'object') {
              if (parsed.map) setAnswers(parsed.map);
              if (parsed.details) setAnswersDetail(parsed.details);
            }
          } catch (e) {
            // ignore JSON parse error
          }
        }

        const session = getSession();
        const now = new Date().toISOString();

        if (supabase && typeof supabase.from === 'function') {
          const { data, error } = await supabase
            .from('quiz_sessions')
            .insert({
              session_id: session.session_id,
              source: session.source || null,
              campaign: session.campaign || null,
              utm_source: session.utm_source || null,
              utm_medium: session.utm_medium || null,
              utm_campaign: session.utm_campaign || null,
              started_at: now,
            })
            .select('id')
            .single();

          if (!error && data?.id) {
            if (isMounted) setQuizSessionId(data.id);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('edde_quiz_session_id', data.id);
            }
          }
        }

        trackEvent('quiz_started');
      } catch (err) {
        console.error('Error initializing quiz session:', err);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentQuestion: QuizQuestion = QUIZ_QUESTIONS[currentIndex];
  const totalQuestions = QUIZ_QUESTIONS.length;

  // Handle Option Tap
  const handleSelectOption = async (optionKey: string, optionText: string) => {
    if (isSubmitting) return;

    const questionKey = currentQuestion.question_key;
    const questionText = currentQuestion.question_text;

    // Track answer
    trackEvent('quiz_question_answered', { question: questionKey, option: optionKey });

    const newAnswers = { ...answers, [questionKey]: optionKey };
    const newDetails = {
      ...answersDetail,
      [questionKey]: { option_key: optionKey, question_text: questionText, option_text: optionText },
    };

    setAnswers(newAnswers);
    setAnswersDetail(newDetails);

    // Save to sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'edde_quiz_answers',
        JSON.stringify({ map: newAnswers, details: newDetails })
      );
    }

    // Fire-and-forget insert to quiz_answers table
    if (quizSessionId && supabase && typeof supabase.from === 'function') {
      supabase
        .from('quiz_answers')
        .insert({
          quiz_session_id: quizSessionId,
          question_key: questionKey,
          option_key: optionKey,
          question_text: questionText,
          option_text: optionText,
        })
        .then(
          () => {},
          () => {}
        );
    }

    // Check if there are more questions
    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Completed last question (Q6)
      setIsSubmitting(true);
      try {
        const result = recommend(newAnswers);

        // Store result & prefill in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('edde_quiz_result', JSON.stringify(result));
          sessionStorage.setItem(
            'edde_lead_prefill',
            JSON.stringify({
              preferred_destination: result.primaryDestination,
              study_level: result.studyLevel,
              intended_intake: result.intake,
            })
          );
        }

        const session = getSession();

        // Insert quiz_results
        if (quizSessionId && supabase && typeof supabase.from === 'function') {
          await supabase
            .from('quiz_results')
            .insert({
              quiz_session_id: quizSessionId,
              session_id: session.session_id,
              primary_destination: result.primaryDestination,
              study_level: result.studyLevel,
              field: result.field,
              intake: result.intake,
              budget_category: result.budgetCategory,
              alternative_destination: result.alternativeDestination,
              reasons: result.reasons,
            })
            .then(
              () => {},
              () => {}
            );

          // Set completed_at on quiz_sessions
          await supabase
            .from('quiz_sessions')
            .update({ completed_at: new Date().toISOString() })
            .eq('id', quizSessionId)
            .then(
              () => {},
              () => {}
            );
        }

        trackEvent('quiz_completed');
        router.push('/result');
      } catch (err) {
        console.error('Error completing quiz:', err);
        router.push('/result');
      }
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

  const selectedOptionKey = answers[currentQuestion.question_key];

  return (
    <div className="min-h-screen bg-[#FDFCFE] text-[#1a1a1a] font-poppins flex flex-col justify-between p-4 sm:p-6 md:p-8 max-w-xl mx-auto">
      {/* Top Header & Navigation */}
      <div>
        <div className="flex items-center justify-between mb-6">
          {currentIndex > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#53226C] transition-colors py-1 px-2.5 rounded-lg hover:bg-purple-50"
              aria-label="Previous question"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2]" />
              <span>Back</span>
            </button>
          ) : (
            <div className="w-16" />
          )}

          <div className="text-center">
            <span className="text-xs font-bold tracking-widest text-[#53226C] uppercase">
              QUESTION {currentIndex + 1} OF {totalQuestions}
            </span>
          </div>

          <div className="w-16" />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar currentStep={currentIndex + 1} totalSteps={totalQuestions} />
        </div>

        {/* Quiz Headline & Subheadline */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] mb-2 uppercase">
            FIND YOUR STUDY DESTINATION
          </h1>
          <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            Answer a few questions and discover which destination may fit your goals.
          </p>
        </div>

        {/* Question & Options Area with Framer Motion */}
        <div className="relative min-h-[340px] mt-4">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion.key}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full space-y-4"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-center text-[#53226C] mb-6">
                {currentQuestion.question_text}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOptionKey === option.key;

                  return (
                    <button
                      key={option.key}
                      onClick={() => handleSelectOption(option.key, option.option_text)}
                      disabled={isSubmitting}
                      className={`w-full text-left py-4 px-5 rounded-2xl border transition-all duration-200 flex items-center justify-between min-h-[56px] text-base font-medium touch-manipulation ${
                        isSelected
                          ? 'border-[#6a0deb] bg-purple-50/70 text-[#53226C] shadow-sm ring-1 ring-[#6a0deb]'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-[#6a0deb]/40 hover:bg-gray-50/80 active:scale-[0.99]'
                      }`}
                    >
                      <span>{option.option_text}</span>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#53226C] text-white flex items-center justify-center shrink-0 ml-2">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-gray-300 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 pt-4 text-center border-t border-gray-100">
        <p className="text-xs text-gray-400 font-medium">EDDE Global · International Education Consultancy</p>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFCFE] flex items-center justify-center p-4">
          <div className="animate-pulse text-[#53226C] font-semibold text-sm">
            Loading destination quiz...
          </div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
