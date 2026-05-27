import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCampus } from "@/contexts/CampusContext";
import { toast } from "@/hooks/use-toast";
import {
  type LessonPlan,
  type Topic,
  type Week,
  type SubjectCurriculum,
} from "@/data/lessonPlanData";
import { normalizeSubtopics } from "@/lib/lessonplan/normalizeSubtopics";
import { normalizeLessonFlow } from "@/lib/lessonplan/normalizeLessonFlow";
import { useRefetchOnResume, useResumeTick } from "@/hooks/useRefreshOnAppResume";

// Hook to load subjects from Supabase (same source as Academic module)
export function useLessonPlanSubjects() {
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeCampus } = useCampus();
  const resumeTick = useResumeTick();

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("subjects")
          .select("id, name, campus_code")
          .order("name");

        if (activeCampus) {
          query = query.or(`campus_code.eq.${activeCampus},campus_code.is.null`);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setSubjects(data || []);
      } catch (err) {
        console.error("Error loading subjects:", err);
        setError("Failed to load subjects");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [activeCampus, resumeTick]);

  // Get just the subject names for dropdown display
  const subjectNames = useMemo(() => subjects.map(s => s.name), [subjects]);

  return { subjects, subjectNames, loading, error };
}

// Database types matching our schema
interface DbLessonPlan {
  id: string;
  teacher_id: string;
  academic_year: number;
  subject: string;
  class: string;
  created_at: string;
  updated_at: string;
}

interface DbLessonTopic {
  id: string;
  lesson_plan_id: string;
  title: string;
  subtopics: string[];
  topic_order: number;
  created_at: string;
  updated_at: string;
}

interface DbLessonWeek {
  id: string;
  topic_id: string;
  week_number: number;
  title: string;
  week_order: number;
  created_at: string;
  updated_at: string;
}

interface DbLessonPlanDetail {
  id: string;
  week_id: string;
  lesson_number: number;
  title: string;
  date: string | null;
  subtopics: string[];
  learning_objectives: string[];
  lesson_flow: Record<string, unknown> | null;
  resources: string;
  attachments: string[];
  homework: string;
  reflection: Record<string, unknown> | null;
  attendance: Record<string, unknown> | null;
  approval: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Convert database data to UI format
function convertDbToUiFormat(
  lessonPlan: DbLessonPlan,
  topics: DbLessonTopic[],
  weeks: DbLessonWeek[],
  details: DbLessonPlanDetail[]
): SubjectCurriculum {
  const uiTopics: Topic[] = topics
    .sort((a, b) => a.topic_order - b.topic_order)
    .map((topic) => {
      const topicWeeks = weeks
        .filter((w) => w.topic_id === topic.id)
        .sort((a, b) => a.week_order - b.week_order);

      const uiWeeks: Week[] = topicWeeks.map((week) => {
        const weekDetails = details
          .filter((d) => d.week_id === week.id)
          .sort((a, b) => a.lesson_number - b.lesson_number);

        const lessonPlans: LessonPlan[] = weekDetails.map((detail) => ({
          id: detail.id,
          title: detail.title,
          weekNumber: week.week_number,
          lessonNumber: detail.lesson_number,
          teacherNames: [],
          className: lessonPlan.class,
          subject: lessonPlan.subject,
          topic: topic.title,
          subtopics: normalizeSubtopics(detail.subtopics),
          date: detail.date || "",
          learningObjectives: detail.learning_objectives || [],
          vocabulary: [],
          previousLearning: "",
          lessonFlow: normalizeLessonFlow(detail.lesson_flow),
          resources: detail.resources || "",
          attachments: detail.attachments || [],
          homework: detail.homework || "",
          reflection: (detail.reflection || {}) as unknown as LessonPlan["reflection"],
          attendance: detail.attendance as unknown as LessonPlan["attendance"],
          approval: (detail.approval || {}) as unknown as LessonPlan["approval"],
          createdAt: detail.created_at,
          updatedAt: detail.updated_at,
        }));

        return {
          id: week.id,
          weekNumber: week.week_number,
          title: week.title,
          lessonPlans,
        };
      });

      return {
        id: topic.id,
        title: topic.title,
        subtopics: normalizeSubtopics(topic.subtopics),
        weeks: uiWeeks,
      };
    });

  return {
    subject: lessonPlan.subject,
    topics: uiTopics,
  };
}

export function useLessonPlans(
  academicYear: number,
  subject: string,
  className: string
) {
  const { user } = useAuth();
  const [curriculum, setCurriculum] = useState<SubjectCurriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonPlanId, setLessonPlanId] = useState<string | null>(null);

