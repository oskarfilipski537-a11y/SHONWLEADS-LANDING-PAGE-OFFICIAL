import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check, ShieldCheck, Calendar, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { QuizAnswers } from '../types.ts';
import { WEBHOOK_URL } from '../config.ts';
import { formatPhoneNumber, isValidUSPhone, isValidEmail } from '../utils/formatters.ts';
import { getPersistedUtmParams, getMetaTrackingData } from '../utils/utm.ts';
import { trackEvent } from '../utils/analytics.ts';

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

const REVENUE_OPTIONS = [
  { id: 'under_20k', label: 'Under $20k', desc: 'Early stage / starting up' },
  { id: '20k_50k', label: '$20k - $50k', desc: 'Consistent baseline revenue' },
  { id: '50k_100k', label: '$50k - $100k', desc: 'Solid local market traction' },
  { id: '100k_250k', label: '$100k - $250k', desc: 'High-volume contractor' },
  { id: '250k_plus', label: '$250k+', desc: 'Multi-crew regional leader' },
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
      if (saved) return JSON.parse(saved);
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

  // Handle Lock-In: disable escape key, handle beforeunload, and trap back button
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

    // Beforeunload confirmation warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved progress in your estimate qualification. Are you sure you want to leave?';
      return e.returnValue;
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
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLockedIn, currentStep, setCurrentStep]);

  // Advance to next step with snappy, responsive transition
  const handleSelectOption = (field: 'crews' | 'extraEstimates' | 'monthlyRevenue', value: string) => {
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
    setAnswers((prev) => ({ ...prev, [field]: value }));

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
    isValidUSPhone(answers.phone) &&
    answers.consent === true;

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
    if (!answers.consent) {
      setFormErrors((errs) => ({ ...errs, consent: 'Please check the consent box to proceed' }));
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

    const payload = {
      crews: finalAnswers.crews,
      extra_estimates: finalAnswers.extraEstimates,
      monthly_revenue: finalAnswers.monthlyRevenue,
      full_name: finalAnswers.fullName,
      email: finalAnswers.email,
      phone: finalAnswers.phone,
      consent: true,
      consent_timestamp: finalAnswers.consentTimestamp,
      page_url: window.location.href,
      submitted_at: new Date().toISOString(),
      utm_source: utmParams.utm_source || '',
      utm_medium: utmParams.utm_medium || '',
      utm_campaign: utmParams.utm_campaign || '',
      utm_term: utmParams.utm_term || '',
      utm_content: utmParams.utm_content || '',
      referrer: utmParams.referrer || document.referrer || '',
      fbclid: metaData.fbclid || utmParams.fbclid || '',
      fbp: metaData.fbp || utmParams.fbp || '',
      fbc: metaData.fbc || utmParams.fbc || '',
    };

    // Save in session storage
    try {
      sessionStorage.setItem('shownleads_final_lead', JSON.stringify(payload));
    } catch {}

    // POST to webhook in background with retry, but NEVER block the user
    const postWebhook = async () => {
      if (!WEBHOOK_URL || WEBHOOK_URL.includes('PASTE_')) {
        return;
      }
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          break; // Succeeded
        } catch (err) {
          console.warn(`Webhook POST attempt ${attempt} notice:`, err);
          if (attempt === 1) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
    };

    // Trigger webhook asynchronously
    postWebhook();

    // Show high-converting 1.5s loading sequence
    setTimeout(() => {
      setLoadingPhase('checking_capacity');
    }, 500);

    setTimeout(() => {
      setLoadingPhase('qualifying');
    }, 1000);

    setTimeout(() => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      onQuizComplete(finalAnswers);
    }, 1500);
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
      <div className="relative rounded-2xl glass-panel p-5 sm:p-7 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.7)] border border-white/10 overflow-hidden">
        
        {/* Subtle top card neon gold glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.6)] opacity-90" />

        {/* Header bar: Progress + Back button */}
        <div className="flex items-center justify-between gap-4 mb-5">
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

          <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span>Guaranteed Show-Up</span>
          </div>
        </div>

        {/* Progress Bar with Neon Gold Gradient */}
        <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden mb-6 p-[1px] border border-white/5">
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
                  Estimate appointments where the homeowner is guaranteed to show.
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
                  {REVENUE_OPTIONS.map((opt) => {
                    const isSelected = answers.monthlyRevenue === opt.label;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption('monthlyRevenue', opt.label)}
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
                      {loadingPhase === 'checking_capacity' && 'Checking homeowner demand in your area...'}
                      {loadingPhase === 'qualifying' && 'Territory open! Preparing your booking calendar...'}
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-400 max-w-sm">
                      Matching your crew capacity with pre-screened local homeowners.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitLead} noValidate className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Almost done - where should we send your booking details?
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        We'll reserve your exclusive strategy call immediately.
                      </p>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label htmlFor="fullName" className="block text-xs font-semibold text-neutral-300 mb-1.5">
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
                        className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors ${
                          formErrors.fullName && touched.fullName
                            ? 'border-rose-500/80 bg-rose-950/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        autoComplete="name"
                        required
                      />
                      {formErrors.fullName && touched.fullName && (
                        <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.fullName}</span>
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-neutral-300 mb-1.5">
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
                        className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors ${
                          formErrors.email && touched.email
                            ? 'border-rose-500/80 bg-rose-950/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        autoComplete="email"
                        required
                      />
                      {formErrors.email && touched.email && (
                        <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.email}</span>
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold text-neutral-300 mb-1.5">
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
                        className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors ${
                          formErrors.phone && touched.phone
                            ? 'border-rose-500/80 bg-rose-950/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        autoComplete="tel"
                        required
                      />
                      {formErrors.phone && touched.phone && (
                        <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.phone}</span>
                        </p>
                      )}
                    </div>

                    {/* Consent Checkbox (UNCHECKED BY DEFAULT) */}
                    <div className="pt-2">
                      <label className="flex items-start gap-3 cursor-pointer select-none group">
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input
                            type="checkbox"
                            checked={answers.consent}
                            onChange={(e) => handleConsentChange(e.target.checked)}
                            className="sr-only"
                            required
                          />
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              answers.consent
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 border-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.6)] font-bold'
                                : 'border-neutral-500 bg-white/[0.03] group-hover:border-amber-400/60'
                            }`}
                          >
                            {answers.consent && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <span className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed">
                          By checking this box, I consent to receive calls and text messages (including automated messages) from ShownLeads at the number provided regarding my inquiry and services. Consent is not a condition of purchase. Message and data rates may apply. Reply STOP to opt out. See our Privacy Policy and Terms.
                        </span>
                      </label>
                      {formErrors.consent && (
                        <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1.5 pl-8">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.consent}</span>
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={!isFormValid || isSubmitting}
                        className={`w-full py-4 px-6 rounded-xl font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                          isFormValid && !isSubmitting
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black shadow-[0_0_28px_rgba(251,191,36,0.5)] hover:shadow-[0_0_42px_rgba(251,191,36,0.8)] hover:brightness-110 active:scale-[0.99] cursor-pointer'
                            : 'bg-white/10 text-neutral-500 border border-white/5 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <span>See If I Qualify - Book My Call</span>
                        <ChevronLeft className="w-4 h-4 rotate-180 stroke-[3]" />
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Trust Line Under Quiz Card */}
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
    </div>
  );
};
