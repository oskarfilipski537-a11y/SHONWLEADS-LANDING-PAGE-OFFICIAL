import React, { useEffect, useRef } from 'react';
import { HeaderLogo } from './HeaderLogo.tsx';
import { WistiaPlayer } from './WistiaPlayer.tsx';
import { WISTIA_MEDIA_ID, VSL_EMBED_URL } from '../config.ts';
import { CheckCircle2, Play, Mail, Video, PhoneCall, ArrowLeft, Home } from 'lucide-react';
import { trackEvent } from '../utils/analytics.ts';

interface ThankYouPageProps {
  onReturnToHome?: () => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({ onReturnToHome }) => {
  const scheduleFiredRef = useRef(false);

  // Fire fbq('track', 'Schedule') once when the thank-you page loads
  useEffect(() => {
    if (!scheduleFiredRef.current) {
      scheduleFiredRef.current = true;
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        try {
          window.fbq('track', 'Schedule');
        } catch (err) {
          console.warn('Notice firing Schedule pixel event:', err);
        }
      } else {
        trackEvent('Schedule');
      }
    }
  }, []);

  const handleGoHome = () => {
    if (onReturnToHome) {
      onReturnToHome();
    } else {
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const hasWistiaVideo = !!WISTIA_MEDIA_ID && !WISTIA_MEDIA_ID.includes('PASTE_');
  const isVideoPlaceholder = !hasWistiaVideo && (!VSL_EMBED_URL || VSL_EMBED_URL.includes('PASTE_'));

  return (
    <div className="min-h-screen w-full relative z-10 flex flex-col items-center justify-start px-4 py-6 md:py-10">
      {/* Brand Header & Top Return Action */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Page</span>
        </button>

        <HeaderLogo compact />

        <div className="w-24 sm:w-32 hidden sm:block" aria-hidden="true" />
      </div>

      {/* Confirmation Badge & Headline */}
      <div className="text-center max-w-2xl mx-auto mt-4 mb-8">
        {/* Glowing Confirmation Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-400/20 to-amber-600/20 border border-amber-400/50 shadow-[0_0_40px_rgba(251,191,36,0.4)] mb-4">
          <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 text-amber-400 stroke-[2.2]" />
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
          You're Booked! Watch This Before Your Call
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 mt-2.5 max-w-lg mx-auto leading-relaxed">
          Your strategy call has been reserved. Please watch this quick 3-minute briefing so we can jump straight into allocating your territory.
        </p>
      </div>

      {/* VSL Video Container (16:9 responsive in glowing glass frame) */}
      <div className="w-full max-w-3xl mx-auto rounded-2xl glass-panel p-2.5 sm:p-4 border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.8)] relative overflow-hidden mb-12">
        {/* Top accent glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.5)]" />

        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-950 border border-white/5 flex items-center justify-center">
          {hasWistiaVideo ? (
            <WistiaPlayer mediaId={WISTIA_MEDIA_ID} aspect="1.7777777777777777" />
          ) : !isVideoPlaceholder ? (
            <iframe
              src={VSL_EMBED_URL}
              title="ShownLeads Pre-Call Briefing"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-900/60 to-black/80">
              {/* Animated Glowing Play Button */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 p-[2px] shadow-[0_0_30px_rgba(251,191,36,0.6)] mb-4 group cursor-pointer hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full bg-black/85 rounded-full flex items-center justify-center">
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 fill-amber-400 ml-1" />
                </div>
              </div>

              <span className="text-xs font-bold text-amber-400 tracking-wider uppercase mb-1">
                Pre-Call Overview Briefing
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white max-w-md">
                How Our Pay-Per-Shown-Estimate Model Generates 15-30 Attended Estimates Monthly
              </h3>
              <p className="text-xs text-neutral-400 mt-2 max-w-sm">
                (VSL Video Slot: Replace <code className="text-amber-300">VSL_EMBED_URL</code> in <code className="text-amber-300">src/config.ts</code> with your YouTube, Vimeo, or Loom link)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* What Happens Next (3-Step List) */}
      <div className="w-full max-w-2xl mx-auto rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 mb-12">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-6 text-center tracking-tight">
          What Happens Next
        </h2>

        <div className="space-y-5">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-sm font-black text-black shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.35)]">
              1
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Check your email for confirmation</span>
                <Mail className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 leading-relaxed">
                We've sent your calendar invite and call details to your email. If you agreed to text messages, you'll also receive a confirmation text.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-sm font-black text-black shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.35)]">
              2
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Watch the video above</span>
                <Video className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 leading-relaxed">
                It explains our pre-qualification criteria, show-up verification process, and territory exclusivity rules.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-sm font-black text-black shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.35)]">
              3
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Show up to the call ready with your questions</span>
                <PhoneCall className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 leading-relaxed">
                Have your target service zip codes and estimator availability on hand so we can determine live capacity.
              </p>
            </div>
          </div>
        </div>

        {/* Option to return to main page */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={handleGoHome}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-amber-400/50 text-sm font-semibold text-white hover:text-amber-300 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]"
          >
            <Home className="w-4 h-4" />
            <span>Return to Main Page</span>
          </button>
          <p className="text-[11px] text-neutral-500 mt-2">
            You can review customer testimonials, contractor inbox proofs, and service details anytime.
          </p>
        </div>
      </div>
    </div>
  );
};
