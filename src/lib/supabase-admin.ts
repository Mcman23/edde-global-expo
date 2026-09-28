import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Service Role Supabase Client.
 * 
 * SECURITY & PRIVILEGE NOTES:
 * 1. `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security (RLS) policies in Supabase.
 * 2. This key must ONLY be used on the server side (Server Components, Route Handlers, Server Actions).
 * 3. NEVER prefix with NEXT_PUBLIC_ or expose in browser code.
 * 4. Used in admin layout/dashboard to perform administrative background queries, administrative count operations,
 *    and verifying user presence in `admin_users`.
 */
export function createServiceClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        try {
          return cookieStore.getAll();
        } catch {
          return [];
        }
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore cookie setting errors when called within Server Component contexts
        }
      },
    },
  });
}
