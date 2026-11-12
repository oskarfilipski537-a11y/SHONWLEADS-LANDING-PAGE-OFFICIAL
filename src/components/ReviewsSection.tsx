import React from 'react';
import { ArrowUpCircle } from 'lucide-react';
import { STAT_BAR_METRICS } from '../reviews.ts';

export const ReviewsSection: React.FC<{ onCtaClick: () => void }> = ({ onCtaClick }) => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 relative z-10">
      {/* Stat Bar / Trust Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
        {STAT_BAR_METRICS.map((stat) => (
          <div
            key={stat.id}
            className="rounded-2xl glass-panel p-5 md:p-6 text-center border border-white/10 hover:border-amber-400/40 hover:shadow-[0_0_24px_rgba(251,191,36,0.15)] transition-all duration-200"
          >
            <div className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 bg-clip-text text-transparent font-sans tabular-nums mb-1 drop-shadow-[0_0_18px_rgba(251,191,36,0.45)]">
              {stat.value}
            </div>
            <div className="text-sm font-semibold text-white mb-0.5">
              {stat.label}
            </div>
            {stat.subtext && (
              <div className="text-xs text-neutral-400 leading-snug">
                {stat.subtext}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Repeat Call-To-Action Button */}
      <div className="mt-12 text-center">
        <button
          type="button"
          onClick={onCtaClick}
          className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-base shadow-[0_0_30px_rgba(251,191,36,0.55)] hover:shadow-[0_0_45px_rgba(251,191,36,0.85)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
        >
          <ArrowUpCircle className="w-5 h-5 stroke-[2.5]" />
          <span>See If Your Territory Qualifies</span>
        </button>
        <p className="text-xs text-neutral-400 mt-2.5">
          Takes 30 seconds · No credit card required · Only pay for attending homeowners
        </p>
      </div>
    </section>
  );
};
