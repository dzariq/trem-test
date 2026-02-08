-- Create homework_submissions table
CREATE TABLE homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_detail_id UUID NOT NULL REFERENCES lesson_plan_details(id) ON DELETE CASCADE,
  class_year_id INTEGER NOT NULL REFERENCES class_years(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submitted BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ,
  marked_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure unique combination per lesson/class/student
  UNIQUE(lesson_plan_detail_id, class_year_id, student_id)
);

-- Add indexes for common queries
CREATE INDEX idx_homework_submissions_lesson ON homework_submissions(lesson_plan_detail_id);
CREATE INDEX idx_homework_submissions_class ON homework_submissions(class_year_id);
CREATE INDEX idx_homework_submissions_student ON homework_submissions(student_id);

-- Enable RLS
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers can manage submissions for their assigned classes
CREATE POLICY "Teachers can manage homework submissions for assigned classes"
  ON homework_submissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lesson_plan_teacher_assignments lpta
      JOIN lesson_plan_details lpd ON lpd.id = homework_submissions.lesson_plan_detail_id
      JOIN lesson_weeks lw ON lw.id = lpd.week_id
      JOIN lesson_topics lt ON lt.id = lw.topic_id
      WHERE lpta.lesson_plan_id = lt.lesson_plan_id
        AND lpta.teacher_user_id = auth.uid()
    )
  );