import React, { useState } from 'react';
import { COMPANY_NAME, DISCLAIMER_TEXT } from '../config.ts';
import { PrivacyModal, TermsModal } from './LegalModals.tsx';

export const Footer: React.FC = () => {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/10 py-10 px-4 mt-16 relative z-10 text-center">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Links */}
        <div className="flex items-center justify-center gap-6 text-xs text-neutral-400">
          <button
            onClick={() => setPrivacyOpen(true)}
            className="hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Privacy Policy
          </button>
          <span>·</span>
          <button
            onClick={() => setTermsOpen(true)}
            className="hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Terms of Service
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-neutral-500 max-w-2xl mx-auto leading-relaxed">
          {DISCLAIMER_TEXT}
        </p>

        {/* Copyright */}
        <div className="text-xs text-neutral-500 pt-2">
          © {currentYear} {COMPANY_NAME}. All rights reserved.
        </div>
      </div>

      <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
    </footer>
  );
};
