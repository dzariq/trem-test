import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { normalizeLessonFlow } from "@/lib/lessonplan/normalizeLessonFlow";
import { normalizeSubtopics } from "@/lib/lessonplan/normalizeSubtopics";
import { useResumeTick } from "@/hooks/useRefreshOnAppResume";

// Types for Teacher's view of Master Lesson Plans
export interface TeacherMLP {
  id: string;
  subject: string;
  yearLevel: string;
  academicYear: number;
  assignedClasses: AssignedClass[];
  topicsCount: number;
}

export interface AssignedClass {
  classYearId: number;
  className: string;
}

export interface LessonTopic {
  id: string;
  title: string;
  subtopics: string[];
  order: number;
}

export interface LessonWeek {
  id: string;
  topicId: string;
  weekNumber: number;
  title: string;
  order: number;
}

export interface LessonDetail {
  id: string;
  weekId: string;
  lessonNumber: number;
  title: string;
  date: string | null;
  subtopics: string[];
  learningObjectives: string[];
  lessonFlow: Record<string, unknown> | null;
  resources: string;
  homework: string;
  attachments: string[];
}

export interface LessonReflection {
  id: string;
  lessonPlanDetailId: string;
  classYearId: number;
  teacherUserId: string;
  whatWentWell: string;
  areasForImprovement: string;
  studentEngagement: string;
  followUpActions: string;
  learningOutcomesAchieved: boolean;
  reflectionNotes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to fetch lesson plans assigned to the current teacher
 */
export function useTeacherAssignedPlans(academicYear?: number, yearLevel?: string, subject?: string) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<TeacherMLP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resumeTick = useResumeTick();

  useEffect(() => {
    const fetchAssignedPlans = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // First get lesson_plan_ids assigned to this teacher
        const { data: assignments, error: assignError } = await supabase
          .from("lesson_plan_teacher_assignments")
          .select("lesson_plan_id")
          .eq("teacher_user_id", user.id);

        if (assignError) throw assignError;

        if (!assignments || assignments.length === 0) {
          setPlans([]);
          setLoading(false);
          return;
        }

        const planIds = assignments.map(a => a.lesson_plan_id);

        // Fetch the lesson plans with filters
        let query = supabase
          .from("lesson_plans")
          .select(`
            id,
            subject,
            year_level,
            academic_year,
            lesson_plan_class_assignments (
              class_year_id,
              class_years:class_year_id (
                id,
                class_name
              )
            ),
            lesson_topics (count)
          `)
          .in("id", planIds)
          .eq("is_master", true);

        if (academicYear) {
          query = query.eq("academic_year", academicYear);
        }
        if (yearLevel) {
          query = query.eq("year_level", yearLevel);
        }
        if (subject) {
          query = query.eq("subject", subject);
        }

        const { data: plansData, error: plansError } = await query;

        if (plansError) throw plansError;

        const formattedPlans: TeacherMLP[] = (plansData || []).map((plan: any) => ({
          id: plan.id,
          subject: plan.subject,
          yearLevel: plan.year_level || "",
          academicYear: plan.academic_year,
          assignedClasses: (plan.lesson_plan_class_assignments || []).map((ca: any) => ({
            classYearId: ca.class_year_id,
            className: ca.class_years?.class_name || `Class ${ca.class_year_id}`,
          })),
          topicsCount: plan.lesson_topics?.[0]?.count || 0,
        }));

        setPlans(formattedPlans);
      } catch (err) {
        console.error("Error fetching teacher assigned plans:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson plans");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedPlans();
  }, [user?.id, academicYear, yearLevel, subject, resumeTick]);

  return { plans, loading, error };
}

/**
 * Hook to fetch master lesson plan content (read-only) with lazy loading
 */
