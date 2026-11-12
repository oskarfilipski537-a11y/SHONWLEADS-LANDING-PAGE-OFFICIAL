import React from 'react';
import { COMPANY_NAME, DISCLAIMER_TEXT } from '../config.ts';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/10 py-10 px-4 mt-16 relative z-10 text-center">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-neutral-300">
          <a
            href="https://www.shownleads.com/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-300 hover:text-white transition-colors underline underline-offset-4"
          >
            Privacy Policy
          </a>
          <span className="text-neutral-600 select-none">|</span>
          <a
            href="https://www.shownleads.com/terms-and-conditions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-300 hover:text-white transition-colors underline underline-offset-4"
          >
            SMS Terms & Conditions
          </a>
          <span className="text-neutral-600 select-none">|</span>
          <a
            href="mailto:info@shownleads.com"
            className="text-neutral-300 hover:text-white transition-colors underline underline-offset-4"
          >
            info@shownleads.com
          </a>
        </div>

        {/* Company Registration Details */}
        <p className="text-[12px] text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          ShownLeads, a trading name of Oskar Jan Filipski, 2 Windmill Close, Cashel, Co. Tipperary, E25 AV62, Ireland
        </p>

        {/* Disclaimer */}
        <p className="text-[11px] text-neutral-500 max-w-2xl mx-auto leading-relaxed">
          {DISCLAIMER_TEXT}
        </p>

        {/* Copyright */}
        <div className="text-xs text-neutral-500 pt-1">
          © {currentYear} {COMPANY_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
