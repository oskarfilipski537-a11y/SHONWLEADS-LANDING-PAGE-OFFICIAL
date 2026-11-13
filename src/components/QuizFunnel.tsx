import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check, ShieldCheck, Calendar, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { QuizAnswers } from '../types.ts';
import { WEBHOOK_URL } from '../config.ts';
import { formatPhoneNumber, isValidUSPhone, isValidEmail, splitFullName } from '../utils/formatters.ts';
import { getPersistedUtmParams, getMetaTrackingData } from '../utils/utm.ts';
import { trackEvent } from '../utils/analytics.ts';
import { REVENUE_OPTIONS, isLowestRevenueOption } from '../utils/qualification.ts';

const STORAGE_QUIZ_KEY = 'shownleads_quiz_data';
const STORAGE_STEP_KEY = 'shownleads_quiz_step';
const STORAGE_LOCKED_KEY = 'shownleads_is_locked_in';

interface QuizFunnelProps {
  onQuizComplete: (answers: QuizAnswers) => void;
  isLockedIn: boolean;
  setIsLockedIn: (locked: boolean) => void;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
}

const CREW_OPTIONS = [
  { id: '1_crew', label: '1 crew', desc: 'Owner-operator with active hands on deck' },
  { id: '2_crews', label: '2 crews', desc: 'Growing operation looking to keep trucks full' },
  { id: '3_4_crews', label: '3-4 crews', desc: 'Established business needing steady estimate volume' },
  { id: '5_plus_crews', label: '5+ crews', desc: 'Enterprise contractor with dedicated sales team' },
];

const ESTIMATE_OPTIONS = [
  { id: '1_5', label: '1-5 estimates', desc: 'Fill gaps in weekly schedule' },
  { id: '6_10', label: '6-10 estimates', desc: 'Ideal for 1-2 dedicated sales estimators' },
  { id: '11_20', label: '11-20 estimates', desc: 'Aggressive growth across multiple zip codes' },
  { id: '20_plus', label: '20+ estimates', desc: 'Maximum regional territory expansion' },
];

