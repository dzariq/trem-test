
-- 1) Revoke check_phone_exists from anon/public; only authenticated may call.
REVOKE EXECUTE ON FUNCTION public.check_phone_exists(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_phone_exists(text) FROM anon;

-- 2) Replace the open SELECT policy on announcement attachments with an
--    authenticated-only one.
DROP POLICY IF EXISTS "Anyone can view announcement attachments" ON storage.objects;

CREATE POLICY "Authenticated can view announcement attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'announcement-attachments');