export function useMLPContent(lessonPlanId: string | undefined) {
  const [topics, setTopics] = useState<LessonTopic[]>([]);
  const [weeks, setWeeks] = useState<LessonWeek[]>([]);
  const [lessons, setLessons] = useState<Map<string, LessonDetail[]>>(new Map());
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [planInfo, setPlanInfo] = useState<{ subject: string; yearLevel: string; academicYear: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resumeTick = useResumeTick();

  // Fetch topics and plan info
  useEffect(() => {
    const fetchPlanContent = async () => {
      if (!lessonPlanId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch plan info and assigned classes
        const { data: plan, error: planError } = await supabase
          .from("lesson_plans")
          .select(`
            id,
            subject,
            year_level,
            academic_year,
            lesson_plan_class_assignments (
              class_year_id,
              class_years:class_year_id (
                id,
                class_name
              )
            )
          `)
          .eq("id", lessonPlanId)
          .single();

        if (planError) throw planError;

        setPlanInfo({
          subject: plan.subject,
          yearLevel: plan.year_level || "",
          academicYear: plan.academic_year,
        });

        const classes: AssignedClass[] = (plan.lesson_plan_class_assignments || []).map((ca: any) => ({
          classYearId: ca.class_year_id,
          className: ca.class_years?.class_name || `Class ${ca.class_year_id}`,
        }));
        setAssignedClasses(classes);

        // Fetch topics
        const { data: topicsData, error: topicsError } = await supabase
          .from("lesson_topics")
          .select("id, title, subtopics, topic_order")
          .eq("lesson_plan_id", lessonPlanId)
          .order("topic_order");

        if (topicsError) throw topicsError;

        const formattedTopics: LessonTopic[] = (topicsData || []).map(t => ({
          id: t.id,
          title: t.title,
          subtopics: normalizeSubtopics(t.subtopics),
          order: t.topic_order,
        }));
        setTopics(formattedTopics);

        // Fetch all weeks for this plan
        if (formattedTopics.length > 0) {
          const topicIds = formattedTopics.map(t => t.id);
          const { data: weeksData, error: weeksError } = await supabase
            .from("lesson_weeks")
            .select("id, topic_id, week_number, title, week_order")
            .in("topic_id", topicIds)
            .order("week_order");

          if (weeksError) throw weeksError;

          const formattedWeeks: LessonWeek[] = (weeksData || []).map(w => ({
            id: w.id,
            topicId: w.topic_id,
            weekNumber: w.week_number,
            title: w.title,
            order: w.week_order,
          }));
          setWeeks(formattedWeeks);
        }
      } catch (err) {
        console.error("Error fetching MLP content:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson plan");
      } finally {
        setLoading(false);
      }
    };

    fetchPlanContent();
  }, [lessonPlanId, resumeTick]);

  // Lazy load lessons for a specific week
  const loadLessonsForWeek = useCallback(async (weekId: string) => {
    if (lessons.has(weekId)) return; // Already loaded

    try {
      const { data, error } = await supabase
        .from("lesson_plan_details")
        .select("id, week_id, lesson_number, title, date, subtopics, learning_objectives, lesson_flow, resources, homework, attachments")
        .eq("week_id", weekId)
        .order("lesson_number");

      if (error) throw error;

      const formattedLessons: LessonDetail[] = (data || []).map(l => ({
        id: l.id,
        weekId: l.week_id,
        lessonNumber: l.lesson_number,
        title: l.title,
        date: l.date,
        subtopics: normalizeSubtopics(l.subtopics),
        learningObjectives: l.learning_objectives || [],
        lessonFlow: l.lesson_flow,
        resources: l.resources || "",
        homework: l.homework || "",
        attachments: l.attachments || [],
      }));

      setLessons(prev => new Map(prev).set(weekId, formattedLessons));
    } catch (err) {
      console.error("Error loading lessons for week:", err);
      toast({
        title: "Error",
        description: "Failed to load lessons",
        variant: "destructive",
      });
    }
  }, [lessons]);

  // Get weeks for a specific topic
  const getWeeksForTopic = useCallback((topicId: string) => {
    return weeks.filter(w => w.topicId === topicId).sort((a, b) => a.order - b.order);
  }, [weeks]);

  // Get lessons for a specific week (returns empty array if not loaded)
  const getLessonsForWeek = useCallback((weekId: string) => {
    return lessons.get(weekId) || [];
  }, [lessons]);

  // Optimistically update a lesson's homework text in local state
  const updateLessonHomework = useCallback((lessonId: string, homework: string) => {
    setLessons(prev => {
      const next = new Map(prev);
      for (const [weekId, weekLessons] of next) {
        const idx = weekLessons.findIndex(l => l.id === lessonId);
        if (idx !== -1) {
          const updated = [...weekLessons];
          updated[idx] = { ...updated[idx], homework };
          next.set(weekId, updated);
          break;
        }
      }
      return next;
    });
  }, []);

  return {
    topics,
    weeks,
    assignedClasses,
    planInfo,
    loading,
    error,
    loadLessonsForWeek,
    getWeeksForTopic,
    getLessonsForWeek,
    isLessonsLoaded: (weekId: string) => lessons.has(weekId),
    updateLessonHomework,
  };
}

/**
 * Hook to manage lesson reflections for a specific class
 */
export function useLessonReflections(lessonPlanId: string | undefined, classYearId: number | undefined) {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<Map<string, LessonReflection>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const resumeTick = useResumeTick();

  // Fetch reflections when class changes
  useEffect(() => {
    const fetchReflections = async () => {
      if (!lessonPlanId || !classYearId || !user?.id) {
        setReflections(new Map());
        return;
      }

      setLoading(true);

      try {
        // Get all lesson_plan_detail_ids for this lesson_plan
        const { data: topicsData } = await supabase
          .from("lesson_topics")
          .select("id")
          .eq("lesson_plan_id", lessonPlanId);

        if (!topicsData || topicsData.length === 0) {
          setReflections(new Map());
          setLoading(false);
          return;
        }

        const topicIds = topicsData.map(t => t.id);

        const { data: weeksData } = await supabase
          .from("lesson_weeks")
          .select("id")
          .in("topic_id", topicIds);

        if (!weeksData || weeksData.length === 0) {
          setReflections(new Map());
          setLoading(false);
          return;
        }

        const weekIds = weeksData.map(w => w.id);

        const { data: lessonsData } = await supabase
          .from("lesson_plan_details")
          .select("id")
          .in("week_id", weekIds);

        if (!lessonsData || lessonsData.length === 0) {
          setReflections(new Map());
          setLoading(false);
          return;
        }

        const lessonIds = lessonsData.map(l => l.id);

        // Fetch reflections for this class
        const { data: reflectionsData, error } = await supabase
          .from("lesson_reflections")
          .select("*")
          .in("lesson_plan_detail_id", lessonIds)
          .eq("class_year_id", classYearId);

        if (error) throw error;

        const reflectionsMap = new Map<string, LessonReflection>();
        (reflectionsData || []).forEach((r: any) => {
          reflectionsMap.set(r.lesson_plan_detail_id, {
            id: r.id,
            lessonPlanDetailId: r.lesson_plan_detail_id,
            classYearId: r.class_year_id,
            teacherUserId: r.teacher_user_id,
            whatWentWell: r.what_went_well || "",
            areasForImprovement: r.areas_for_improvement || "",
            studentEngagement: r.student_engagement || "",
            followUpActions: r.follow_up_actions || "",
            learningOutcomesAchieved: r.learning_outcomes_achieved || false,
            reflectionNotes: r.reflection_notes || "",
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          });
        });

        setReflections(reflectionsMap);
      } catch (err) {
        console.error("Error fetching reflections:", err);
        toast({
          title: "Error",
          description: "Failed to load reflections",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReflections();
  }, [lessonPlanId, classYearId, user?.id, resumeTick]);

  // Save or update a reflection
  const saveReflection = useCallback(async (
    lessonPlanDetailId: string,
    data: Partial<Omit<LessonReflection, "id" | "lessonPlanDetailId" | "classYearId" | "teacherUserId" | "createdAt" | "updatedAt">>
  ) => {
    if (!classYearId || !user?.id) {
      toast({
        title: "Error",
        description: "Please select a class first",
        variant: "destructive",
      });
      return false;
    }

    setSaving(true);

    try {
      const existing = reflections.get(lessonPlanDetailId);

      const dbData = {
        what_went_well: data.whatWentWell,
        areas_for_improvement: data.areasForImprovement,
        student_engagement: data.studentEngagement,
        follow_up_actions: data.followUpActions,
        learning_outcomes_achieved: data.learningOutcomesAchieved,
        reflection_notes: data.reflectionNotes,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        // Update
        const { error } = await supabase
          .from("lesson_reflections")
          .update(dbData)
          .eq("id", existing.id);

        if (error) {
          // Check for RLS error
          if (error.code === "42501") {
            toast({
              title: "Access Denied",
              description: "You don't have access to edit reflections for this class.",
              variant: "destructive",
            });
            return false;
          }
          throw error;
        }

        // Update local state
        setReflections(prev => {
          const next = new Map(prev);
          next.set(lessonPlanDetailId, {
            ...existing,
            ...data,
            updatedAt: dbData.updated_at,
          } as LessonReflection);
          return next;
        });
      } else {
        // Insert
        const insertData = {
          lesson_plan_detail_id: lessonPlanDetailId,
          class_year_id: classYearId,
          teacher_user_id: user.id,
          ...dbData,
        };

        const { data: newReflection, error } = await supabase
          .from("lesson_reflections")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          if (error.code === "42501") {
            toast({
              title: "Access Denied",
              description: "You don't have access to edit reflections for this class.",
              variant: "destructive",
            });
            return false;
          }
          throw error;
        }

        // Update local state
        setReflections(prev => {
          const next = new Map(prev);
          next.set(lessonPlanDetailId, {
            id: newReflection.id,
            lessonPlanDetailId: newReflection.lesson_plan_detail_id,
            classYearId: newReflection.class_year_id,
            teacherUserId: newReflection.teacher_user_id,
            whatWentWell: newReflection.what_went_well || "",
            areasForImprovement: newReflection.areas_for_improvement || "",
            studentEngagement: newReflection.student_engagement || "",
            followUpActions: newReflection.follow_up_actions || "",
            learningOutcomesAchieved: newReflection.learning_outcomes_achieved || false,
            reflectionNotes: newReflection.reflection_notes || "",
            createdAt: newReflection.created_at,
            updatedAt: newReflection.updated_at,
          });
          return next;
        });
      }

      toast({
        title: "Saved",
        description: "Reflection saved successfully",
      });

      return true;
    } catch (err) {
      console.error("Error saving reflection:", err);
      toast({
        title: "Error",
        description: "Failed to save reflection. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [classYearId, user?.id, reflections]);

  // Check if a lesson has a reflection
  const hasReflection = useCallback((lessonPlanDetailId: string) => {
    return reflections.has(lessonPlanDetailId);
  }, [reflections]);

  // Get reflection for a lesson
  const getReflection = useCallback((lessonPlanDetailId: string) => {
    return reflections.get(lessonPlanDetailId);
  }, [reflections]);

  return {
    reflections,
    loading,
    saving,
    saveReflection,
    hasReflection,
    getReflection,
  };
}

/**
 * Hook to manage homework for lessons — also creates homework_assignments + homework_assignment_students
 */
export function useHomeworkManagement() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const saveHomework = useCallback(async (
    lessonPlanDetailId: string,
    homework: string,
    classYearId?: number,
    subject?: string,
  ) => {
    setSaving(true);

    try {
      const trimmed = homework.trim() || null;

      // 1. Save to lesson_plan_details
      const { error } = await supabase
        .from("lesson_plan_details")
        .update({ 
          homework: trimmed,
          updated_at: new Date().toISOString() 
        })
        .eq("id", lessonPlanDetailId);

      if (error) {
        if (error.code === "42501") {
          toast({
            title: "Access Denied",
            description: "You don't have permission to update homework for this lesson.",
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      // 2. Upsert homework_assignments + auto-create student rows
      if (classYearId && user?.id && trimmed) {
        // Check if assignment already exists for this lesson+class
        const { data: existing } = await supabase
          .from("homework_assignments")
          .select("id")
          .eq("lesson_plan_detail_id", lessonPlanDetailId)
          .eq("class_year_id", classYearId)
          .maybeSingle();

        let assignmentId: string;

        if (existing) {
          // Update existing
          await supabase
            .from("homework_assignments")
            .update({
              instructions: trimmed,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          assignmentId = existing.id;
        } else {
          // Create new
          const { data: newAssignment, error: insertErr } = await supabase
            .from("homework_assignments")
            .insert({
              lesson_plan_detail_id: lessonPlanDetailId,
              class_year_id: classYearId,
              created_by: user.id,
              instructions: trimmed,
              subject: subject || "Unknown",
            })
            .select("id")
            .single();

          if (insertErr) {
            console.error("Error creating homework_assignment:", insertErr);
          } else {
            assignmentId = newAssignment.id;
          }
        }

        // Auto-create homework_assignment_students for all students in class
        if (assignmentId!) {
          const { data: students } = await supabase
            .from("students")
            .select("id")
            .eq("class_year_id", classYearId);

          if (students && students.length > 0) {
            const rows = students.map((s) => ({
              homework_id: assignmentId,
              student_id: s.id,
              status: "assigned",
            }));

            // Use upsert to avoid duplicates (unique constraint on homework_id+student_id)
            await supabase
              .from("homework_assignment_students")
              .upsert(rows, { onConflict: "homework_id,student_id", ignoreDuplicates: true });
          }
        }
      }

      toast({
        title: "Saved",
        description: "Homework saved successfully",
      });

      return true;
    } catch (err) {
      console.error("Error saving homework:", err);
      toast({
        title: "Error",
        description: "Failed to save homework. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.id]);

  const getHomework = useCallback((lesson: LessonDetail) => {
    return lesson.homework || "";
  }, []);

  return {
    saving,
    saveHomework,
    getHomework,
  };
}
