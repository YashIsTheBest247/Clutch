import { useCallback, useEffect, useState } from 'react';

// Public OAuth Client ID — safe to expose. Build-time (Vite define) or runtime
// (server.js window.__ENV__). Basic identity scopes only (email/profile/openid).
const RUNTIME_ID =
  (typeof window !== 'undefined' && (window as any).__ENV__?.GOOGLE_CLIENT_ID) || '';
const CLIENT_ID = RUNTIME_ID || process.env.GOOGLE_CLIENT_ID || '';

export interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture: string;
  given_name?: string;
}

const STORAGE_KEY = 'clutch.user.v1';

function decodeJwt(token: string): any {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

let gisPromise: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
  return gisPromise;
}

export function useGoogleAuth() {
  const enabled = Boolean(CLIENT_ID);
  const [user, setUser] = useState<GoogleUser | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled) return;
        (window as any).google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp: any) => {
            const p = decodeJwt(resp.credential);
            if (!p) return;
            const u: GoogleUser = {
              sub: p.sub,
              name: p.name,
              email: p.email,
              picture: p.picture,
              given_name: p.given_name,
            };
            setUser(u);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
            } catch {
              /* noop */
            }
          },
        });
        setReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const renderButton = useCallback(
    (el: HTMLElement | null) => {
      if (!el || !ready || !(window as any).google) return;
      el.innerHTML = '';
      (window as any).google.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
      });
    },
    [ready],
  );

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      (window as any).google?.accounts?.id?.disableAutoSelect();
    } catch {
      /* noop */
    }
  }, []);

  return { enabled, ready, user, renderButton, signOut };
}
