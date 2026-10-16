/**
 * UTM Tracking Module for EventoraX
 * Captures, stores and supplies UTM marketing campaign parameters
 */

export interface UtmData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  ref?: string;
  captured_at?: string;
  landing_page?: string;
}

const STORAGE_KEY = 'eventorax_utm_params';

/**
 * Initializes UTM capture from current URL search parameters
 */
export function initUtmTracking(): UtmData {
  if (typeof window === 'undefined') return {};

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hasUtm = 
      urlParams.has('utm_source') || 
      urlParams.has('utm_medium') || 
      urlParams.has('utm_campaign') || 
      urlParams.has('utm_term') || 
      urlParams.has('utm_content') || 
      urlParams.has('ref');

    if (hasUtm) {
      const data: UtmData = {
        utm_source: urlParams.get('utm_source') || undefined,
        utm_medium: urlParams.get('utm_medium') || undefined,
        utm_campaign: urlParams.get('utm_campaign') || undefined,
        utm_term: urlParams.get('utm_term') || undefined,
        utm_content: urlParams.get('utm_content') || undefined,
        ref: urlParams.get('ref') || undefined,
        captured_at: new Date().toISOString(),
        landing_page: window.location.pathname
      };

      // Store in both session storage and local storage for multi-visit attribution
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }

    // Fallback to existing stored params
    const stored = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.warn('UTM tracking storage unavailable:', err);
  }

  return {};
}

/**
 * Retrieves currently active UTM parameters for inclusion in contact forms, registrations, or API requests
 */
export function getUtmParams(): UtmData {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