  const fetchLessonPlan = useCallback(async () => {
    if (!user?.id || !subject || !className) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if lesson plan exists for this teacher/year/subject/class
      const { data: existingPlan, error: fetchError } = await supabase
        .from("lesson_plans")
        .select("*")
        .eq("teacher_id", user.id)
        .eq("academic_year", academicYear)
        .eq("subject", subject)
        .eq("class", className)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let planId = existingPlan?.id;

      setLessonPlanId(planId || null);

      if (!planId) {
        setCurriculum({ subject, topics: [] });
        setLoading(false);
        return;
      }

      // Fetch all data
      const [topicsRes, weeksRes, detailsRes] = await Promise.all([
        supabase
          .from("lesson_topics")
          .select("*")
          .eq("lesson_plan_id", planId)
          .order("topic_order"),
        supabase
          .from("lesson_weeks")
          .select("*, lesson_topics!inner(lesson_plan_id)")
          .eq("lesson_topics.lesson_plan_id", planId)
          .order("week_order"),
        supabase
          .from("lesson_plan_details")
          .select("*, lesson_weeks!inner(topic_id, lesson_topics!inner(lesson_plan_id))")
          .eq("lesson_weeks.lesson_topics.lesson_plan_id", planId)
          .order("lesson_number"),
      ]);

      if (topicsRes.error) throw topicsRes.error;
      if (weeksRes.error) throw weeksRes.error;
      if (detailsRes.error) throw detailsRes.error;

        const lessonPlan: DbLessonPlan = {
          id: planId,
          teacher_id: user.id,
          academic_year: academicYear,
          subject: subject,
          class: className,
          created_at: existingPlan?.created_at || new Date().toISOString(),
          updated_at: existingPlan?.updated_at || new Date().toISOString(),
        };

      const curriculumData = convertDbToUiFormat(
        lessonPlan,
        topicsRes.data as DbLessonTopic[],
        weeksRes.data as DbLessonWeek[],
        detailsRes.data as DbLessonPlanDetail[]
      );

      setCurriculum(curriculumData);
    } catch (err) {
      console.error("Error fetching lesson plans:", err);
      setError(err instanceof Error ? err.message : "Failed to load lesson plans");
      
    } finally {
      setLoading(false);
    }
  }, [user?.id, academicYear, subject, className]);

  useEffect(() => {
    fetchLessonPlan();
  }, [fetchLessonPlan]);

  useRefetchOnResume(fetchLessonPlan);

  // Update week number
  const updateWeekNumber = useCallback(
    async (weekId: string, newWeekNumber: number) => {
      try {
        const { error } = await supabase
          .from("lesson_weeks")
          .update({ week_number: newWeekNumber })
          .eq("id", weekId);

        if (error) throw error;

        // Update local state
        setCurriculum((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            topics: prev.topics.map((topic) => ({
              ...topic,
              weeks: topic.weeks.map((week) =>
                week.id === weekId ? { ...week, weekNumber: newWeekNumber } : week
              ),
            })),
          };
        });

        return true;
      } catch (err) {
        console.error("Error updating week:", err);
        toast({
          title: "Error",
          description: "Failed to update week number",
          variant: "destructive",
        });
        return false;
      }
    },
    []
  );

  // Add new topic
  const addTopic = useCallback(
    async (title: string, subtopics: string[] = []) => {
      let planId = lessonPlanId;
      if (!planId) {
        const { data: newPlan, error: createError } = await supabase
          .from("lesson_plans")
          .insert({
            teacher_id: user?.id,
            academic_year: academicYear,
            subject: subject,
            class: className,
          })
          .select()
          .single();

        if (createError) throw createError;
        planId = newPlan.id;
        setLessonPlanId(planId);
      }

      try {
        const topicOrder = curriculum?.topics.length || 0;

        const { data: topic, error } = await supabase
          .from("lesson_topics")
          .insert({
            lesson_plan_id: planId,
            title,
            subtopics,
            topic_order: topicOrder,
          })
          .select()
          .single();

        if (error) throw error;

        const { data: week, error: weekError } = await supabase
          .from("lesson_weeks")
          .insert({
            topic_id: topic.id,
            week_number: 1,
            week_order: 1,
            title: "Week 1",
          })
          .select()
          .single();

        if (weekError) throw weekError;

        // Update local state
        setCurriculum((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            topics: [
              ...prev.topics,
              {
                id: topic.id,
                title: topic.title,
                subtopics: topic.subtopics,
                weeks: [
                  {
                    id: week.id,
                    weekNumber: week.week_number,
                    title: week.title,
                    lessonPlans: [],
                  },
                ],
              },
            ],
          };
        });

        toast({
          title: "Topic Created",
          description: `Topic "${title}" has been added.`,
        });

        return { topicId: topic.id, weekId: week.id };
      } catch (err) {
        console.error("Error adding topic:", err);
        toast({
          title: "Error",
          description: "Failed to add topic",
          variant: "destructive",
        });
        return null;
      }
    },
    [lessonPlanId, curriculum?.topics.length, user?.id, academicYear, subject, className]
  );

  // Update topic
  const updateTopic = useCallback(
    async (topicId: string, title: string, subtopics: string[]) => {
      const normalizedSubtopics = normalizeSubtopics(subtopics);
      try {
        const { error } = await supabase
          .from("lesson_topics")
          .update({ title, subtopics: normalizedSubtopics })
          .eq("id", topicId);

        if (error) throw error;

        // Update local state
        setCurriculum((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            topics: prev.topics.map((topic) =>
              topic.id === topicId ? { ...topic, title, subtopics: normalizedSubtopics } : topic
            ),
          };
        });

        toast({
          title: "Topic Updated",
          description: `Topic "${title}" has been updated.`,
        });

        return true;
      } catch (err) {
        console.error("Error updating topic:", err);
        toast({
          title: "Error",
          description: "Failed to update topic",
          variant: "destructive",
        });
        return false;
      }
    },
    []
  );

  // Add week to topic
  const addWeek = useCallback(
    async (topicId: string, weekNumber: number, title: string) => {
      try {
        const topic = curriculum?.topics.find((t) => t.id === topicId);
        const weekOrder = topic?.weeks.length || 0;

        const { data: week, error } = await supabase
          .from("lesson_weeks")
          .insert({
            topic_id: topicId,
            week_number: weekNumber,
            title,
            week_order: weekOrder,
          })
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setCurriculum((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            topics: prev.topics.map((t) =>
              t.id === topicId
                ? {
                    ...t,
                    weeks: [
                      ...t.weeks,
                      {
                        id: week.id,
                        weekNumber: week.week_number,
                        title: week.title,
                        lessonPlans: [],
                      },
                    ],
                  }
                : t
            ),
          };
        });

        return week.id;
      } catch (err) {
        console.error("Error adding week:", err);
        toast({
          title: "Error",
          description: "Failed to add week",
          variant: "destructive",
        });
        return null;
      }
    },
    [curriculum?.topics]
  );

  return {
    curriculum,
    loading,
    error,
    lessonPlanId,
    refetch: fetchLessonPlan,
    updateWeekNumber,
    addTopic,
    updateTopic,
    addWeek,
  };
}

