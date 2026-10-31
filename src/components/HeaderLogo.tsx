import React from 'react';
import { LOGO_URL, COMPANY_NAME } from '../config.ts';

export const HeaderLogo: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <header className={`w-full flex items-center justify-center ${compact ? 'py-3' : 'py-5 md:py-7'} z-10 relative`}>
      {LOGO_URL && !LOGO_URL.includes('placeholder') && LOGO_URL.trim() !== '' ? (
        <img
          src={LOGO_URL}
          alt={COMPANY_NAME}
          className={`${compact ? 'h-10 sm:h-12' : 'h-14 sm:h-16 md:h-20'} w-auto object-contain max-w-[360px] drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex items-center gap-2.5 group cursor-default select-none">
          {/* Custom ShownLeads Icon Mark */}
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-[1.5px] shadow-[0_0_20px_rgba(251,191,36,0.5)]">
            <div className="w-full h-full bg-black/90 rounded-[10px] flex items-center justify-center">
              <svg 
                className="w-4 h-4 md:w-5 md:h-5 text-amber-400" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>

          {/* Brand Wordmark */}
          <div className="flex items-baseline">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-white font-sans">
              Shown
            </span>
            <span className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 bg-clip-text text-transparent font-sans drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
              Leads
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
