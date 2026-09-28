'use client';

import { JourneySession } from '@/types';

const SESSION_STORAGE_KEY = 'edde_session';

export function getSession(): JourneySession {
  if (typeof window === 'undefined') {
    return {
      session_id: 'server_dummy_id',
      source: 'exhibition',
      campaign: 'edde_global_expo',
    };
  }

  try {
    const existingSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existingSession) {
      return JSON.parse(existingSession) as JourneySession;
    }
  } catch (e) {
    console.warn('Failed to parse edde_session from sessionStorage', e);
  }

  // Parse URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const utm_source = searchParams.get('utm_source') || undefined;
  const utm_medium = searchParams.get('utm_medium') || undefined;
  const utm_campaign = searchParams.get('utm_campaign') || undefined;

  const source = utm_source || 'exhibition';
  const campaign = utm_campaign || 'edde_global_expo';

  const newSession: JourneySession = {
    session_id: crypto.randomUUID ? crypto.randomUUID() : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    utm_source,
    utm_medium,
    utm_campaign,
    source,
    campaign,
  };

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
  } catch (e) {
    console.warn('Failed to save edde_session to sessionStorage', e);
  }

  return newSession;
}

export function resetSession(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to reset edde_session from sessionStorage', e);
    }
  }
}
