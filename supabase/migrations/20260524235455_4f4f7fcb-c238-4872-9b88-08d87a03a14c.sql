DELETE FROM public.student_parent
WHERE parent_id = 'bc6d836b-bc70-4d8c-943c-8bb9a993b2a8'
  AND student_id IN (
    'ff1f5640-d2fa-40c9-84a4-3cc9a71e4de3',
    'aba24874-9ece-4cd9-ae38-ee3e73b34e8d',
    '89c03bec-0fd5-476e-a979-c9fe2d7c4718'
  );

DELETE FROM public.student_guardians
WHERE guardian_user_id = '4682ce70-d878-43da-80a5-0d939ae69740'
  AND student_id IN (
    'ff1f5640-d2fa-40c9-84a4-3cc9a71e4de3',
    'aba24874-9ece-4cd9-ae38-ee3e73b34e8d',
    '89c03bec-0fd5-476e-a979-c9fe2d7c4718'
  );