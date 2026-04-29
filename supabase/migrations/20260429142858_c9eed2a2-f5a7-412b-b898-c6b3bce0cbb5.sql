
-- Create public bucket for student avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-avatars', 'student-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Student avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-avatars');

-- Authenticated users can upload student avatars
CREATE POLICY "Authenticated users can upload student avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-avatars');

-- Authenticated users can update student avatars
CREATE POLICY "Authenticated users can update student avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'student-avatars');

-- Authenticated users can delete student avatars
CREATE POLICY "Authenticated users can delete student avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'student-avatars');
