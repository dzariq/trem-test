
-- 1. Enum for document type
DO $$ BEGIN
  CREATE TYPE public.school_document_type AS ENUM (
    'student_handbook',
    'teacher_handbook',
    'student_timetable',
    'teacher_timetable'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Table
CREATE TABLE IF NOT EXISTS public.school_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type public.school_document_type NOT NULL,
  campus_code TEXT NULL,                       -- 'BO','GL' or NULL = global
  academic_year_id UUID NULL,                  -- optional scoping
  year_level TEXT NULL,                        -- optional (e.g. 'Year 5')
  class_id UUID NULL,                          -- optional (class-specific timetable)
  title TEXT NOT NULL,
  description TEXT NULL,
  file_path TEXT NOT NULL,                     -- storage object path inside bucket
  file_size BIGINT NULL,
  mime_type TEXT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NULL,
  uploaded_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_documents_lookup
  ON public.school_documents (doc_type, campus_code, is_active, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_school_documents_class
  ON public.school_documents (class_id) WHERE class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_school_documents_year
  ON public.school_documents (academic_year_id) WHERE academic_year_id IS NOT NULL;

-- 3. updated_at trigger
CREATE OR REPLACE FUNCTION public.set_school_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_school_documents_updated_at ON public.school_documents;
CREATE TRIGGER trg_school_documents_updated_at
BEFORE UPDATE ON public.school_documents
FOR EACH ROW EXECUTE FUNCTION public.set_school_documents_updated_at();

-- 4. Enable RLS
ALTER TABLE public.school_documents ENABLE ROW LEVEL SECURITY;

-- 5. Helper: can current user see this campus?
--    Reuses get_user_campuses() pattern.
CREATE OR REPLACE FUNCTION public.user_can_see_campus(_campus_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _campus_code IS NULL
    OR public.can_user_access_all_campuses()
    OR _campus_code = ANY(public.get_user_campuses());
$$;

-- 6. Policies

-- Admins: full access
CREATE POLICY "Admins manage school documents"
ON public.school_documents
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Teachers: read teacher_* and student_* in their campus (or global)
CREATE POLICY "Teachers read school documents in scope"
ON public.school_documents
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('teacher','admin','super_admin')
  )
  AND public.user_can_see_campus(campus_code)
);

-- Parents: read only student_* docs in their campus (or global)
CREATE POLICY "Parents read student documents in scope"
ON public.school_documents
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND doc_type IN ('student_handbook','student_timetable')
  AND public.is_parent()
  AND (
    campus_code IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.student_guardians sg
      JOIN public.students s ON s.id = sg.student_id
      WHERE sg.guardian_user_id = auth.uid()
        AND s.campus_code = school_documents.campus_code
    )
  )
);

-- 7. Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-documents', 'school-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage RLS

-- Admins: full CRUD on bucket
CREATE POLICY "Admins manage school-documents objects"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'school-documents' AND public.is_admin())
WITH CHECK (bucket_id = 'school-documents' AND public.is_admin());

-- Teachers + Parents: read via signed URL (RLS check on SELECT)
CREATE POLICY "Teachers read school-documents objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'school-documents'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('teacher','admin','super_admin')
  )
);

CREATE POLICY "Parents read student school-documents objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'school-documents'
  AND public.is_parent()
  AND (name LIKE 'student_handbook/%' OR name LIKE 'student_timetable/%')
);
