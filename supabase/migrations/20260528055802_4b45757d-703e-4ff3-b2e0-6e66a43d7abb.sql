CREATE TABLE public.user_push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('web','ios','android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_push_tokens TO service_role;

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own push tokens"
ON public.user_push_tokens FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own push tokens"
ON public.user_push_tokens FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own push tokens"
ON public.user_push_tokens FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own push tokens"
ON public.user_push_tokens FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_user_push_tokens_updated_at
BEFORE UPDATE ON public.user_push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();