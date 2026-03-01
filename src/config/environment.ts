/**
 * Centralised environment configuration.
 *
 * All Supabase clients and environment-aware code should import from here
 * instead of reading import.meta.env directly.
 *
 * Vite loads the correct .env file automatically based on --mode:
 *   npm run dev          → .env  (defaults to staging)
 *   npm run build:staging    → .env.staging
 *   npm run build:production → .env.production
 */

export type AppEnv = "staging" | "production";

const rawEnv = import.meta.env.VITE_APP_ENV as string | undefined;

export const APP_ENV: AppEnv =
  rawEnv === "production" ? "production" : "staging";

export const isStaging = APP_ENV === "staging";
export const isProduction = APP_ENV === "production";

export const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Convenience re-export so consumers don't need to know the env-var names
export const config = {
  APP_ENV,
  isStaging,
  isProduction,
  supabaseUrl,
  supabaseAnonKey,
} as const;
