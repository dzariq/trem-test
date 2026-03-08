import { useState, useEffect } from "react";
import { stripCampusPrefix } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import schoolLogo from "@/assets/school-badge.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Pencil,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createDefaultLessonFlow, type LessonPlan, type Week } from "@/data/lessonPlanData";
import {
  getAcademicYears,
  getActiveYear,
  setActiveYear,
} from "@/data/weekConfigData";
import { useLessonPlans, useLessonPlanSubjects } from "@/hooks/useLessonPlans";
import { useAcademicFilters } from "@/hooks/useAcademicFilters";
import { getLessonStatus } from "@/lib/lessonplan/getLessonStatus";
import { supabase } from "@/lib/supabase";

// LocalStorage keys for persisting selections
const LS_LESSON_PLAN_YEAR = "lessonPlan_selectedYear";
const LS_LESSON_PLAN_SUBJECT = "lessonPlan_selectedSubject";
const LS_LESSON_PLAN_CLASS = "lessonPlan_selectedClass";

const logSupabaseError = (
  context: string,
  error: { code?: string; message?: string; details?: string; hint?: string }
) => {
  console.error(`[${context}]`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
};

const formatStatusLabel = (status: "draft" | "incomplete" | "complete") =>
  status.charAt(0).toUpperCase() + status.slice(1);

type WeekSubtopic = {
  id: string;
  name: string;
  sort_order: number;
};

const TeacherLessonPlansPage = () => {
  const navigate = useNavigate();
  
  // Load subjects from Supabase (same source as Academic module)
  const { subjectNames: dbSubjects, loading: subjectsLoading } = useLessonPlanSubjects();
  
  // Load classes from Supabase (same source as Academic module)
  const { 
    classes: dbClasses, 
    loadingClasses 
  } = useAcademicFilters();
  
  // Year selection (static for now, can be derived from academic_periods if needed)
  const academicYears = getAcademicYears();
  
  // Initialize state from localStorage or defaults
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const saved = localStorage.getItem(LS_LESSON_PLAN_YEAR);
    return saved || getActiveYear()?.id || academicYears[0]?.id || "";
  });
  
  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    return localStorage.getItem(LS_LESSON_PLAN_SUBJECT) || "";
  });
  
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    return localStorage.getItem(LS_LESSON_PLAN_CLASS) || "";
  });
  
  // Set defaults when data loads
  useEffect(() => {
    if (dbSubjects.length > 0 && !selectedSubject) {
      const defaultSubject = dbSubjects[0];
      setSelectedSubject(defaultSubject);
      localStorage.setItem(LS_LESSON_PLAN_SUBJECT, defaultSubject);
    }
  }, [dbSubjects, selectedSubject]);
  
  useEffect(() => {
    if (dbClasses.length > 0 && !selectedClass) {
      const defaultClass = dbClasses[0];
      setSelectedClass(defaultClass);
      localStorage.setItem(LS_LESSON_PLAN_CLASS, defaultClass);
    }
  }, [dbClasses, selectedClass]);
  
  // Persist selections to localStorage
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setActiveYear(year);
    localStorage.setItem(LS_LESSON_PLAN_YEAR, year);
  };
  
  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    localStorage.setItem(LS_LESSON_PLAN_SUBJECT, subject);
  };
  
  const handleClassChange = (cls: string) => {
    setSelectedClass(cls);
    localStorage.setItem(LS_LESSON_PLAN_CLASS, cls);
  };
  
  // Use Supabase hook for lesson plans data
  const academicYearNum = parseInt(selectedYear) || 2026;
  const { 
    curriculum, 
    loading, 
    addTopic, 
    updateTopic,
    addWeek,
    refetch,
  } = useLessonPlans(academicYearNum, selectedSubject, selectedClass);
  
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  
  // Edit topic dialog state
  const [isEditTopicOpen, setIsEditTopicOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string>("");
  const [editTopicTitle, setEditTopicTitle] = useState("");
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [expandedWeekByTopic, setExpandedWeekByTopic] = useState<Record<string, string>>({});
  const [creatingLessonWeekId, setCreatingLessonWeekId] = useState<string | null>(null);
  const [weekSubtopicsByWeekId, setWeekSubtopicsByWeekId] = useState<
    Record<string, WeekSubtopic[]>
  >({});
  const [newWeekSubtopicByWeekId, setNewWeekSubtopicByWeekId] = useState<
    Record<string, string>
  >({});

  const handleLessonPlanClick = (lp: LessonPlan) => {
    navigate(`/teacher/lesson-plans/${lp.id}`);
  };

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) return;
    
    // Save to Supabase
    const result = await addTopic(newTopicTitle.trim());
    
    setNewTopicTitle("");
    setIsAddTopicOpen(false);

    if (result) {
      setExpandedTopicId(result.topicId);
      setExpandedWeekByTopic((prev) => ({ ...prev, [result.topicId]: result.weekId }));
    }
  };

  const handleOpenEditTopic = (topic: { id: string; title: string; subtopics?: string[] }) => {
    setEditingTopicId(topic.id);
    setEditTopicTitle(topic.title);
    setIsEditTopicOpen(true);
  };

  const handleSaveTopicEdit = async () => {
    if (!editTopicTitle.trim()) return;
    await updateTopic(editingTopicId, editTopicTitle.trim(), []);
    
    setIsEditTopicOpen(false);
    setEditingTopicId("");
    setEditTopicTitle("");
  };

  useEffect(() => {
    if (!curriculum) return;
    setExpandedWeekByTopic((prev) => {
      const next = { ...prev };
      curriculum.topics.forEach((topic) => {
        if (!next[topic.id] && topic.weeks[0]) {
          next[topic.id] = topic.weeks[0].id;
        }
      });
      return next;
    });
  }, [curriculum]);

  useEffect(() => {
    if (!curriculum) return;
    const weekIds = curriculum.topics.flatMap((topic) => topic.weeks.map((week) => week.id));
    if (weekIds.length === 0) {
      setWeekSubtopicsByWeekId({});
      return;
    }

    const fetchWeekSubtopics = async () => {
      const { data, error } = await supabase
        .from("lesson_week_subtopics")
        .select("id, week_id, name, sort_order")
        .in("week_id", weekIds)
        .order("sort_order", { ascending: true });

      if (error) {
        logSupabaseError("lessonWeekSubtopics/select", error);
        return;
      }

      const next: Record<string, WeekSubtopic[]> = {};
      data?.forEach((row) => {
        if (!next[row.week_id]) {
          next[row.week_id] = [];
        }
        next[row.week_id].push({
          id: row.id,
          name: row.name,
          sort_order: row.sort_order ?? 0,
        });
      });
      setWeekSubtopicsByWeekId(next);
    };

    fetchWeekSubtopics();
  }, [curriculum]);

  const handleCreateLessonDetail = async (week: Week) => {
    setCreatingLessonWeekId(week.id);
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("lesson_plan_details")
        .select("lesson_number")
        .eq("week_id", week.id);

      if (fetchError) {
        logSupabaseError("lessonPlanDetails/select", fetchError);
        throw fetchError;
      }

      const maxNum = Math.max(
        0,
        ...(existing?.map((item) => item.lesson_number ?? 0) ?? [0])
      );
      const nextLessonNumber = maxNum + 1;

      const { error } = await supabase
        .from("lesson_plan_details")
        .insert({
          week_id: week.id,
          lesson_number: nextLessonNumber,
          title: `Lesson ${nextLessonNumber}`,
          date: null,
          lesson_flow: createDefaultLessonFlow(),
          approval: null,
        });

      if (error) {
        logSupabaseError("lessonPlanDetails/insert", error);
        throw error;
      }

      await refetch();
    } catch (err) {
      toast({
        title: "Unable to create lesson",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setCreatingLessonWeekId(null);
    }
  };

  const handleAddWeek = async (topicId: string) => {
    const topic = curriculum?.topics.find((t) => t.id === topicId);
    if (!topic) return;
    const weekNumbers = topic.weeks.map((w) => w.weekNumber);
    const nextWeekNumber = weekNumbers.length > 0 ? Math.max(...weekNumbers) + 1 : 1;
    const weekId = await addWeek(topicId, nextWeekNumber, `Week ${nextWeekNumber}`);
    if (weekId) {
      setExpandedWeekByTopic((prev) => ({ ...prev, [topicId]: weekId }));
    }
  };

  const handleDeleteWeek = async (topicId: string, weekId: string) => {
    const topic = curriculum?.topics.find((t) => t.id === topicId);
    if (!topic) return;
    if (topic.weeks.length <= 1) {
      toast({
        title: "Cannot delete the last week",
        description: "Add another week before deleting this one.",
        variant: "destructive",
      });
      return;
    }

    const week = topic.weeks.find((w) => w.id === weekId);
    const confirmDelete = window.confirm(
      `Delete Week ${week?.weekNumber ?? ""}? This will delete all lessons under this week.`
    );
    if (!confirmDelete) return;

    try {
      const { error: detailsError } = await supabase
        .from("lesson_plan_details")
        .delete()
        .eq("week_id", weekId);
      if (detailsError) {
        logSupabaseError("lessonPlanDetails/delete", detailsError);
        throw detailsError;
      }

      const { error: weekError } = await supabase
        .from("lesson_weeks")
        .delete()
        .eq("id", weekId);
      if (weekError) {
        logSupabaseError("lessonWeeks/delete", weekError);
        throw weekError;
      }

      const orderedWeeks = [...topic.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
      const currentIndex = orderedWeeks.findIndex((w) => w.id === weekId);
      const fallback =
        orderedWeeks[currentIndex - 1] || orderedWeeks[currentIndex + 1] || orderedWeeks[0];
      if (fallback) {
        setExpandedWeekByTopic((prev) => ({ ...prev, [topicId]: fallback.id }));
      }

      await refetch();
    } catch (err) {
      toast({
        title: "Unable to delete week",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string, lessonNumber: number) => {
    const confirmDelete = window.confirm(
      `Delete Lesson ${lessonNumber}? This cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("lesson_plan_details")
        .delete()
        .eq("id", lessonId);
      if (error) {
        logSupabaseError("lessonPlanDetails/delete", error);
        throw error;
      }
      await refetch();
    } catch (err) {
      toast({
        title: "Unable to delete lesson",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const handleAddWeekSubtopic = async (weekId: string) => {
    const pending = (newWeekSubtopicByWeekId[weekId] || "").trim();
    if (!pending) return;
    const current = weekSubtopicsByWeekId[weekId] || [];
    const maxSort = Math.max(0, ...current.map((item) => item.sort_order ?? 0));
    const { data, error } = await supabase
      .from("lesson_week_subtopics")
      .insert({
        week_id: weekId,
        name: pending,
        sort_order: maxSort + 1,
      })
      .select("id, name, sort_order")
      .single();

    if (error) {
      logSupabaseError("lessonWeekSubtopics/insert", error);
      toast({
        title: "Unable to add subtopic",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setWeekSubtopicsByWeekId((prev) => ({
      ...prev,
      [weekId]: [...(prev[weekId] || []), data],
    }));
    setNewWeekSubtopicByWeekId((prev) => ({ ...prev, [weekId]: "" }));
  };

  const handleDeleteWeekSubtopic = async (weekId: string, subtopicId: string) => {
    const { error } = await supabase
      .from("lesson_week_subtopics")
      .delete()
      .eq("id", subtopicId);
    if (error) {
      logSupabaseError("lessonWeekSubtopics/delete", error);
      toast({
        title: "Unable to delete subtopic",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setWeekSubtopicsByWeekId((prev) => ({
      ...prev,
      [weekId]: (prev[weekId] || []).filter((item) => item.id !== subtopicId),
    }));
  };

  return (
    <TeacherAppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Lesson Plans</h1>
          </div>
        }
      />
      <div className="flex flex-col h-full min-h-0 overflow-x-hidden">
        {/* Header with Year and Subject Selector */}
          <div className="px-4 py-3 border-b border-border bg-card/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Year Selector */}
                <Select 
                  value={selectedYear} 
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Subject Selector - from Supabase */}
                <Select 
                  value={selectedSubject} 
                  onValueChange={handleSubjectChange}
                  disabled={subjectsLoading}
                >
                  <SelectTrigger className="w-[120px] sm:w-[150px]">
                    {subjectsLoading ? (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs">Loading...</span>
                      </div>
              ) : (
                      <SelectValue placeholder="Subject" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {dbSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Class Selector - from Supabase (same as Academic) */}
                <Select 
                  value={selectedClass} 
                  onValueChange={handleClassChange}
                  disabled={loadingClasses}
                >
                  <SelectTrigger className="w-20">
                    {loadingClasses ? (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </div>
              ) : (
                      <SelectValue placeholder="Class" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {dbClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {stripCampusPrefix(cls)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setIsAddTopicOpen(true)}
                className="gap-2 self-start sm:self-auto"
              >
                <Plus className="h-5 w-5" />
                New Topic
              </Button>
            </div>
          </div>

          {/* Topics and Weeks List */}
          <ScrollArea className="flex-1 min-h-0 overflow-hidden">
            <div className="px-4 py-4 space-y-4 w-full max-w-full min-w-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading lesson plans...</p>
                  </div>
                </div>
              ) : !curriculum?.topics.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Topics Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by creating your first topic for {selectedSubject}
                  </p>
                  <Button onClick={() => setIsAddTopicOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Topic
                  </Button>
                </div>
              ) : (
                curriculum?.topics.map((topic, topicIndex) => {
                  const isExpanded = expandedTopicId === topic.id;

                  return (
                    <Card key={topic.id} className="overflow-hidden w-full">
                      <CardHeader className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              setExpandedTopicId(isExpanded ? null : topic.id)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setExpandedTopicId(isExpanded ? null : topic.id);
                              }
                            }}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <BookOpen className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <CardTitle className="text-sm font-semibold truncate">
                                  Topic {topicIndex + 1}: {topic.title}
                                </CardTitle>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleOpenEditTopic(topic)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                setExpandedTopicId(isExpanded ? null : topic.id)
                              }
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent className="px-4 pb-4 pt-0 space-y-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 px-3"
                              onClick={() => handleAddWeek(topic.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Week
                            </Button>
                          </div>

                          {topic.weeks.map((week) => {
                            const isWeekExpanded = expandedWeekByTopic[topic.id] === week.id;
                            const weekLessons = [...week.lessonPlans].sort(
                              (a, b) => a.lessonNumber - b.lessonNumber
                            );
                            const completedCount = weekLessons.filter((lesson) => {
                              const status = getLessonStatus({
                                approval: lesson.approval as unknown as Record<string, unknown> | null,
                                reflection: lesson.reflection as unknown as Record<string, unknown> | null,
                                learningObjectives: lesson.learningObjectives,
                                resources: lesson.resources,
                                homework: lesson.homework,
                                lessonFlow: lesson.lessonFlow,
                              });
                              return status === "complete";
                            }).length;
                            const totalCount = weekLessons.length;
                            const weekSubtopics = weekSubtopicsByWeekId[week.id] || [];

                            return (
                              <div key={week.id} className="border border-border rounded-lg">
                                <div
                                  role="button"
                                  tabIndex={0}
                                  className="w-full flex items-center justify-between px-3 py-3 text-left"
                                  onClick={() =>
                                    setExpandedWeekByTopic((prev) => ({
                                      ...prev,
                                      [topic.id]: isWeekExpanded ? "" : week.id,
                                    }))
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      setExpandedWeekByTopic((prev) => ({
                                        ...prev,
                                        [topic.id]: isWeekExpanded ? "" : week.id,
                                      }));
                                    }
                                  }}
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold">
                                      Week {week.weekNumber}
                                    </p>
                                    {week.title && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {week.title}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {completedCount}/{totalCount}
                                    </Badge>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleDeleteWeek(topic.id, week.id);
                                      }}
                                      aria-label={`Delete Week ${week.weekNumber}`}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    {isWeekExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>

                                {isWeekExpanded && (
                                  <div className="px-3 pb-3 space-y-3">
                                    <div className="flex flex-wrap gap-2 items-center">
                                      {weekSubtopics.map((subtopic) => (
                                        <Badge
                                          key={subtopic.id}
                                          variant="secondary"
                                          className="flex items-center gap-1 pr-1"
                                        >
                                          <span className="text-xs">{subtopic.name}</span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleDeleteWeekSubtopic(week.id, subtopic.id)
                                            }
                                            className="h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center"
                                            aria-label="Remove subtopic"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                      <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <Input
                                          value={newWeekSubtopicByWeekId[week.id] || ""}
                                          onChange={(event) =>
                                            setNewWeekSubtopicByWeekId((prev) => ({
                                              ...prev,
                                              [week.id]: event.target.value,
                                            }))
                                          }
                                          placeholder="Add subtopic"
                                          className="h-9"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleAddWeekSubtopic(week.id)}
                                          disabled={
                                            !(newWeekSubtopicByWeekId[week.id] || "").trim()
                                          }
                                          className="h-9 w-9 p-0"
                                          aria-label="Add subtopic"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      {weekLessons.length === 0 ? (
                                        <button
                                          type="button"
                                          className="w-full flex items-center justify-between rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                          onClick={() => handleCreateLessonDetail(week)}
                                          disabled={creatingLessonWeekId === week.id}
                                        >
                                          <span className="flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            {creatingLessonWeekId === week.id
                                              ? "Creating..."
                                              : "Tap to create"}
                                          </span>
                                          <ChevronRight className="h-4 w-4" />
                                        </button>
                                      ) : (
                                        weekLessons.map((lesson) => {
                                          const status = getLessonStatus({
                                            approval: lesson.approval as unknown as Record<string, unknown> | null,
                                            reflection: lesson.reflection as unknown as Record<string, unknown> | null,
                                            learningObjectives: lesson.learningObjectives,
                                            resources: lesson.resources,
                                            homework: lesson.homework,
                                            lessonFlow: lesson.lessonFlow,
                                          });
                                          return (
                                            <div
                                              key={lesson.id}
                                              role="button"
                                              tabIndex={0}
                                              className="w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                                              onClick={() => handleLessonPlanClick(lesson)}
                                              onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                  event.preventDefault();
                                                  handleLessonPlanClick(lesson);
                                                }
                                              }}
                                            >
                                              <div className="flex items-center gap-3 min-w-0">
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs w-9 justify-center"
                                                >
                                                  L{lesson.lessonNumber}
                                                </Badge>
                                                <div className="min-w-0">
                                                  <p className="text-sm font-medium truncate">
                                                    {lesson.title || "Untitled lesson"}
                                                  </p>
                                                  <Badge
                                                    variant="secondary"
                                                    className="text-[10px] mt-1"
                                                  >
                                                    {formatStatusLabel(status)}
                                                  </Badge>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-8 w-8 p-0"
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleDeleteLesson(
                                                      lesson.id,
                                                      lesson.lessonNumber
                                                    );
                                                  }}
                                                  aria-label={`Delete Lesson ${lesson.lessonNumber}`}
                                                >
                                                  <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                    {weekLessons.length > 0 && (
                                      <Button
                                        variant="outline"
                                        className="w-full h-9"
                                        onClick={() => handleCreateLessonDetail(week)}
                                        disabled={creatingLessonWeekId === week.id}
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {creatingLessonWeekId === week.id
                                          ? "Creating..."
                                          : "Add Lesson"}
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              )}
            {/* Empty state is now handled in the conditional above */}
          </div>
        </ScrollArea>
      </div>

      {/* Add Topic Dialog */}
      <Dialog open={isAddTopicOpen} onOpenChange={setIsAddTopicOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
            <DialogDescription>
              Create a new topic for {selectedSubject}. Topics are automatically numbered.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topic-title">Topic Title</Label>
              <Input
                id="topic-title"
                placeholder="e.g., Linear Equations"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This will be added as Topic {(curriculum?.topics.length || 0) + 1}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTopicOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTopic} disabled={!newTopicTitle.trim()}>
              Add Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Topic Dialog */}
      <Dialog open={isEditTopicOpen} onOpenChange={setIsEditTopicOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>
              Edit the topic name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-topic-title">Topic Name</Label>
              <Input
                id="edit-topic-title"
                value={editTopicTitle}
                onChange={(e) => setEditTopicTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTopicOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTopicEdit} disabled={!editTopicTitle.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherAppLayout>
  );
};

export default TeacherLessonPlansPage;



