'use client';

import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function trackEvent(
  event_name: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const session = getSession();

    // Fire-and-forget async insert
    supabase
      .from('analytics_events')
      .insert({
        event_name,
        session_id: session.session_id,
        source: session.source,
        campaign: session.campaign,
        utm_source: session.utm_source || null,
        utm_medium: session.utm_medium || null,
        utm_campaign: session.utm_campaign || null,
        metadata: metadata || {},
      })
      .then(
        ({ error }) => {
          if (error) {
            console.warn(`[Analytics] Track event warning (${event_name}):`, error.message);
          }
        },
        (err) => {
          console.warn(`[Analytics] Track event error (${event_name}):`, err);
        }
      );
  } catch (err) {
    // Catch-all to guarantee non-blocking fire-and-forget behavior
    console.warn(`[Analytics] Uncaught exception (${event_name}):`, err);
  }
}
