import React, { useEffect, useRef, useState } from 'react';
import { HeaderLogo } from './HeaderLogo.tsx';
import { BOOKING_IFRAME_ID } from '../config.ts';
import { splitFullName } from '../utils/formatters.ts';
import { CheckCircle2, Shield, Clock } from 'lucide-react';

import { QuizAnswers } from '../types.ts';

interface BookingPageProps {
  onBookingConfirmed: () => void;
  leadAnswers?: QuizAnswers | null;
}

export const BookingPage: React.FC<BookingPageProps> = ({ onBookingConfirmed, leadAnswers }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Retrieve lead details from props, final lead storage, or quiz answers
  const leadData = (() => {
    if (leadAnswers && (leadAnswers.fullName || leadAnswers.email || leadAnswers.phone)) {
      return {
        fullName: leadAnswers.fullName || '',
        email: leadAnswers.email || '',
        phone: leadAnswers.phone || '',
        crews: leadAnswers.crews || '',
        extraEstimates: leadAnswers.extraEstimates || '',
        monthlyRevenue: leadAnswers.monthlyRevenue || '',
      };
    }
    try {
      const stored = sessionStorage.getItem('shownleads_final_lead');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          fullName: parsed.full_name || [parsed.first_name, parsed.last_name].filter(Boolean).join(' '),
          email: parsed.email || '',
          phone: parsed.phone || '',
          crews: parsed.crews || '',
          extraEstimates: parsed.extra_estimates || '',
          monthlyRevenue: parsed.monthly_revenue || '',
        };
      }
      const quiz = sessionStorage.getItem('shownleads_quiz_data');
      if (quiz) {
        const q = JSON.parse(quiz);
        return {
          fullName: q.fullName || '',
          email: q.email || '',
          phone: q.phone || '',
          crews: q.crews || '',
          extraEstimates: q.extraEstimates || '',
          monthlyRevenue: q.monthlyRevenue || '',
        };
      }
    } catch {}
    return { fullName: '', email: '', phone: '', crews: '', extraEstimates: '', monthlyRevenue: '' };
  })();

  const { firstName, lastName } = splitFullName(leadData.fullName);
  // Clean raw digits for telephone param compatibility (e.g. +1XXXXXXXXXX and raw 10 digits)
  const phoneDigits = leadData.phone.replace(/\D/g, '');
  const e164Phone = phoneDigits.length === 10 ? `+1${phoneDigits}` : phoneDigits.startsWith('1') ? `+${phoneDigits}` : leadData.phone;

  // Construct iframe source with all standard GHL/LeadConnector pre-population query parameters
  const baseBookingUrl = `https://api.leadconnectorhq.com/widget/booking/${BOOKING_IFRAME_ID}`;
  const queryParams = new URLSearchParams();

  // Name pre-fill aliases recognized by LeadConnector / GHL
  if (firstName) {
    queryParams.set('first_name', firstName);
    queryParams.set('firstName', firstName);
  }
  if (lastName) {
    queryParams.set('last_name', lastName);
    queryParams.set('lastName', lastName);
  }
  if (leadData.fullName) {
    queryParams.set('name', leadData.fullName);
    queryParams.set('full_name', leadData.fullName);
  }

  // Email aliases
  if (leadData.email) {
    queryParams.set('email', leadData.email);
  }

  // Phone aliases
  if (leadData.phone) {
    queryParams.set('phone', leadData.phone);
    if (e164Phone) {
      queryParams.set('phone_number', e164Phone);
    }
  }

  // Qualification survey context
  if (leadData.crews) {
    queryParams.set('crews', leadData.crews);
  }
  if (leadData.extraEstimates) {
    queryParams.set('extra_estimates', leadData.extraEstimates);
  }
  if (leadData.monthlyRevenue) {
    queryParams.set('monthly_revenue', leadData.monthlyRevenue);
  }

  const queryString = queryParams.toString();
  const iframeSrc = queryString ? `${baseBookingUrl}?${queryString}` : baseBookingUrl;

  const [iframeHeight, setIframeHeight] = useState('850px');

  // Lock-in behavior: keep lock-in active on booking page while allowing full scrolling
  useEffect(() => {
    // Crucial: Explicitly restore vertical scrolling on the booking page
    document.body.style.overflow = 'auto';
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.overflowY = 'auto';

    // Disable escape key & trap back button
    window.history.pushState({ page: 'book' }, '');

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Stay on booking page
      window.history.pushState({ page: 'book' }, '');
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Your calendar slot is being held. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Dynamically load form_embed.js for responsive auto-resizing
  useEffect(() => {
    // Remove existing script if present so it re-initializes on the freshly mounted iframe
    const existingScript = document.querySelector('script[src="https://link.msgsndr.com/js/form_embed.js"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.type = 'text/javascript';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up script on unmount
    };
  }, []);

  // Listen for window message events from leadconnectorhq.com for auto-resizing and appointment confirmation
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const origin = event.origin || '';
        // LeadConnector / GHL origins
        if (
          origin.includes('leadconnectorhq.com') ||
          origin.includes('msgsndr.com') ||
          origin.includes('gohighlevel.com')
        ) {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

          // Check if message contains iframe height resize information
          const reportedHeight = data?.height || data?.frameHeight || data?.params?.height;
          if (typeof reportedHeight === 'number' && reportedHeight > 400) {
            setIframeHeight(`${reportedHeight + 40}px`);
          } else if (typeof reportedHeight === 'string') {
            const parsed = parseInt(reportedHeight, 10);
            if (!isNaN(parsed) && parsed > 400) {
              setIframeHeight(`${parsed + 40}px`);
            }
          }
          
          // GHL triggers appointment_scheduled or booking-completed actions
          if (
            data?.action === 'appointment_scheduled' ||
            data?.type === 'booking_success' ||
            data?.event === 'appointment_booked' ||
            (typeof data === 'string' && data.toLowerCase().includes('appointment_scheduled'))
          ) {
            onBookingConfirmed();
          }
        }
      } catch {
        // Not a JSON message or unrelated message, ignore safely
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onBookingConfirmed]);

  return (
    <div className="min-h-screen w-full relative z-10 flex flex-col items-center justify-start px-4 py-6 md:py-10">
      {/* Brand Header */}
      <HeaderLogo compact />

      {/* Main Headline & Context */}
      <div className="text-center max-w-2xl mx-auto mt-4 mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3 shadow-[0_0_12px_rgba(251,191,36,0.25)]">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Territory Qualified</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
          You Qualify - Pick A Time For Your Strategy Call
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 mt-2.5 max-w-lg mx-auto leading-relaxed">
          Select an available time below to review homeowner demand in your service area and set up your show-up guaranteed calendar.
        </p>

        {/* Benefits reminder */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>15-min call</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>No obligations</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Exclusivity locked during call</span>
          </div>
        </div>
      </div>

      {/* Booking Calendar Glass Frame */}
      <div 
        ref={containerRef}
        className="w-full max-w-4xl mx-auto rounded-2xl glass-panel p-2 sm:p-4 md:p-6 border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.8)] relative min-h-[750px] mb-8"
      >
        {/* Top accent glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.5)]" />

        {/* Embed iframe with responsive height and auto-resize support */}
        <iframe
          src={iframeSrc}
          allow="payment"
          style={{ 
            width: '100%', 
            border: 'none', 
            height: iframeHeight,
            minHeight: '750px'
          }}
          scrolling="auto"
          id={`${BOOKING_IFRAME_ID}_1793202113329`}
          title="ShownLeads Appointment Scheduling"
          onLoad={() => setIframeLoaded(true)}
          className="w-full rounded-xl transition-all duration-300"
        />

        {/* Prominent CTA button to advance to Thank You page after booking */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center text-center">
          <p className="text-sm font-medium text-neutral-300 mb-3">
            Finished selecting your date and time in the calendar above?
          </p>

          <button
            type="button"
            onClick={() => {
              onBookingConfirmed();
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-base sm:text-lg tracking-wide shadow-[0_0_30px_rgba(251,191,36,0.55)] hover:shadow-[0_0_45px_rgba(251,191,36,0.85)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-black stroke-[2.5]" />
            <span>I've Booked My Call — Continue To Thank You Page</span>
            <span className="text-xl">→</span>
          </button>

          <p className="text-xs text-neutral-400 mt-2.5">
            Takes you directly to your 3-minute video briefing & pre-call preparation checklist
          </p>
        </div>
      </div>
    </div>
  );
};
