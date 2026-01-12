-- =============================================
-- Lesson Plans Module Schema
-- =============================================

-- Add can_manage_lesson_plans to user_profiles for future permission control
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS can_manage_lesson_plans boolean DEFAULT true;

-- =============================================
-- Table 1: lesson_plans (master record per teacher/year/subject/class)
-- =============================================
CREATE TABLE public.lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  academic_year int NOT NULL,
  subject text NOT NULL,
  class text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, academic_year, subject, class)
);

-- Enable RLS
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_plans
CREATE POLICY "Teachers can view their own lesson plans"
ON public.lesson_plans FOR SELECT
TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert their own lesson plans"
ON public.lesson_plans FOR INSERT
TO authenticated
WITH CHECK (
  teacher_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND can_manage_lesson_plans = true
  )
);

CREATE POLICY "Teachers can update their own lesson plans"
ON public.lesson_plans FOR UPDATE
TO authenticated
USING (
  teacher_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND can_manage_lesson_plans = true
  )
);

CREATE POLICY "Teachers can delete their own lesson plans"
ON public.lesson_plans FOR DELETE
TO authenticated
USING (
  teacher_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND can_manage_lesson_plans = true
  )
);

-- Admins can do everything
CREATE POLICY "Admins can manage all lesson plans"
ON public.lesson_plans FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Index
CREATE INDEX idx_lesson_plans_teacher ON public.lesson_plans(teacher_id);
CREATE INDEX idx_lesson_plans_lookup ON public.lesson_plans(teacher_id, academic_year, subject, class);

-- =============================================
-- Table 2: lesson_topics
-- =============================================
CREATE TABLE public.lesson_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id uuid NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtopics text[] DEFAULT '{}',
  topic_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_topics (via lesson_plan relationship)
CREATE POLICY "Teachers can view their own topics"
ON public.lesson_topics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_plans lp 
    WHERE lp.id = lesson_plan_id 
    AND lp.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can insert their own topics"
ON public.lesson_topics FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lesson_plans lp 
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE lp.id = lesson_plan_id 
    AND lp.teacher_id = auth.uid()
    AND up.can_manage_lesson_plans = true
  )
);

CREATE POLICY "Teachers can update their own topics"
ON public.lesson_topics FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_plans lp 
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE lp.id = lesson_plan_id 
    AND lp.teacher_id = auth.uid()
    AND up.can_manage_lesson_plans = true
  )
);

CREATE POLICY "Teachers can delete their own topics"
ON public.lesson_topics FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_plans lp 
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE lp.id = lesson_plan_id 
    AND lp.teacher_id = auth.uid()
    AND up.can_manage_lesson_plans = true
  )
);

CREATE POLICY "Admins can manage all topics"
ON public.lesson_topics FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Index
CREATE INDEX idx_lesson_topics_plan ON public.lesson_topics(lesson_plan_id);
CREATE INDEX idx_lesson_topics_order ON public.lesson_topics(lesson_plan_id, topic_order);

-- =============================================
-- Table 3: lesson_weeks (weeks within topics)
-- =============================================
CREATE TABLE public.lesson_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.lesson_topics(id) ON DELETE CASCADE,
  week_number int NOT NULL,
  title text NOT NULL,
  week_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_weeks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_weeks
CREATE POLICY "Teachers can view their own weeks"
ON public.lesson_weeks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_topics lt
    JOIN public.lesson_plans lp ON lp.id = lt.lesson_plan_id
    WHERE lt.id = topic_id 
    AND lp.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can insert their own weeks"
ON public.lesson_weeks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lesson_topics lt
    JOIN public.lesson_plans lp ON lp.id = lt.lesson_plan_id
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE lt.id = topic_id 
    AND lp.teacher_id = auth.uid()
    AND up.can_manage_lesson_plans = true
  )
);

CREATE POLICY "Teachers can update their own weeks"
ON public.lesson_weeks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_topics lt
    JOIN public.lesson_plans lp ON lp.id = lt.lesson_plan_id
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE lt.id = topic_id 
    AND lp.teacher_id = auth.uid()
    AND up.can_manage_lesson_plans = true
  )
);

