
CREATE TABLE IF NOT EXISTS public.auth_email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed boolean NOT NULL DEFAULT false,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_email_otps_lookup
  ON public.auth_email_otps (email, consumed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_email_otps_expires
  ON public.auth_email_otps (expires_at);

ALTER TABLE public.auth_email_otps ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: only service role (edge functions) may access.

-- Helper to count recent OTP requests for rate limiting (callable from edge functions only)
GRANT SELECT, INSERT, UPDATE ON public.auth_email_otps TO service_role;
REVOKE ALL ON public.auth_email_otps FROM anon, authenticated;
