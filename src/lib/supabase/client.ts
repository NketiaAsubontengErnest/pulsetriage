import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase browser client.
 *
 * NOTE: this module is currently UNUSED. The application moved to Prisma over a
 * managed PostgreSQL instance, and nothing imports this file. It is retained
 * only so that a Supabase-backed deployment remains straightforward.
 *
 * The previous implementation supplied literal `||` fallbacks for the URL and
 * anon key. Those values were placeholders rather than live credentials, but
 * the pattern is the one that produced technical debt item TD-02, so it has
 * been removed here as well: configuration now comes from the environment
 * only, and a missing variable raises an explicit error instead of silently
 * constructing a client pointed at a non-existent project.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
