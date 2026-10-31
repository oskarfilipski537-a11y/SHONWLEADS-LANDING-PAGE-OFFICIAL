import React from 'react';
import { Star } from 'lucide-react';
import { STAT_BAR_METRICS, CONTRACTOR_REVIEWS } from '../reviews.ts';

export const ReviewsSection: React.FC<{ onCtaClick: () => void }> = ({ onCtaClick }) => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-12 md:py-16 relative z-10">
      {/* Stat Bar Above Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-12 max-w-5xl mx-auto">
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

      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
          Real Results From Real Contractors
        </h2>
        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
          Zero retainers. 100% verified sit-downs.
        </p>
      </div>

      {/* Testimonials Cards matching the screenshot layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-10">
        {CONTRACTOR_REVIEWS.slice(0, 4).map((review) => (
          <div
            key={review.id}
            className="rounded-3xl bg-neutral-950/90 border border-white/10 overflow-hidden flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.8)] hover:border-amber-400/50 hover:shadow-[0_0_30px_rgba(251,191,36,0.25)] transition-all duration-300 group"
          >
            {/* Top Contractor Photo with gradient fade */}
            <div className="relative w-full h-52 sm:h-56 overflow-hidden bg-neutral-900">
              <img
                src={review.photoUrl}
                alt={review.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              {/* Bottom gradient fade into card body */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent pointer-events-none" />
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between -mt-4 relative z-10">
              <div>
                {/* 5 Stars */}
                <div className="flex items-center gap-1 mb-3 text-amber-400" aria-label="5 stars">
                  {[...Array(review.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed mb-5 font-normal">
                  {review.quote}
                </p>

                {/* Metric Tag with gold dot */}
                {review.metricTag && (
                  <div className="mb-6">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-neutral-300 font-mono tracking-tight">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                      <span>{review.metricTag}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Author Footer */}
              <div className="pt-3 border-t border-white/10">
                <h3 className="text-base sm:text-lg font-black tracking-wide text-white uppercase font-sans">
                  {review.name}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5 truncate">
                  <span>{review.company}</span>
                  <span className="mx-1 text-neutral-600">·</span>
                  <span className="text-amber-400/90 font-medium">{review.trade}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
