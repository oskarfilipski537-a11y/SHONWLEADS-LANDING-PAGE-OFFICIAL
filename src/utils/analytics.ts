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
 * Only PageView, ViewContent, and Lead are permitted.
 * All other events (e.g. Schedule) are strictly disallowed.
 */
export function trackEvent(eventName: string, payload?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  // Strict check: Only PageView, ViewContent, and Lead are permitted
  const allowedEvents = ['PageView', 'ViewContent', 'Lead'];
  if (!allowedEvents.includes(eventName)) {
    return;
  }

  if (window.fbq) {
    try {
      if (payload && Object.keys(payload).length > 0) {
        window.fbq('track', eventName, payload);
      } else {
        window.fbq('track', eventName);
      }
    } catch (e) {
      console.warn('Error firing pixel event:', e);
    }
  }
}
