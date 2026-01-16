import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  mockLessonPlans,
  type LessonPlan,
  type Topic,
  type Week,
  type SubjectCurriculum,
} from "@/data/lessonPlanData";
import { normalizeSubtopics } from "@/lib/lessonplan/normalizeSubtopics";

// Hook to load subjects from Supabase (same source as Academic module)
export function useLessonPlanSubjects() {
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("subjects")
          .select("id, name")
          .order("name");

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
  }, []);

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
  teacher_names: string[];
  date: string | null;
  topic: string;
  subtopics: string[];
  learning_objectives: string[];
  vocabulary: string[];
  previous_learning: string;
  lesson_flow: Record<string, unknown>;
  resources: string;
  attachments: string[];
  homework: string;
  reflection: Record<string, unknown>;
  attendance: Record<string, unknown> | null;
  approval: Record<string, unknown>;
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
          teacherNames: detail.teacher_names,
          className: lessonPlan.class,
          subject: lessonPlan.subject,
          topic: detail.topic || topic.title,
          subtopics: normalizeSubtopics(detail.subtopics),
          date: detail.date || "",
          learningObjectives: detail.learning_objectives,
          vocabulary: detail.vocabulary,
          previousLearning: detail.previous_learning,
          lessonFlow: detail.lesson_flow as unknown as LessonPlan["lessonFlow"],
          resources: detail.resources,
          attachments: detail.attachments,
          homework: detail.homework,
          reflection: detail.reflection as unknown as LessonPlan["reflection"],
          attendance: detail.attendance as unknown as LessonPlan["attendance"],
          approval: detail.approval as unknown as LessonPlan["approval"],
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

