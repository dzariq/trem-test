
-- 1. Revoke anon access to check_phone_exists (feature currently disabled)
REVOKE EXECUTE ON FUNCTION public.check_phone_exists(text) FROM anon;

-- 2. Add admin-only policy to bukku_contacts_ic_mismatched
DROP POLICY IF EXISTS "Admins manage bukku ic mismatches" ON public.bukku_contacts_ic_mismatched;
CREATE POLICY "Admins manage bukku ic mismatches"
ON public.bukku_contacts_ic_mismatched
FOR ALL
TO authenticated
USING (public.is_admin_like())
WITH CHECK (public.is_admin_like());

-- 3. Remove permissive cca_activity_teachers SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view activity teachers" ON public.cca_activity_teachers;

-- 4. Scope lesson_week_subtopics policies to authenticated role only
DROP POLICY IF EXISTS lws_select_own_plan ON public.lesson_week_subtopics;
DROP POLICY IF EXISTS lws_insert_own_plan ON public.lesson_week_subtopics;
DROP POLICY IF EXISTS lws_update_own_plan ON public.lesson_week_subtopics;
DROP POLICY IF EXISTS lws_delete_own_plan ON public.lesson_week_subtopics;

CREATE POLICY lws_select_own_plan ON public.lesson_week_subtopics
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM lesson_weeks w
  JOIN lesson_topics t ON t.id = w.topic_id
  JOIN lesson_plans p ON p.id = t.lesson_plan_id
  WHERE w.id = lesson_week_subtopics.week_id AND p.teacher_id = auth.uid()
));

CREATE POLICY lws_insert_own_plan ON public.lesson_week_subtopics
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM lesson_weeks w
  JOIN lesson_topics t ON t.id = w.topic_id
  JOIN lesson_plans p ON p.id = t.lesson_plan_id
  WHERE w.id = lesson_week_subtopics.week_id AND p.teacher_id = auth.uid()
));

CREATE POLICY lws_update_own_plan ON public.lesson_week_subtopics
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM lesson_weeks w
  JOIN lesson_topics t ON t.id = w.topic_id
  JOIN lesson_plans p ON p.id = t.lesson_plan_id
  WHERE w.id = lesson_week_subtopics.week_id AND p.teacher_id = auth.uid()
));

CREATE POLICY lws_delete_own_plan ON public.lesson_week_subtopics
FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM lesson_weeks w
  JOIN lesson_topics t ON t.id = w.topic_id
  JOIN lesson_plans p ON p.id = t.lesson_plan_id
  WHERE w.id = lesson_week_subtopics.week_id AND p.teacher_id = auth.uid()
));
