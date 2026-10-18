import { createApi, type Tokens } from '@shared/api/client';

/**
 * API mode is ON when VITE_API_URL is set (apps/web/.env.local → VITE_API_URL=http://localhost:4000/api/v1).
 * Without it the site runs as the self-contained demo prototype (data in the browser).
 */
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '';
export const apiMode = !!API_URL;

const KEY = 'mb-tokens';
export const tokenStore = {
  get(): Tokens | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Tokens) : null;
    } catch {
      return null;
    }
  },
  set(t: Tokens | null) {
    try {
      if (t) localStorage.setItem(KEY, JSON.stringify(t));
      else localStorage.removeItem(KEY);
    } catch {
      /* private mode */
    }
  },
};

/** set by the store so every request carries the current UI language (X-Lang) */
let langGetter: () => 'it' | 'en' = () => 'it';
export const setLangGetter = (f: () => 'it' | 'en') => {
  langGetter = f;
};

export const api = createApi({
  baseUrl: API_URL || 'http://localhost:4000/api/v1',
  tokens: tokenStore,
  onSessionExpired: () => window.dispatchEvent(new CustomEvent('mb-session-expired')),
  getLang: () => langGetter(),
});
