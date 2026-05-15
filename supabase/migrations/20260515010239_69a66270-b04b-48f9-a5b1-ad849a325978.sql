-- 1) One-off cleanup of orphan student_guardians rows.
-- A guardian row is considered orphan if there is NO corresponding student_parent
-- link for the same (student_id, guardian_user_id) pair, even though the parent
-- has at least one other link (i.e. they are managed via the admin app).
DELETE FROM public.student_guardians sg
WHERE sg.guardian_user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.parents p
    WHERE p.parent_user_id = sg.guardian_user_id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.student_parent sp
    JOIN public.parents p ON p.id = sp.parent_id
    WHERE p.parent_user_id = sg.guardian_user_id
      AND sp.student_id = sg.student_id
  );

-- 2) Trigger: when a parent–student link is deleted from student_parent,
-- also delete the matching student_guardians row(s).
CREATE OR REPLACE FUNCTION public.unsync_student_guardians_from_parents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_user_id uuid;
BEGIN
  SELECT parent_user_id INTO v_parent_user_id
  FROM public.parents
  WHERE id = OLD.parent_id;

  IF v_parent_user_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- Only delete the guardian row if the parent has no remaining links to that student
  IF NOT EXISTS (
    SELECT 1
    FROM public.student_parent sp
    JOIN public.parents p ON p.id = sp.parent_id
    WHERE p.parent_user_id = v_parent_user_id
      AND sp.student_id = OLD.student_id
  ) THEN
    DELETE FROM public.student_guardians
    WHERE student_id = OLD.student_id
      AND guardian_user_id = v_parent_user_id;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_unsync_student_guardians_from_parents ON public.student_parent;
CREATE TRIGGER trg_unsync_student_guardians_from_parents
AFTER DELETE ON public.student_parent
FOR EACH ROW
EXECUTE FUNCTION public.unsync_student_guardians_from_parents();