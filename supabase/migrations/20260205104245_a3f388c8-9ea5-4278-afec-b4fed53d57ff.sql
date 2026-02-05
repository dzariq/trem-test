-- Step 1: Set default max_participants to 25 for cca_sessions
-- First, check if max_participants has a default, then alter it
ALTER TABLE public.cca_sessions
ALTER COLUMN max_participants SET DEFAULT 25;

-- Update existing NULL values to 25 (optional - only for sessions with no capacity set)
UPDATE public.cca_sessions
SET max_participants = 25
WHERE max_participants IS NULL;

-- Step 2: RLS for student_cca_enrollments - Parents can only SELECT, not modify

-- First, ensure RLS is enabled
ALTER TABLE public.student_cca_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to recreate with proper permissions)
DROP POLICY IF EXISTS "Parents can view child enrollments" ON public.student_cca_enrollments;
DROP POLICY IF EXISTS "Teachers can manage student enrollments" ON public.student_cca_enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.student_cca_enrollments;
DROP POLICY IF EXISTS "Students can manage own enrollments" ON public.student_cca_enrollments;

-- Policy: Parents can only SELECT enrollments for their linked children
CREATE POLICY "Parents can view child enrollments" 
ON public.student_cca_enrollments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.student_guardians sg
    WHERE sg.student_id = student_cca_enrollments.student_id
    AND sg.guardian_user_id = auth.uid()
  )
);

-- Policy: Teachers can view all enrollments (for now, as teacher-student mapping may vary)
CREATE POLICY "Teachers can view all enrollments" 
ON public.student_cca_enrollments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'teacher'
  )
);

-- Policy: Teachers can insert/update/delete enrollments for students in their scope
-- (Using a broad check for now - teacher role can manage enrollments)
CREATE POLICY "Teachers can manage enrollments" 
ON public.student_cca_enrollments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'teacher'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'teacher'
  )
);

-- Policy: Students can view their own enrollments
CREATE POLICY "Students can view own enrollments" 
ON public.student_cca_enrollments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_cca_enrollments.student_id
    AND s.user_id = auth.uid()
  )
);

-- Policy: Students can manage their own enrollments (for self-service switching)
CREATE POLICY "Students can manage own enrollments" 
ON public.student_cca_enrollments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_cca_enrollments.student_id
    AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_cca_enrollments.student_id
    AND s.user_id = auth.uid()
  )
);