// Seed database with mock data
async function seedLessonPlanData(
  teacherId: string,
  academicYear: number,
  subject: string,
  className: string
): Promise<string | null> {
  try {
    // Find mock data for this subject
    const mockData = mockLessonPlans.find((m) => m.subject === subject);
    if (!mockData) {
      console.warn(`No mock data found for subject: ${subject}`);
      return null;
    }

    // 1. Create the master lesson_plan record
    const { data: lessonPlan, error: lpError } = await supabase
      .from("lesson_plans")
      .insert({
        teacher_id: teacherId,
        academic_year: academicYear,
        subject: subject,
        class: className,
      })
      .select()
      .single();

    if (lpError) throw lpError;

    // 2. Create topics
    for (let topicIndex = 0; topicIndex < mockData.topics.length; topicIndex++) {
      const mockTopic = mockData.topics[topicIndex];

      const { data: topic, error: topicError } = await supabase
        .from("lesson_topics")
        .insert({
          lesson_plan_id: lessonPlan.id,
          title: mockTopic.title,
          subtopics: mockTopic.subtopics,
          topic_order: topicIndex,
        })
        .select()
        .single();

      if (topicError) throw topicError;

      // 3. Create weeks for this topic
      for (let weekIndex = 0; weekIndex < mockTopic.weeks.length; weekIndex++) {
        const mockWeek = mockTopic.weeks[weekIndex];

        const { data: week, error: weekError } = await supabase
          .from("lesson_weeks")
          .insert({
            topic_id: topic.id,
            week_number: mockWeek.weekNumber,
            title: mockWeek.title,
            week_order: weekIndex,
          })
          .select()
          .single();

        if (weekError) throw weekError;

        // 4. Create lesson plan details for this week
        for (const mockLp of mockWeek.lessonPlans) {
          const { error: detailError } = await supabase
            .from("lesson_plan_details")
            .insert({
              week_id: week.id,
              lesson_number: mockLp.lessonNumber,
              title: mockLp.title,
              teacher_names: mockLp.teacherNames,
              date: mockLp.date || null,
              topic: mockLp.topic,
              subtopics: mockLp.subtopics,
              learning_objectives: mockLp.learningObjectives,
              vocabulary: mockLp.vocabulary,
              previous_learning: mockLp.previousLearning,
              lesson_flow: mockLp.lessonFlow,
              resources: mockLp.resources,
              attachments: mockLp.attachments,
              homework: mockLp.homework,
              reflection: mockLp.reflection,
              attendance: mockLp.attendance,
              approval: mockLp.approval,
            });

          if (detailError) throw detailError;
        }
      }
    }

    return lessonPlan.id;
  } catch (error) {
    console.error("Error seeding lesson plan data:", error);
    throw error;
  }
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
        .maybeSingle();

      if (fetchError) throw fetchError;

      let planId = existingPlan?.id;

      // If no plan exists, seed with mock data
      if (!existingPlan) {
        planId = await seedLessonPlanData(user.id, academicYear, subject, className);
        if (!planId) {
          // No mock data for this subject, create empty plan
          const { data: newPlan, error: createError } = await supabase
            .from("lesson_plans")
            .insert({
              teacher_id: user.id,
              academic_year: academicYear,
              subject: subject,
              class: className,
            })
            .select()
            .single();

          if (createError) throw createError;
          planId = newPlan.id;
        }

        toast({
          title: "Lesson Plan Created",
          description: `Initial lesson plan for ${subject} - ${className} has been created.`,
        });
      }

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
      
      // Fallback to mock data if DB fails
      const mockData = mockLessonPlans.find((m) => m.subject === subject);
      if (mockData) {
        setCurriculum(mockData);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, academicYear, subject, className]);

  useEffect(() => {
    fetchLessonPlan();
  }, [fetchLessonPlan]);

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
      if (!lessonPlanId) return null;

      try {
        const topicOrder = curriculum?.topics.length || 0;

        const { data: topic, error } = await supabase
          .from("lesson_topics")
          .insert({
            lesson_plan_id: lessonPlanId,
            title,
            subtopics,
            topic_order: topicOrder,
          })
          .select()
          .single();

        if (error) throw error;

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
                weeks: [],
              },
            ],
          };
        });

        toast({
          title: "Topic Created",
          description: `Topic "${title}" has been added.`,
        });

        return topic.id;
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
    [lessonPlanId, curriculum?.topics.length]
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
            *,
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
          const detail = data as DbLessonPlanDetail & {
            lesson_weeks: {
              week_number: number;
              lesson_topics: {
                title: string;
                lesson_plans: { subject: string; class: string };
              };
            };
          };

          setLessonPlan({
            id: detail.id,
            title: detail.title,
            weekNumber: detail.lesson_weeks.week_number,
            lessonNumber: detail.lesson_number,
            teacherNames: detail.teacher_names,
            className: detail.lesson_weeks.lesson_topics.lesson_plans.class,
            subject: detail.lesson_weeks.lesson_topics.lesson_plans.subject,
            topic: detail.topic || detail.lesson_weeks.lesson_topics.title,
            subtopics: normalizeSubtopics(detail.subtopics),
            date: detail.date || "",
            learningObjectives: detail.learning_objectives,
            vocabulary: detail.vocabulary,
            previousLearning: detail.previous_learning,
            lessonFlow: detail.lesson_flow as unknown as LessonPlan["lessonFlow"],
            resources: detail.resources,
            attachments: detail.attachments,
            homework: detail.homework,
            reflection: detail.reflection as unknown as LessonPlan["reflection"],
            attendance: detail.attendance as unknown as LessonPlan["attendance"],
            approval: detail.approval as unknown as LessonPlan["approval"],
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
  }, [lessonPlanDetailId]);

  const updateLessonPlan = useCallback(
    async (updates: Partial<LessonPlan>) => {
      if (!lessonPlanDetailId) return false;

      try {
        const dbUpdates: Partial<DbLessonPlanDetail> = {};

        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.teacherNames !== undefined) dbUpdates.teacher_names = updates.teacherNames;
        if (updates.date !== undefined) dbUpdates.date = updates.date || null;
        if (updates.subtopics !== undefined) {
          dbUpdates.subtopics = normalizeSubtopics(updates.subtopics);
        }
        if (updates.learningObjectives !== undefined) dbUpdates.learning_objectives = updates.learningObjectives;
        if (updates.vocabulary !== undefined) dbUpdates.vocabulary = updates.vocabulary;
        if (updates.previousLearning !== undefined) dbUpdates.previous_learning = updates.previousLearning;
        if (updates.lessonFlow !== undefined) dbUpdates.lesson_flow = updates.lessonFlow as unknown as Record<string, unknown>;
        if (updates.resources !== undefined) dbUpdates.resources = updates.resources;
        if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;
        if (updates.homework !== undefined) dbUpdates.homework = updates.homework;
        if (updates.reflection !== undefined) dbUpdates.reflection = updates.reflection as unknown as Record<string, unknown>;
        if (updates.attendance !== undefined) dbUpdates.attendance = updates.attendance as unknown as Record<string, unknown> | null;
        if (updates.approval !== undefined) dbUpdates.approval = updates.approval as unknown as Record<string, unknown>;
        if (updates.topic !== undefined) dbUpdates.topic = updates.topic;

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
