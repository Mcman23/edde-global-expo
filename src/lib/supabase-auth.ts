import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Auth Supabase Client (Cookie-based session check).
 * 
 * SECURITY NOTES:
 * 1. Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` combined with request cookies to verify the authenticated user context.
 * 2. Enforces Row Level Security (RLS) policies set in `supabase/schema.sql` (e.g. `is_admin()` check).
 * 3. Safely handles cookie reading and updating for session persistence.
 */
export function createAuthClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if middleware handles session refreshing.
        }
      },
    },
  });
}
