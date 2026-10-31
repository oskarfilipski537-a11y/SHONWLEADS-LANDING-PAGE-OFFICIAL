import { META_PIXEL_ID } from '../config.ts';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

/**
 * Initialize Meta Pixel script dynamically as fallback if not already in index.html
 */
export function initMetaPixel(): void {
  if (typeof window === 'undefined') return;
  if (!META_PIXEL_ID || META_PIXEL_ID.includes('PASTE_')) {
    return;
  }

  // If already initialized via index.html snippet, nothing to do
  if (window.fbq) return;

  try {
    const f: any = (window.fbq = function (...args: any[]) {
      if (f.callMethod) {
        f.callMethod(...args);
      } else {
        f.queue.push(args);
      }
    });
    if (!window._fbq) window._fbq = f;
    f.push = f;
    f.loaded = true;
    f.version = '2.0';
    f.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  } catch (err) {
    console.warn('Meta pixel initialization notice:', err);
  }
}

/**
 * Track Meta Pixel conversion events from the browser.
 * NOTE: As per strict business requirements, Lead and Schedule events
 * MUST NOT be fired from the browser (they are dispatched server-side).
 */
export function trackEvent(eventName: string, payload?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  // Strict check: Prevent browser dispatch of Lead or Schedule events
  if (eventName === 'Lead' || eventName === 'Schedule') {
    return;
  }

  if (window.fbq) {
    try {
      window.fbq('track', eventName, payload || {});
    } catch (e) {
      console.warn('Error firing pixel event:', e);
    }
  }
}
