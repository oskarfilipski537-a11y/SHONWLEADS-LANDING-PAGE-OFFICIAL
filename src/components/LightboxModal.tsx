import React, { useEffect } from 'react';
import { X, CheckCheck } from 'lucide-react';
import { ScreenshotItem } from '../types.ts';

interface LightboxModalProps {
  screenshot: ScreenshotItem | null;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ screenshot, onClose }) => {
  useEffect(() => {
    if (!screenshot) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screenshot, onClose]);

  if (!screenshot) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-sm w-full bg-neutral-950 rounded-[32px] border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
          aria-label="Close preview"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Phone Frame Mockup View */}
        <div className="p-3 bg-neutral-900">
          {/* Phone Top Notch */}
          <div className="w-28 h-4 bg-black rounded-b-xl mx-auto mb-2 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-neutral-800 mr-2" />
            <div className="w-8 h-1 bg-neutral-800 rounded-full" />
          </div>

          {screenshot.imageUrl ? (
            <img
              src={screenshot.imageUrl}
              alt={screenshot.title}
              className="w-full h-auto rounded-2xl object-cover max-h-[75vh]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="bg-[#0b141a] text-white rounded-2xl p-4 min-h-[420px] flex flex-col justify-between border border-white/5 font-sans">
              {/* WhatsApp Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-xs font-bold text-white">
                  {screenshot.senderName.slice(0, 1)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white leading-tight">
                    {screenshot.senderName}
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    online · verified contractor
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="py-4 space-y-3.5 flex-1 flex flex-col justify-end">
                <div className="text-[10px] text-center text-neutral-400 bg-white/5 py-1 px-3 rounded-md mx-auto">
                  Messages are end-to-end encrypted
                </div>

                {screenshot.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.sender === 'contractor' ? 'items-start' : 'items-end'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                        msg.sender === 'contractor'
                          ? 'bg-[#202c33] text-neutral-100 rounded-tl-sm'
                          : 'bg-[#005c4b] text-neutral-100 rounded-tr-sm'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-neutral-400">
                        <span>{msg.time}</span>
                        {msg.sender === 'shownleads' && (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trade Badge */}
              <div className="pt-3 border-t border-white/10 text-center">
                <span className="text-xs text-neutral-400">
                  Trade: <strong className="text-amber-400 font-bold">{screenshot.contractorTrade}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Caption */}
        <div className="p-4 bg-black/90 border-t border-white/10">
          <h4 className="text-sm font-bold text-white">{screenshot.title}</h4>
          <p className="text-xs text-neutral-400 mt-1">{screenshot.caption}</p>
        </div>
      </div>
    </div>
  );
};
