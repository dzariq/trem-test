-- Add image_url column to cca_activities table
ALTER TABLE public.cca_activities
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.cca_activities.image_url IS 'URL to the activity cover image stored in Supabase Storage';

-- Create storage bucket for CCA activity images
INSERT INTO storage.buckets (id, name, public)
VALUES ('cca-activity-images', 'cca-activity-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view images (public bucket)
CREATE POLICY "Public can view CCA images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cca-activity-images');

-- Teachers can upload CCA images
CREATE POLICY "Teachers can upload CCA images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cca-activity-images'
  AND public.is_teacher()
);

-- Teachers can update CCA images
CREATE POLICY "Teachers can update CCA images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cca-activity-images'
  AND public.is_teacher()
);

-- Teachers can delete CCA images
CREATE POLICY "Teachers can delete CCA images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cca-activity-images'
  AND public.is_teacher()
);

-- Admins can manage all CCA images
CREATE POLICY "Admins can manage CCA images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'cca-activity-images'
  AND public.is_admin_like()
)
WITH CHECK (
  bucket_id = 'cca-activity-images'
  AND public.is_admin_like()
);