CREATE POLICY "Teachers can delete their own weeks"
ON public.lesson_weeks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_topics lt
    JOIN public.lesson_plans lp ON lp.id = lt.lesson_plan_id
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE lt.id = topic_id 
    AND lp.teacher_id = auth.uid()
    AND up.can_manage_lesson_plans = true
  )
);

CREATE POLICY "Admins can manage all weeks"
ON public.lesson_weeks FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Index
CREATE INDEX idx_lesson_weeks_topic ON public.lesson_weeks(topic_id);

-- =============================================
-- Table 4: lesson_plan_details (individual lesson plans)
-- =============================================
CREATE TABLE public.lesson_plan_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.lesson_weeks(id) ON DELETE CASCADE,
  lesson_number int NOT NULL CHECK (lesson_number >= 1 AND lesson_number <= 10),
  title text NOT NULL DEFAULT '',
  teacher_names text[] DEFAULT '{}',
  date date,
  topic text DEFAULT '',
  subtopics text[] DEFAULT '{}',
  learning_objectives text[] DEFAULT '{}',
  vocabulary text[] DEFAULT '{}',
  previous_learning text DEFAULT '',
  lesson_flow jsonb DEFAULT '{}',
  resources text DEFAULT '',
  attachments text[] DEFAULT '{}',
  homework text DEFAULT '',
  reflection jsonb DEFAULT '{}',
  attendance jsonb,
  approval jsonb DEFAULT '{"status": "draft", "preparedBy": "", "preparedDate": null, "checkedBy": null, "checkedDate": null}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(week_id, lesson_number)
);

-- Enable RLS
ALTER TABLE public.lesson_plan_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_plan_details
CREATE POLICY "Teachers can view their own lesson details"
ON public.lesson_plan_details FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_weeks lw
    JOIN public.lesson_topics lt ON lt.id = lw.topic_id
    JOIN public.lesson_plans lp ON lp.id = lt.lesson_plan_id
    WHERE lw.id = week_id 
    AND lp.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can insert their own lesson details"
ON public.lesson_plan_details FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lesson_weeks lw
    JOIN public.lesson_topics lt ON lt.id = lw.topic_id
    JOIN public.lesson_plans lp ON lp.id = lt.lesson_plan_id
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE lw.id = week_id 
    AND lp.teacher_id = auth.uid()
    AND up.can_manage_lesson_plans = true
  )
);

CREATE POLICY "Teachers can update their own lesson details"
ON public.lesson_plan_details FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_weeks lw
    JOIN public.lesson_topics lt ON lt.id = lw.topic_id
    JOIN public.lesson_plans lp ON lp.id = lt.lesson_plan_id
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE lw.id = week_id 
    AND lp.teacher_id = auth.uid()
    AND up.can_manage_lesson_plans = true
  )
);

CREATE POLICY "Teachers can delete their own lesson details"
ON public.lesson_plan_details FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_weeks lw
    JOIN public.lesson_topics lt ON lt.id = lw.topic_id
    JOIN public.lesson_plans lp ON lp.id = lt.lesson_plan_id
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE lw.id = week_id 
    AND lp.teacher_id = auth.uid()
    AND up.can_manage_lesson_plans = true
  )
);

CREATE POLICY "Admins can manage all lesson details"
ON public.lesson_plan_details FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Indexes
CREATE INDEX idx_lesson_details_week ON public.lesson_plan_details(week_id);
CREATE INDEX idx_lesson_details_lookup ON public.lesson_plan_details(week_id, lesson_number);

-- =============================================
-- Updated_at triggers
-- =============================================
CREATE TRIGGER update_lesson_plans_updated_at
  BEFORE UPDATE ON public.lesson_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_topics_updated_at
  BEFORE UPDATE ON public.lesson_topics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_weeks_updated_at
  BEFORE UPDATE ON public.lesson_weeks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_plan_details_updated_at
  BEFORE UPDATE ON public.lesson_plan_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();