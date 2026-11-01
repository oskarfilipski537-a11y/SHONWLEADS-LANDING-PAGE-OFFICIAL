import React, { useEffect } from 'react';
import { HeaderLogo } from './HeaderLogo.tsx';

export const UnqualifiedPage: React.FC = () => {
  useEffect(() => {
    // Scroll to top immediately on mount
    window.scrollTo(0, 0);

    // Trap history so backward/forward does not navigate to calendar or thank-you page
    window.history.pushState({ page: 'not-fit' }, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState({ page: 'not-fit' }, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <main className="min-h-screen w-full relative z-10 flex flex-col items-center justify-start px-4 py-8 sm:py-16">
      {/* Logo at the top */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center mb-8 sm:mb-12">
        <HeaderLogo compact />
      </div>

      {/* Main card in same dark style */}
      <div className="w-full max-w-lg mx-auto rounded-2xl glass-panel p-8 sm:p-10 border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.8)] relative text-center">
        {/* Subtle top neon gold line accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/60 via-yellow-400 to-amber-500/60 shadow-[0_0_12px_rgba(251,191,36,0.5)]" />

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
          We're not the right fit just yet
        </h1>

        <p className="text-sm sm:text-base text-neutral-300 mt-4 leading-relaxed max-w-md mx-auto">
          Right now we're only working with contractors doing $25k+ per month. Thanks for your interest.
        </p>
      </div>
    </main>
  );
};
