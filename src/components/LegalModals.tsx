import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { COMPANY_NAME, SUPPORT_EMAIL } from '../config.ts';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl w-full bg-neutral-950 border border-white/15 rounded-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto shadow-2xl text-neutral-300 text-sm leading-relaxed"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4 text-xs sm:text-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export const PrivacyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy">
      <p>Last updated: October 2026</p>
      <h4 className="font-semibold text-white mt-3">1. Information We Collect</h4>
      <p>
        When you complete an assessment or inquiry form on {COMPANY_NAME}, we collect business and contact information including your full name, email address, direct telephone number, company crew count, and monthly revenue estimates.
      </p>
      <h4 className="font-semibold text-white mt-3">2. Mobile Terms & SMS Consent</h4>
      <p>
        By providing your mobile number and checking the consent box, you authorize {COMPANY_NAME} to send transactional, appointment scheduling, and informational SMS/MMS messages to your number. Consent is not a condition of purchase. Message frequency varies. Standard message and data rates may apply. You may reply STOP at any time to unsubscribe, or HELP for assistance.
      </p>
      <p>
        Mobile information and opt-in consent will NEVER be sold, rented, or shared with third parties or affiliates for promotional or marketing purposes.
      </p>
      <h4 className="font-semibold text-white mt-3">3. How We Use Your Data</h4>
      <p>
        Your information is used solely to evaluate service capacity in your regional territory, configure your estimate booking calendar, and coordinate qualified homeowner estimates.
      </p>
      <h4 className="font-semibold text-white mt-3">4. Contact Us</h4>
      <p>
        If you have any questions about this Privacy Policy, please email {SUPPORT_EMAIL}.
      </p>
    </Modal>
  );
};

export const TermsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Terms and Conditions">
      <p>Last updated: October 2026</p>
      <h4 className="font-semibold text-white mt-3">1. Scope of Service</h4>
      <p>
        {COMPANY_NAME} connects licensed, insured contracting businesses with residential homeowners requesting in-person or on-site project estimates.
      </p>
      <h4 className="font-semibold text-white mt-3">2. Pay-Per-Shown-Estimate Model</h4>
      <p>
        Under our standard agreement, contractors are only billed for appointments where the homeowner is physically present at the agreed property address or actively attends the scheduled estimate session. If a homeowner cancels, fails to attend, or refuses entry, no fee is incurred.
      </p>
      <h4 className="font-semibold text-white mt-3">3. Contractor Responsibilities</h4>
      <p>
        Participating contractors agree to arrive on time, maintain professional licensing and liability insurance in their operating jurisdictions, and provide courteous service to homeowners.
      </p>
      <h4 className="font-semibold text-white mt-3">4. Disclaimer of Earnings</h4>
      <p>
        Closing rates and revenue generated depend on contractor pricing, sales skill, and operational execution. {COMPANY_NAME} does not guarantee a specific closing ratio or project margin.
      </p>
      <h4 className="font-semibold text-white mt-3">5. Inquiries</h4>
      <p>
        For inquiries regarding these Terms, contact {SUPPORT_EMAIL}.
      </p>
    </Modal>
  );
};