// Hook for fetching a single lesson plan detail
export function useLessonPlanDetail(lessonPlanDetailId: string | undefined) {
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resumeTick = useResumeTick();

  useEffect(() => {
    async function fetchDetail() {
      if (!lessonPlanDetailId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("lesson_plan_details")
          .select(`
            id,
            week_id,
            lesson_number,
            title,
            date,
            subtopics,
            learning_objectives,
            lesson_flow,
            resources,
            attachments,
            homework,
            reflection,
            attendance,
            approval,
            created_at,
            updated_at,
            lesson_weeks!inner (
              id,
              week_number,
              title,
              lesson_topics!inner (
                id,
                title,
                lesson_plans!inner (
                  id,
                  subject,
                  class
                )
              )
            )
          `)
          .eq("id", lessonPlanDetailId)
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          const rawData = data as unknown as Record<string, unknown>;
          const lessonWeeksArray = rawData.lesson_weeks as Array<Record<string, unknown>> | undefined;
          const firstWeek = lessonWeeksArray?.[0];
          const lessonTopicsArray = firstWeek?.lesson_topics as Array<Record<string, unknown>> | undefined;
          const firstTopic = lessonTopicsArray?.[0];
          const lessonPlansData = firstTopic?.lesson_plans as Record<string, unknown> | undefined;

          const weekNumber = typeof firstWeek?.week_number === 'number' ? firstWeek.week_number : 1;
          const topicTitle = typeof firstTopic?.title === 'string' ? firstTopic.title : '';
          const planSubject = typeof lessonPlansData?.subject === 'string' ? lessonPlansData.subject : '';
          const planClass = typeof lessonPlansData?.class === 'string' ? lessonPlansData.class : '';

          const detail = rawData as unknown as DbLessonPlanDetail;
          setLessonPlan({
            id: detail.id,
            title: detail.title,
            weekNumber: weekNumber,
            lessonNumber: detail.lesson_number,
            teacherNames: [],
            className: planClass,
            subject: planSubject,
            topic: topicTitle,
            subtopics: normalizeSubtopics(detail.subtopics),
            date: detail.date || "",
            learningObjectives: detail.learning_objectives || [],
            vocabulary: [],
            previousLearning: "",
            lessonFlow: normalizeLessonFlow(detail.lesson_flow),
            resources: detail.resources || "",
            attachments: detail.attachments || [],
            homework: detail.homework || "",
            reflection: (detail.reflection || {}) as unknown as LessonPlan["reflection"],
            attendance: detail.attendance as unknown as LessonPlan["attendance"],
            approval: (detail.approval || {}) as unknown as LessonPlan["approval"],
            createdAt: detail.created_at,
            updatedAt: detail.updated_at,
          });
        }
      } catch (err) {
        console.error("Error fetching lesson plan detail:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson plan");
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [lessonPlanDetailId, resumeTick]);

  const updateLessonPlan = useCallback(
    async (updates: Partial<LessonPlan>) => {
      if (!lessonPlanDetailId) return false;

      try {
        const dbUpdates: Partial<DbLessonPlanDetail> = {};

        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.date !== undefined) dbUpdates.date = updates.date || null;
        if (updates.subtopics !== undefined) {
          dbUpdates.subtopics = normalizeSubtopics(updates.subtopics);
        }
        if (updates.learningObjectives !== undefined) dbUpdates.learning_objectives = updates.learningObjectives;
        if (updates.lessonFlow !== undefined) dbUpdates.lesson_flow = updates.lessonFlow as unknown as Record<string, unknown>;
        if (updates.resources !== undefined) dbUpdates.resources = updates.resources;
        if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;
        if (updates.homework !== undefined) dbUpdates.homework = updates.homework;
        if (updates.reflection !== undefined) dbUpdates.reflection = updates.reflection as unknown as Record<string, unknown>;
        if (updates.attendance !== undefined) dbUpdates.attendance = updates.attendance as unknown as Record<string, unknown> | null;
        if (updates.approval !== undefined) dbUpdates.approval = updates.approval as unknown as Record<string, unknown>;

        const { error } = await supabase
          .from("lesson_plan_details")
          .update(dbUpdates)
          .eq("id", lessonPlanDetailId);

        if (error) throw error;

        // Update local state
        setLessonPlan((prev) => (prev ? { ...prev, ...updates } : prev));

        return true;
      } catch (err) {
        console.error("Error updating lesson plan:", err);
        toast({
          title: "Error",
          description: "Failed to save changes",
          variant: "destructive",
        });
        return false;
      }
    },
    [lessonPlanDetailId]
  );

  return {
    lessonPlan,
    loading,
    error,
    updateLessonPlan,
  };
}