export const QuizFunnel: React.FC<QuizFunnelProps> = ({
  onQuizComplete,
  isLockedIn,
  setIsLockedIn,
  currentStep,
  setCurrentStep,
}) => {
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [answers, setAnswers] = useState<QuizAnswers>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_QUIZ_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, consent: false };
      }
    } catch {}
    return {
      crews: '',
      extraEstimates: '',
      monthlyRevenue: '',
      fullName: '',
      email: '',
      phone: '',
      consent: false,
      consentTimestamp: '',
    };
  });

  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    consent?: string;
  }>({});

  const [touched, setTouched] = useState<{
    fullName?: boolean;
    email?: boolean;
    phone?: boolean;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<'validating' | 'checking_capacity' | 'qualifying' | ''>('');
  const viewContentFiredRef = useRef(false);
  const leadFiredRef = useRef(false);

  // Persist answers
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_QUIZ_KEY, JSON.stringify(answers));
    } catch {}
  }, [answers]);

  // Persist step and locked status
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_STEP_KEY, currentStep.toString());
      sessionStorage.setItem(STORAGE_LOCKED_KEY, isLockedIn ? 'true' : 'false');
    } catch {}
  }, [currentStep, isLockedIn]);

  // Handle Lock-In: disable escape key and trap back button
  useEffect(() => {
    if (!isLockedIn) return;

    // Lock body scroll only while modal overlay is active
    document.body.style.overflow = 'hidden';

    // Trap Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
      }
    };

    // Push initial history state for lock-in if not present
    window.history.pushState({ funnel: true, step: currentStep }, '');

    // Trap browser back button: move to previous step, never leave the funnel
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (currentStep > 1) {
        setSlideDirection('backward');
        setCurrentStep((prev) => Math.max(1, prev - 1));
      } else {
        // At step 1, push state again so back button stays put
        window.history.pushState({ funnel: true, step: 1 }, '');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLockedIn, currentStep, setCurrentStep]);

  // Advance to next step with snappy, responsive transition
  const handleSelectOption = (
    field: 'crews' | 'extraEstimates' | 'monthlyRevenue',
    value: string,
    index?: number
  ) => {
    // Fire Meta Pixel ViewContent event when first quiz question is answered
    if (currentStep === 1 || field === 'crews') {
      if (!viewContentFiredRef.current) {
        viewContentFiredRef.current = true;
        trackEvent('ViewContent', {
          content_name: 'Quiz Question 1 Answered',
          content_category: 'Contractor Quiz',
          step: 1,
          selected_crews: value,
        });
      }
    }

    // Immediate state update for zero click lag
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'monthlyRevenue' && typeof index === 'number' ? { monthlyRevenueIndex: index } : {}),
    }));

    // If this is step 1, trigger lock-in smoothly
    if (!isLockedIn) {
      setIsLockedIn(true);
    }

    setSlideDirection('forward');
    // Snappy 130ms transition gives instant feedback without perceptible lag
    setTimeout(() => {
      window.history.pushState({ funnel: true, step: currentStep + 1 }, '');
      setCurrentStep((prev) => Math.min(4, prev + 1));
    }, 130);
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setSlideDirection('backward');
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Step 4 field handlers
  const handleNameChange = (val: string) => {
    setAnswers((prev) => ({ ...prev, fullName: val }));
    if (touched.fullName) {
      if (!val.trim()) {
        setFormErrors((errs) => ({ ...errs, fullName: 'Please enter your full name' }));
      } else {
        setFormErrors((errs) => ({ ...errs, fullName: undefined }));
      }
    }
  };

  const handleEmailChange = (val: string) => {
    setAnswers((prev) => ({ ...prev, email: val }));
    if (touched.email) {
      if (!val.trim()) {
        setFormErrors((errs) => ({ ...errs, email: 'Please enter your email address' }));
      } else if (!isValidEmail(val)) {
        setFormErrors((errs) => ({ ...errs, email: 'Please enter a valid email address' }));
      } else {
        setFormErrors((errs) => ({ ...errs, email: undefined }));
      }
    }
  };

  const handlePhoneChange = (val: string) => {
    const formatted = formatPhoneNumber(val);
    setAnswers((prev) => ({ ...prev, phone: formatted }));
    if (touched.phone) {
      if (!formatted.trim()) {
        setFormErrors((errs) => ({ ...errs, phone: 'Please enter your direct phone number' }));
      } else if (!isValidUSPhone(formatted)) {
        setFormErrors((errs) => ({ ...errs, phone: 'Please enter a valid 10-digit US phone number' }));
      } else {
        setFormErrors((errs) => ({ ...errs, phone: undefined }));
      }
    }
  };

  const handleConsentChange = (checked: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      consent: checked,
      consentTimestamp: checked ? new Date().toISOString() : '',
    }));
    if (checked) {
      setFormErrors((errs) => ({ ...errs, consent: undefined }));
    }
  };

  const isFormValid =
    answers.fullName.trim().length > 1 &&
    isValidEmail(answers.email) &&
    isValidUSPhone(answers.phone);

  // Final submission of Step 4
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched to trigger any validation messages
    setTouched({ fullName: true, email: true, phone: true });

    if (!answers.fullName.trim()) {
      setFormErrors((errs) => ({ ...errs, fullName: 'Please enter your full name' }));
      return;
    }
    if (!isValidEmail(answers.email)) {
      setFormErrors((errs) => ({ ...errs, email: 'Please enter a valid email address' }));
      return;
    }
    if (!isValidUSPhone(answers.phone)) {
      setFormErrors((errs) => ({ ...errs, phone: 'Please enter a valid 10-digit US phone number' }));
      return;
    }

    setIsSubmitting(true);
    setLoadingPhase('validating');

    // Prepare complete payload
    const utmParams = getPersistedUtmParams();
    const metaData = getMetaTrackingData();
    const finalAnswers: QuizAnswers = {
      ...answers,
      consentTimestamp: new Date().toISOString(),
    };

    const { firstName, lastName } = splitFullName(finalAnswers.fullName);

    // Position-based check: First (lowest) option in the list is NOT qualified whatever its text
    const isLowestOption = isLowestRevenueOption(finalAnswers.monthlyRevenueIndex, finalAnswers.monthlyRevenue);
    const qualifiedStatus = isLowestOption ? 'no' : 'yes';

    const hasConsent = Boolean(finalAnswers.consent);

    // Exact keys requested + GoHighLevel tags: "sms-consent" if ticked, no tag if unticked
    const payload = {
      full_name: finalAnswers.fullName.trim(),
      first_name: firstName,
      last_name: lastName,
      email: finalAnswers.email.trim(),
      phone: finalAnswers.phone.trim(),
      crews: finalAnswers.crews,
      monthly_revenue: finalAnswers.monthlyRevenue,
      extra_estimates: finalAnswers.extraEstimates,
      consent: hasConsent,
      sms_consent: hasConsent ? 'yes' : 'no',
      tag: hasConsent ? 'sms-consent' : '',
      tags: hasConsent ? 'sms-consent' : '',
      consent_timestamp: hasConsent ? (finalAnswers.consentTimestamp || new Date().toISOString()) : '',
      qualified: qualifiedStatus,
      fbp: metaData.fbp || utmParams.fbp || '',
      fbc: metaData.fbc || utmParams.fbc || '',
      fbclid: metaData.fbclid || utmParams.fbclid || '',
    };

    // Save in session storage
    try {
      sessionStorage.setItem('shownleads_final_lead', JSON.stringify(payload));
      sessionStorage.setItem('shownleads_qualified', qualifiedStatus);
      if (typeof finalAnswers.monthlyRevenueIndex === 'number') {
        sessionStorage.setItem('shownleads_revenue_index', finalAnswers.monthlyRevenueIndex.toString());
      }
    } catch {}

    // Trigger the standard Meta Lead event on successful form submission (only if qualified, not on ordinary page visits)
    if (!leadFiredRef.current && qualifiedStatus === 'yes') {
      leadFiredRef.current = true;
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        try {
          window.fbq('track', 'Lead');
        } catch (e) {
          console.warn('Notice firing Lead pixel event:', e);
        }
      } else {
        trackEvent('Lead');
      }
    }

    // 1. Create or update contact directly in GoHighLevel via server-side API route BEFORE calendar loads
    const syncContactToGhl = async (): Promise<boolean> => {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const response = await fetch('/api/ghl-contact', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              fullName: finalAnswers.fullName.trim(),
              firstName,
              lastName,
              email: finalAnswers.email.trim(),
              phone: finalAnswers.phone.trim(),
              consent: hasConsent,
            }),
            keepalive: true,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            return true;
          }
          const errData = await response.json().catch(() => ({}));
          console.warn(`GHL API sync attempt ${attempt} notice:`, response.status, errData);
          if (response.status >= 400 && response.status < 500) {
            // Do not retry client/validation errors
            return false;
          }
        } catch (err) {
          console.warn(`GHL API sync attempt ${attempt} notice:`, err);
        }
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
      return false;
    };

    // 2. Also POST full quiz payload to GoHighLevel webhook if configured
    const postWebhook = async (): Promise<boolean> => {
      if (!WEBHOOK_URL || WEBHOOK_URL.includes('PASTE_')) {
        return false;
      }
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(payload),
            keepalive: true,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            return true;
          }
        } catch (err) {
          console.warn(`GHL Webhook POST attempt ${attempt} notice:`, err);
          if (attempt === 1) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      }
      return false;
    };

    // Run GHL contact creation, webhook, and smooth qualification sequence concurrently
    const ghlApiPromise = syncContactToGhl();
    const webhookPromise = postWebhook();

    setTimeout(() => {
      setLoadingPhase('checking_capacity');
    }, 450);

    setTimeout(() => {
      setLoadingPhase('qualifying');
    }, 950);

    const minDelayPromise = new Promise((resolve) => setTimeout(resolve, 1400));

    // Ensure the contact is created/updated in GHL BEFORE navigating to calendar
    await Promise.all([ghlApiPromise, webhookPromise, minDelayPromise]);

    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    onQuizComplete(finalAnswers);
  };

  // Animation variants
  const slideVariants = {
    initial: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? 24 : -24,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.18, ease: 'easeOut' as const },
    },
    exit: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? -24 : 24,
      opacity: 0,
      transition: { duration: 0.14, ease: 'easeIn' as const },
    }),
  };

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Quiz Container Card with Glowing Glassmorphism */}
      <div className={`relative rounded-2xl glass-panel ${currentStep === 4 ? 'p-4 sm:p-6' : 'p-5 sm:p-7 md:p-8'} shadow-[0_8px_32px_rgba(0,0,0,0.7)] border border-white/10 overflow-hidden`}>
        
        {/* Subtle top card neon gold glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.6)] opacity-90" />

        {/* Header bar: Progress + Back button */}
        <div className={`flex items-center justify-between gap-4 ${currentStep === 4 ? 'mb-3 sm:mb-4' : 'mb-5'}`}>
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleStepBack}
                disabled={isSubmitting}
                className="p-1.5 -ml-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
                aria-label="Go to previous question"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
              Step {currentStep} of 4
            </span>
          </div>

          {currentStep < 4 ? (
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <span>Pay Only For Shown Estimates</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <span>Contact Details</span>
            </div>
          )}
        </div>

        {/* Progress Bar with Neon Gold Gradient */}
        <div className={`w-full h-2 bg-neutral-900 rounded-full overflow-hidden ${currentStep === 4 ? 'mb-4' : 'mb-6'} p-[1px] border border-white/5`}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.7)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </div>

        {/* Step Content Carousel */}
        <div className="relative min-h-[300px] flex flex-col justify-center">
          <AnimatePresence mode="wait" custom={slideDirection}>
            {/* STEP 1: CREW COUNT (VERTICAL OPTIONS) */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                custom={slideDirection}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-1.5 tracking-tight">
                  How many crews do you run?
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 text-center mb-5">
                  Select your current active crew capacity.
                </p>

                <div className="flex flex-col gap-2.5">
                  {CREW_OPTIONS.map((opt) => {
                    const isSelected = answers.crews === opt.label;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption('crews', opt.label)}
                        className={`group relative text-left px-5 py-3.5 rounded-xl border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.99] cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/20 border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.3)]'
                            : 'bg-white/[0.03] border-white/10 hover:border-amber-400/40 hover:bg-amber-400/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-base sm:text-lg font-semibold text-white group-hover:text-amber-300 transition-colors">
                              {opt.label}
                            </span>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors ${
                              isSelected
                                ? 'border-amber-400 bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.7)]'
                                : 'border-neutral-600 group-hover:border-neutral-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: EXTRA ESTIMATES (VERTICAL OPTIONS) */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                custom={slideDirection}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-1.5 tracking-tight">
                  How many extra estimates could you handle per month?
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 text-center mb-5">
                  Estimate appointments where you only pay when the homeowner shows.
                </p>

                <div className="flex flex-col gap-2.5">
                  {ESTIMATE_OPTIONS.map((opt) => {
                    const isSelected = answers.extraEstimates === opt.label;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption('extraEstimates', opt.label)}
                        className={`group relative text-left px-5 py-3.5 rounded-xl border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.99] cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/20 border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.3)]'
                            : 'bg-white/[0.03] border-white/10 hover:border-amber-400/40 hover:bg-amber-400/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-base sm:text-lg font-semibold text-white group-hover:text-amber-300 transition-colors">
                              {opt.label}
                            </span>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors ${
                              isSelected
                                ? 'border-amber-400 bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.7)]'
                                : 'border-neutral-600 group-hover:border-neutral-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3: MONTHLY REVENUE (VERTICAL OPTIONS) */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                custom={slideDirection}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-1.5 tracking-tight">
                  What's your average monthly revenue?
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 text-center mb-5">
                  Helps us calculate projected ROI and territory allocation.
                </p>

                <div className="flex flex-col gap-2.5">
                  {REVENUE_OPTIONS.map((opt, index) => {
                    const isSelected =
                      answers.monthlyRevenueIndex !== undefined
                        ? answers.monthlyRevenueIndex === index
                        : answers.monthlyRevenue === opt.label;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption('monthlyRevenue', opt.label, index)}
                        className={`group relative text-left px-5 py-3 rounded-xl border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.99] cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/20 border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.3)]'
                            : 'bg-white/[0.03] border-white/10 hover:border-amber-400/40 hover:bg-amber-400/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm sm:text-base font-semibold text-white group-hover:text-amber-300 transition-colors">
                              {opt.label}
                            </span>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors ${
                              isSelected
                                ? 'border-amber-400 bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.7)]'
                                : 'border-neutral-600 group-hover:border-neutral-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 4: CONTACT & CONSENT FORM */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                custom={slideDirection}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                {isSubmitting ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 animate-spin flex items-center justify-center p-[2px] shadow-[0_0_24px_rgba(251,191,36,0.6)]">
                        <div className="w-full h-full bg-black rounded-full" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-amber-400 animate-pulse" />
                      </div>
                    </div>

                    <h4 className="text-xl font-bold text-white mb-2">
                      {loadingPhase === 'validating' && 'Verifying your contractor qualifications...'}
                      {loadingPhase === 'checking_capacity' && (isLowestRevenueOption(answers.monthlyRevenueIndex, answers.monthlyRevenue) ? 'Reviewing contractor capacity criteria...' : 'Checking homeowner demand in your area...')}
                      {loadingPhase === 'qualifying' && (isLowestRevenueOption(answers.monthlyRevenueIndex, answers.monthlyRevenue) ? 'Finalizing qualification status...' : 'Territory open! Preparing your booking calendar...')}
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-400 max-w-sm">
                      {isLowestRevenueOption(answers.monthlyRevenueIndex, answers.monthlyRevenue)
                        ? 'Analyzing service criteria for your business.'
                        : 'Matching your crew capacity with pre-screened local homeowners.'}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitLead} noValidate className="space-y-3 sm:space-y-3.5">
                    <div className="text-center mb-2.5 sm:mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Almost done – where should we send your booking details?
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        We'll reserve your exclusive strategy call immediately.
                      </p>
                      <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
                        This form is for contractors booking a strategy call with ShownLeads.
                      </p>
                    </div>

                    {/* Full Name & Email in 2 columns on desktop for optimal vertical space */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      {/* Full Name */}
                      <div>
                        <label htmlFor="fullName" className="block text-xs font-semibold text-neutral-300 mb-1">
                          Full Name <span className="text-amber-400">*</span>
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          value={answers.fullName}
                          onChange={(e) => handleNameChange(e.target.value)}
                          onBlur={() => {
                            setTouched((t) => ({ ...t, fullName: true }));
                            if (!answers.fullName.trim()) {
                              setFormErrors((errs) => ({ ...errs, fullName: 'Please enter your full name' }));
                            }
                          }}
                          placeholder="e.g. Marcus Vance"
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors ${
                            formErrors.fullName && touched.fullName
                              ? 'border-rose-500/80 bg-rose-950/10'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                          autoComplete="name"
                          required
                        />
                        {formErrors.fullName && touched.fullName && (
                          <p className="flex items-center gap-1 text-[11px] text-rose-400 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{formErrors.fullName}</span>
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="block text-xs font-semibold text-neutral-300 mb-1">
                          Email Address <span className="text-amber-400">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={answers.email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          onBlur={() => {
                            setTouched((t) => ({ ...t, email: true }));
                            if (!answers.email.trim() || !isValidEmail(answers.email)) {
                              setFormErrors((errs) => ({ ...errs, email: 'Please enter a valid email address' }));
                            }
                          }}
                          placeholder="marcus@apexroofing.com"
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors ${
                            formErrors.email && touched.email
                              ? 'border-rose-500/80 bg-rose-950/10'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                          autoComplete="email"
                          required
                        />
                        {formErrors.email && touched.email && (
                          <p className="flex items-center gap-1 text-[11px] text-rose-400 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{formErrors.email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold text-neutral-300 mb-1">
                        Phone Number (US Format) <span className="text-amber-400">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={answers.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        onBlur={() => {
                          setTouched((t) => ({ ...t, phone: true }));
                          if (!isValidUSPhone(answers.phone)) {
                            setFormErrors((errs) => ({ ...errs, phone: 'Please enter a valid 10-digit US phone number' }));
                          }
                        }}
                        placeholder="(555) 123-4567"
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors ${
                          formErrors.phone && touched.phone
                            ? 'border-rose-500/80 bg-rose-950/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        autoComplete="tel"
                        required
                      />
                      {formErrors.phone && touched.phone && (
                        <p className="flex items-center gap-1 text-[11px] text-rose-400 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.phone}</span>
                        </p>
                      )}
                      <p className="text-[11px] sm:text-xs text-neutral-400 mt-1">
                        We use this number to confirm and remind you about your strategy call.
                      </p>
                    </div>

                    {/* Consent Checkbox (UNCHECKED BY DEFAULT) */}
                    <div className="pt-1">
                      <label className="flex items-start gap-3 cursor-pointer select-none group">
                        <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={answers.consent}
                            onChange={(e) => handleConsentChange(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              answers.consent
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 border-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.6)] font-bold'
                                : 'border-neutral-400 bg-white/[0.04] group-hover:border-amber-400'
                            }`}
                          >
                            {answers.consent && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <span className="text-[14px] leading-relaxed text-neutral-100 font-normal">
                          By checking this box, I agree to receive text messages from ShownLeads at the number provided with confirmations and reminders about my booked call. Message frequency varies (up to 5 messages per booking). Message and data rates may apply. Reply STOP to cancel or HELP for help. Consent is not a condition of purchase. See our{' '}
                          <a
                            href="https://www.shownleads.com/privacy-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-white hover:text-amber-300 underline underline-offset-2 font-medium cursor-pointer"
                          >
                            Privacy Policy
                          </a>{' '}
                          and{' '}
                          <a
                            href="https://www.shownleads.com/terms-and-conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-white hover:text-amber-300 underline underline-offset-2 font-medium cursor-pointer"
                          >
                            Terms
                          </a>
                          .
                        </span>
                      </label>
                      {formErrors.consent && (
                        <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1 pl-8">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.consent}</span>
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={!isFormValid || isSubmitting}
                        className={`w-full py-3.5 sm:py-4 px-6 rounded-xl font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                          isFormValid && !isSubmitting
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black shadow-[0_0_28px_rgba(251,191,36,0.5)] hover:shadow-[0_0_42px_rgba(251,191,36,0.8)] hover:brightness-110 active:scale-[0.99] cursor-pointer'
                            : 'bg-white/10 text-neutral-500 border border-white/5 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <span>See If I Qualify – Book My Call</span>
                        <ChevronLeft className="w-4 h-4 rotate-180 stroke-[3]" />
                      </button>
                    </div>

                    {/* Directly below the button footer */}
                    <div className="pt-2.5 pb-1 text-center text-[13px] leading-relaxed text-neutral-300">
                      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                        <a
                          href="https://www.shownleads.com/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-200 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          Privacy Policy
                        </a>
                        <span className="text-neutral-500 select-none" aria-hidden="true">|</span>
                        <a
                          href="https://www.shownleads.com/terms-and-conditions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-200 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          SMS Terms & Conditions
                        </a>
                        <span className="text-neutral-500 select-none" aria-hidden="true">|</span>
                        <a
                          href="mailto:info@shownleads.com"
                          className="text-neutral-200 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          info@shownleads.com
                        </a>
                      </div>
                      <p className="mt-1 text-neutral-400 text-[12px] sm:text-[13px]">
                        ShownLeads, a trading name of Oskar Jan Filipski, 2 Windmill Close, Cashel, Co. Tipperary, E25 AV62, Ireland
                      </p>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Trust Line Under Quiz Card - only on steps 1-3 */}
      {currentStep < 4 && (
        <div className="mt-4 pt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            <span>Pay only for estimates that show up</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            <span>Direct homeowner calendar bookings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            <span>256-bit SSL encrypted & spam-free</span>
          </div>
        </div>
      )}
    </div>
  );
};
