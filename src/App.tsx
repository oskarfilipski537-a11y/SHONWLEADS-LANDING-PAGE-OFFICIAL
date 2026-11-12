/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BackgroundGlow } from './components/BackgroundGlow.tsx';
import { HeaderLogo } from './components/HeaderLogo.tsx';
import { QuizFunnel } from './components/QuizFunnel.tsx';
import { ReviewsSection } from './components/ReviewsSection.tsx';
import { Footer } from './components/Footer.tsx';
import { BookingPage } from './components/BookingPage.tsx';
import { ThankYouPage } from './components/ThankYouPage.tsx';
import { UnqualifiedPage } from './components/UnqualifiedPage.tsx';
import { QuizAnswers } from './types.ts';
import { captureUtmParams } from './utils/utm.ts';
import { initMetaPixel, trackEvent } from './utils/analytics.ts';
import { isLowestRevenueOption } from './utils/qualification.ts';

const STORAGE_STEP_KEY = 'shownleads_quiz_step';
const STORAGE_LOCKED_KEY = 'shownleads_is_locked_in';

export default function App() {
  // Hash routing: '' | '#book' | '#thank-you'
  const [currentHash, setCurrentHash] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.hash : '';
  });

  // Funnel lock-in state
  const [isLockedIn, setIsLockedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_LOCKED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [currentStep, setCurrentStep] = useState<number>(() => {
    try {
      const savedStep = sessionStorage.getItem(STORAGE_STEP_KEY);
      if (savedStep) {
        const parsed = parseInt(savedStep, 10);
        if (parsed >= 1 && parsed <= 4) return parsed;
      }
    } catch {}
    return 1;
  });

  const heroQuizRef = useRef<HTMLDivElement>(null);

  // Capture UTM & Meta parameters on initial load
  useEffect(() => {
    captureUtmParams();
    initMetaPixel();

    const handleHashChange = () => {
      const hash = window.location.hash;
      setCurrentHash(hash);
      // When navigating back to main landing page, reset form to step 1
      if (!hash || hash === '#' || hash === '#/') {
        setCurrentStep(1);
        setIsLockedIn(false);
        try {
          sessionStorage.setItem(STORAGE_LOCKED_KEY, 'false');
          sessionStorage.setItem(STORAGE_STEP_KEY, '1');
        } catch {}
      }
      document.body.style.overflow = 'auto';
      document.body.style.overflowY = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.overflowY = 'auto';
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Lead answers state for pre-filling calendar
  const [completedLead, setCompletedLead] = useState<QuizAnswers | null>(() => {
    try {
      const stored = sessionStorage.getItem('shownleads_final_lead');
      if (stored) {
        const parsed = JSON.parse(stored);
        const storedIndex = sessionStorage.getItem('shownleads_revenue_index');
        const parsedIndex = storedIndex !== null ? parseInt(storedIndex, 10) : undefined;
        return {
          fullName: parsed.full_name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          crews: parsed.crews || '',
          extraEstimates: parsed.extra_estimates || '',
          monthlyRevenue: parsed.monthly_revenue || '',
          monthlyRevenueIndex: !isNaN(parsedIndex as number) ? parsedIndex : undefined,
          consent: Boolean(parsed.consent),
          consentTimestamp: parsed.consent_timestamp || '',
        };
      }
    } catch {}
    return null;
  });

  // When step 4 is completed, route based on qualification
  const handleQuizComplete = (answers: QuizAnswers) => {
    setCompletedLead(answers);
    document.body.style.overflow = 'auto';
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.overflowY = 'auto';

    const isUnqualified = isLowestRevenueOption(answers.monthlyRevenueIndex, answers.monthlyRevenue);
    if (isUnqualified) {
      window.location.hash = '#not-fit';
      setCurrentHash('#not-fit');
    } else {
      window.location.hash = '#book';
      setCurrentHash('#book');
    }
    window.scrollTo(0, 0);
  };

  // When calendar appointment is scheduled, navigate to #thank-you
  const handleBookingConfirmed = () => {
    document.body.style.overflow = 'auto';
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.overflowY = 'auto';
    window.location.hash = '#thank-you';
    setCurrentHash('#thank-you');
    window.scrollTo(0, 0);
  };

  // Scroll to hero quiz from repeat CTA
  const scrollToQuiz = () => {
    if (isLockedIn) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (heroQuizRef.current) {
      heroQuizRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Return from Thank You page back to main page - reset to step 1
  const handleReturnToHome = () => {
    setIsLockedIn(false);
    setCurrentStep(1);
    setCompletedLead(null);
    try {
      sessionStorage.setItem(STORAGE_LOCKED_KEY, 'false');
      sessionStorage.setItem(STORAGE_STEP_KEY, '1');
      sessionStorage.removeItem('shownleads_quiz_data');
      sessionStorage.removeItem('shownleads_final_lead');
      sessionStorage.removeItem('shownleads_qualified');
      sessionStorage.removeItem('shownleads_revenue_index');
    } catch {}
    document.body.style.overflow = 'auto';
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.overflowY = 'auto';
    window.location.hash = '';
    setCurrentHash('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check whether current user is disqualified based on first (lowest) monthly revenue option position
  const isDisqualified = (() => {
    try {
      if (sessionStorage.getItem('shownleads_qualified') === 'no') return true;
    } catch {}
    if (completedLead && isLowestRevenueOption(completedLead.monthlyRevenueIndex, completedLead.monthlyRevenue)) return true;
    return false;
  })();

  // Render Disqualified Screen (#not-fit or if disqualified user attempts to access booking or thank-you page)
  if (currentHash === '#not-fit' || (isDisqualified && (currentHash === '#book' || currentHash === '#thank-you'))) {
    return (
      <div className="relative min-h-screen bg-black text-neutral-100 font-sans overflow-y-auto">
        <BackgroundGlow />
        <UnqualifiedPage />
      </div>
    );
  }

  // Render Page 3: Thank You Page (#thank-you)
  if (currentHash === '#thank-you' || currentHash.startsWith('#thank-you')) {
    return (
      <div className="relative min-h-screen bg-black text-neutral-100 font-sans overflow-y-auto">
        <BackgroundGlow />
        <ThankYouPage onReturnToHome={handleReturnToHome} />
        <Footer />
      </div>
    );
  }

  // Render Page 2: Booking Page (#book)
  if (currentHash === '#book' || currentHash.startsWith('#book')) {
    return (
      <div className="relative min-h-screen bg-black text-neutral-100 font-sans overflow-y-auto">
        <BackgroundGlow />
        <BookingPage 
          onBookingConfirmed={handleBookingConfirmed} 
          leadAnswers={completedLead}
        />
        <Footer />
      </div>
    );
  }

  // Render Page 1: Landing Page with Multi-Step Funnel
  return (
    <div className="relative min-h-screen bg-black text-neutral-100 font-sans selection:bg-amber-400/30 selection:text-amber-200">
      {/* Background glowing gradient orbs */}
      <BackgroundGlow />

      {/* Main Landing Page Content */}
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* 1. Logo Centered At Top */}
        <div className="w-full max-w-5xl px-4 pt-3 sm:pt-5">
          <HeaderLogo />
        </div>

        {/* 2. Compact Hero Section */}
        <section className="w-full max-w-4xl mx-auto px-4 pt-2 pb-8 sm:pb-12 text-center">
          {/* H1: Centered, Large, Key phrase in neon gold */}
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.18] sm:leading-[1.15] max-w-4xl mx-auto mb-3">
            Insulation Contractors making $200k a year. Get 20 price educated attic insulation estimates per month -{' '}
            <span className="text-[#FFD700] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(255,215,0,0.65)] font-black inline-block">
              And only pay per shown estimate.
            </span>
          </h1>

          {/* H2: Centered, smaller, muted */}
          <h2 className="text-xs sm:text-sm md:text-base text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8 font-normal">
            ShownLeads books qualified homeowner estimates onto your calendar. If they don't show, you don't pay. Answer 3 quick questions to see if you qualify for a strategy call.
          </h2>

          {/* 4. Single Persistent Quiz Funnel (seamless transition without unmount) */}
          <div ref={heroQuizRef} className="w-full">
            <div
              className={
                isLockedIn
                  ? 'fixed inset-0 z-50 overflow-y-auto bg-black py-4 sm:py-6 px-4 flex flex-col items-center justify-start sm:justify-center'
                  : 'w-full'
              }
              role={isLockedIn ? 'dialog' : undefined}
              aria-modal={isLockedIn ? 'true' : undefined}
              aria-label={isLockedIn ? 'Contractor Qualification Assessment' : undefined}
            >
              {isLockedIn && (
                <div className="mb-2 sm:mb-3 text-center">
                  <HeaderLogo compact />
                </div>
              )}
              <QuizFunnel
                onQuizComplete={handleQuizComplete}
                isLockedIn={isLockedIn}
                setIsLockedIn={setIsLockedIn}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
              />
            </div>
          </div>
        </section>

        {/* 5. Trust Metrics Bar & Repeat CTA */}
        <ReviewsSection onCtaClick={scrollToQuiz} />

        {/* 6. Minimal Footer */}
        <Footer />
      </div>
    </div>
  );
}
