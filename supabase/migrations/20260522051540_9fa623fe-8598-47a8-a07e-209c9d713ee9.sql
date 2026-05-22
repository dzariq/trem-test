
-- Storage bucket for CCA session attachments (images + PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cca-session-attachments', 'cca-session-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Attachments table
CREATE TABLE IF NOT EXISTS public.cca_session_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.cca_sessions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image','pdf')),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cca_session_attachments_session_idx
  ON public.cca_session_attachments(session_id);

ALTER TABLE public.cca_session_attachments ENABLE ROW LEVEL SECURITY;

-- Read: anyone who can read cca_sessions (read = true on parent table)
CREATE POLICY "Anyone can view cca session attachments"
  ON public.cca_session_attachments
  FOR SELECT
  USING (true);

-- Write: same gate as session updates -- module editors or session PICs
CREATE POLICY "CCA editors or session PICs can insert attachments"
  ON public.cca_session_attachments
  FOR INSERT
  WITH CHECK (
    has_module_edit_access('cca_management')
    OR EXISTS (
      SELECT 1 FROM public.cca_session_pics p
      WHERE p.session_id = cca_session_attachments.session_id
        AND p.teacher_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.cca_sessions s
      JOIN public.cca_activity_teachers cat ON cat.activity_id = s.activity_id
      WHERE s.id = cca_session_attachments.session_id
        AND cat.teacher_user_id = auth.uid()
    )
  );

CREATE POLICY "CCA editors or session PICs can delete attachments"
  ON public.cca_session_attachments
  FOR DELETE
  USING (
    has_module_edit_access('cca_management')
    OR EXISTS (
      SELECT 1 FROM public.cca_session_pics p
      WHERE p.session_id = cca_session_attachments.session_id
        AND p.teacher_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.cca_sessions s
      JOIN public.cca_activity_teachers cat ON cat.activity_id = s.activity_id
      WHERE s.id = cca_session_attachments.session_id
        AND cat.teacher_user_id = auth.uid()
    )
  );

-- Storage policies for the cca-session-attachments bucket
-- Path convention: <activity_id>/<session_id>/<filename>
CREATE POLICY "Public can read cca session attachments"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'cca-session-attachments');

CREATE POLICY "Authenticated can upload cca session attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cca-session-attachments'
    AND (
      has_module_edit_access('cca_management')
      OR EXISTS (
        SELECT 1 FROM public.cca_activity_teachers cat
        WHERE cat.activity_id::text = (storage.foldername(name))[1]
          AND cat.teacher_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authenticated can delete cca session attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cca-session-attachments'
    AND (
      has_module_edit_access('cca_management')
      OR EXISTS (
        SELECT 1 FROM public.cca_activity_teachers cat
        WHERE cat.activity_id::text = (storage.foldername(name))[1]
          AND cat.teacher_user_id = auth.uid()
      )
    )
  );
