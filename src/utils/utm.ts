import { UtmParams } from '../types.ts';

const UTM_STORAGE_KEY = 'shownleads_utm_params';
const FBCLID_STORAGE_KEY = 'shownleads_fbclid';

/**
 * Reads a cookie value by name from document.cookie
 */
export function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const val = parts.pop()?.split(';').shift() || '';
      return decodeURIComponent(val.trim());
    }
  } catch (e) {
    console.warn(`Error reading cookie ${name}:`, e);
  }
  return '';
}

/**
 * Retrieves Meta tracking parameters:
 * - fbclid: from query string, hash, or sessionStorage
 * - fbp: from _fbp cookie
 * - fbc: from _fbc cookie (or formatted with timestamp and fbclid if cookie not yet set)
 */
export function getMetaTrackingData(): { fbclid: string; fbp: string; fbc: string } {
  if (typeof window === 'undefined') {
    return { fbclid: '', fbp: '', fbc: '' };
  }

  // 1. Search for fbclid in query string or hash
  const searchParams = new URLSearchParams(window.location.search);
  const hashIndex = window.location.hash.indexOf('?');
  const hashParams = hashIndex !== -1 
    ? new URLSearchParams(window.location.hash.substring(hashIndex)) 
    : null;

  let fbclid = searchParams.get('fbclid') || hashParams?.get('fbclid') || '';

  // Check persistent session storage if not in current URL
  if (!fbclid) {
    try {
      fbclid = sessionStorage.getItem(FBCLID_STORAGE_KEY) || '';
    } catch {}
  } else {
    try {
      sessionStorage.setItem(FBCLID_STORAGE_KEY, fbclid);
    } catch {}
  }

  // 2. Read _fbp and _fbc cookies
  const fbp = getCookie('_fbp');
  let fbc = getCookie('_fbc');

  // If _fbc is not set as a cookie yet by Meta Pixel script, synthesize it using standard Meta format
  if (!fbc && fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
  }

  return {
    fbclid: fbclid || '',
    fbp: fbp || '',
    fbc: fbc || '',
  };
}

/**
 * Extracts UTM parameters, fbclid, and referrer from the current page URL
 */
export function captureUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hashIndex = window.location.hash.indexOf('?');
    const hashParams = hashIndex !== -1 
      ? new URLSearchParams(window.location.hash.substring(hashIndex)) 
      : null;

    const getParam = (key: string): string | undefined => {
      return searchParams.get(key) || hashParams?.get(key) || undefined;
    };

    const metaData = getMetaTrackingData();

    const captured: UtmParams = {
      utm_source: getParam('utm_source'),
      utm_medium: getParam('utm_medium'),
      utm_campaign: getParam('utm_campaign'),
      utm_term: getParam('utm_term'),
      utm_content: getParam('utm_content'),
      fbclid: metaData.fbclid || getParam('fbclid'),
      fbp: metaData.fbp || undefined,
      fbc: metaData.fbc || undefined,
      page_url: window.location.href,
      referrer: document.referrer || undefined
    };

    // Remove undefined keys
    Object.keys(captured).forEach((key) => {
      if ((captured as any)[key] === undefined) {
        delete (captured as any)[key];
      }
    });

    // If new UTM / fbclid params exist, persist them
    if (Object.keys(captured).length > 2) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(captured));
      return captured;
    }

    // Otherwise check for existing cached params
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Refresh current fbp/fbc cookies which may have populated since initial load
      parsed.fbp = metaData.fbp || parsed.fbp;
      parsed.fbc = metaData.fbc || parsed.fbc;
      parsed.fbclid = metaData.fbclid || parsed.fbclid;
      return parsed;
    }

    return captured;
  } catch (e) {
    console.warn('Session storage UTM access notice:', e);
    const metaData = getMetaTrackingData();
    return {
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      fbclid: metaData.fbclid,
      fbp: metaData.fbp,
      fbc: metaData.fbc
    };
  }
}

/**
 * Retrieves persisted UTM parameters and fresh Meta tracking cookies
 */
export function getPersistedUtmParams(): UtmParams {
  const metaData = getMetaTrackingData();
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      const parsed: UtmParams = JSON.parse(stored);
      return {
        ...parsed,
        fbclid: metaData.fbclid || parsed.fbclid || '',
        fbp: metaData.fbp || parsed.fbp || '',
        fbc: metaData.fbc || parsed.fbc || '',
      };
    }
  } catch {
    // sessionStorage unavailable
  }
  return captureUtmParams();
}
