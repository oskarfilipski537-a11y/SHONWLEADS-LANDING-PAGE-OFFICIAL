import React, { useState } from 'react';
import { MessageSquare, Maximize2, CheckCheck, ArrowUpCircle } from 'lucide-react';
import { CONTRACTOR_SCREENSHOTS } from '../screenshots.ts';
import { ScreenshotItem } from '../types.ts';
import { LightboxModal } from './LightboxModal.tsx';

export const ScreenshotGallery: React.FC<{ onCtaClick: () => void }> = ({ onCtaClick }) => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotItem | null>(null);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-12 md:py-20 relative z-10">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Real Client Text Conversations</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
          Straight From Our Contractors' Inbox
        </h2>
        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
          Unedited messages from contractors closing real homeowner estimates delivered straight to their calendars.
        </p>
      </div>

      {/* Responsive Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {CONTRACTOR_SCREENSHOTS.map((slot) => (
          <div
            key={slot.id}
            onClick={() => setSelectedScreenshot(slot)}
            className="group cursor-pointer flex flex-col items-center"
          >
            {/* Phone Bezel Container */}
            <div className="w-full max-w-[310px] bg-neutral-950 rounded-[36px] p-2.5 border-[3px] border-neutral-800 shadow-[0_12px_40px_rgba(0,0,0,0.8)] group-hover:border-amber-400/60 group-hover:shadow-[0_0_35px_rgba(251,191,36,0.3)] transition-all duration-300 relative overflow-hidden">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-black rounded-full z-20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between px-4 pt-1.5 pb-2 text-[10px] text-neutral-400 font-medium select-none z-10 relative">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-500" />
                  <span className="text-[9px]">5G</span>
                </div>
              </div>

              {/* Screen Area */}
              <div className="relative rounded-[26px] overflow-hidden bg-[#0b141a] min-h-[360px] flex flex-col justify-between border border-white/5">
                {slot.imageUrl ? (
                  <img
                    src={slot.imageUrl}
                    alt={slot.title}
                    className="w-full h-full object-cover min-h-[360px] group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="p-3.5 flex flex-col justify-between h-full flex-1">
                    {/* Chat Header */}
                    <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-xs font-bold text-black shrink-0">
                        {slot.senderName.slice(0, 1)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-white truncate">
                          {slot.senderName}
                        </div>
                        <div className="text-[10px] text-amber-400 truncate">
                          {slot.senderPhonePreview}
                        </div>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="py-3 space-y-2.5 flex-1 flex flex-col justify-end">
                      {slot.messages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${
                            m.sender === 'contractor' ? 'items-start' : 'items-end'
                          }`}
                        >
                          <div
                            className={`max-w-[90%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed ${
                              m.sender === 'contractor'
                                ? 'bg-[#202c33] text-neutral-200 rounded-tl-none'
                                : 'bg-[#005c4b] text-neutral-100 rounded-tr-none'
                            }`}
                          >
                            <p>{m.text}</p>
                            <div className="flex items-center justify-end gap-1 mt-0.5 text-[9px] text-neutral-400">
                              <span>{m.time}</span>
                              {m.sender === 'shownleads' && (
                                <CheckCheck className="w-3 h-3 text-amber-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Trade Pill */}
                    <div className="pt-2 border-t border-white/10 text-center">
                      <span className="text-[10px] text-neutral-400">
                        {slot.contractorTrade}
                      </span>
                    </div>
                  </div>
                )}

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 text-black text-xs font-black shadow-[0_0_16px_rgba(251,191,36,0.6)]">
                    <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Tap to expand</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Title & Caption */}
            <div className="mt-4 text-center max-w-[280px]">
              <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                {slot.title}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                {slot.caption}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Repeat Call-To-Action Button */}
      <div className="mt-14 text-center">
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

      {/* Lightbox Modal */}
      <LightboxModal
        screenshot={selectedScreenshot}
        onClose={() => setSelectedScreenshot(null)}
      />
    </section>
  );
};
