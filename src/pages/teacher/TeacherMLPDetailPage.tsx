import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  BookOpen,
  MessageSquare,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMLPContent, useLessonReflections, useHomeworkManagement } from "@/hooks/useTeacherLessonPlans";
import { ReadOnlyLessonContent } from "@/components/lessonplan/ReadOnlyLessonContent";
import { TeacherLessonReflectionForm } from "@/components/lessonplan/TeacherLessonReflectionForm";
import { TeacherHomeworkForm } from "@/components/lessonplan/TeacherHomeworkForm";

const TeacherMLPDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("content");
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(undefined);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [loadingWeeks, setLoadingWeeks] = useState<Set<string>>(new Set());
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const autoNavigateAttempted = useRef(false);

  const {
    topics,
    weeks,
    assignedClasses,
    planInfo,
    loading,
    error,
    loadLessonsForWeek,
    getWeeksForTopic,
    getLessonsForWeek,
    isLessonsLoaded,
  } = useMLPContent(id);

  const {
    reflections,
    loading: reflectionsLoading,
    saving,
    saveReflection,
    getReflection,
    hasReflection,
  } = useLessonReflections(id, selectedClassId);

  const {
    saving: savingHomework,
    saveHomework,
    getHomework,
  } = useHomeworkManagement();

  // Set default class when loaded
  useState(() => {
    if (assignedClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(assignedClasses[0].classYearId);
    }
  });

  // Auto-navigate to today's lesson
  useEffect(() => {
    if (autoNavigateAttempted.current || loading || topics.length === 0 || weeks.length === 0) {
      return;
    }

    const today = format(new Date(), "yyyy-MM-dd");
    
    const findTodayLesson = async () => {
      autoNavigateAttempted.current = true;
      
      for (const topic of topics) {
        const topicWeeks = getWeeksForTopic(topic.id);
        
        for (const week of topicWeeks) {
          // Load lessons if not loaded
          if (!isLessonsLoaded(week.id)) {
            setLoadingWeeks((prev) => new Set(prev).add(week.id));
            await loadLessonsForWeek(week.id);
            setLoadingWeeks((prev) => {
              const next = new Set(prev);
              next.delete(week.id);
              return next;
            });
          }
          
          const lessons = getLessonsForWeek(week.id);
          const todayLesson = lessons.find((l) => l.date === today);
          
          if (todayLesson) {
            setExpandedTopics(new Set([topic.id]));
            setExpandedWeeks(new Set([week.id]));
            setSelectedLessonId(todayLesson.id);
            return;
          }
        }
      }
    };

    findTodayLesson();
  }, [topics, weeks, loading, getWeeksForTopic, isLessonsLoaded, loadLessonsForWeek, getLessonsForWeek]);

  const handleTopicToggle = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const handleWeekToggle = async (weekId: string) => {
    if (!isLessonsLoaded(weekId)) {
      setLoadingWeeks((prev) => new Set(prev).add(weekId));
      await loadLessonsForWeek(weekId);
      setLoadingWeeks((prev) => {
        const next = new Set(prev);
        next.delete(weekId);
        return next;
      });
    }

    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) {
        next.delete(weekId);
      } else {
        next.add(weekId);
      }
      return next;
    });
  };

  const handleSaveReflection = useCallback(
    async (lessonPlanDetailId: string, data: Parameters<typeof saveReflection>[1]) => {
      return await saveReflection(lessonPlanDetailId, data);
    },
    [saveReflection]
  );

  const handleSaveHomework = useCallback(
    async (lessonPlanDetailId: string, homework: string) => {
      return await saveHomework(lessonPlanDetailId, homework);
    },
    [saveHomework]
  );

  if (loading) {
    return (
      <TeacherAppLayout>
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </TeacherAppLayout>
    );
  }

  if (error || !planInfo) {
    return (
      <TeacherAppLayout>
        <div className="p-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/lesson-plans")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-12">
            <p className="text-destructive">{error || "Lesson plan not found"}</p>
          </div>
        </div>
      </TeacherAppLayout>
    );
  }

  // Topic/Week/Lesson structure component - reusable across tabs
  const renderLessonStructure = (
    renderLessonContent: (lesson: ReturnType<typeof getLessonsForWeek>[0]) => React.ReactNode,
    emptyIcon: React.ReactNode,
    emptyMessage: string,
    cardThemeClass: string = ""
  ) => (
    <div className="p-4 space-y-3 pb-24">
      {topics.length === 0 ? (
        <div className="text-center py-12">
          {emptyIcon}
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        topics.map((topic) => (
          <Collapsible
            key={topic.id}
            open={expandedTopics.has(topic.id)}
            onOpenChange={() => handleTopicToggle(topic.id)}
          >
            <Card className={cardThemeClass}>
              <CollapsibleTrigger asChild>
                <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {expandedTopics.has(topic.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <CardTitle className="text-sm font-medium">{topic.title}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getWeeksForTopic(topic.id).length} weeks
                    </Badge>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-4 pb-4 pt-0 space-y-2">
                  {getWeeksForTopic(topic.id).map((week) => (
                    <Collapsible
                      key={week.id}
                      open={expandedWeeks.has(week.id)}
                      onOpenChange={() => handleWeekToggle(week.id)}
                    >
                      <Card className="bg-muted/30">
                        <CollapsibleTrigger asChild>
                          <CardHeader className="py-2 px-3 cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {loadingWeeks.has(week.id) ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                ) : expandedWeeks.has(week.id) ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <span className="text-xs font-medium">
                                  Week {week.weekNumber}: {week.title}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="px-3 pb-3 pt-0 space-y-2">
                            {!isLessonsLoaded(week.id) ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : getLessonsForWeek(week.id).length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                No lessons in this week
                              </p>
                            ) : (
                              getLessonsForWeek(week.id).map((lesson) => renderLessonContent(lesson))
                            )}
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))
      )}
    </div>
  );

  return (
    <TeacherAppLayout>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/teacher/lesson-plans")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">{planInfo.subject}</h1>
            <p className="text-xs text-muted-foreground">
              {planInfo.yearLevel} • {planInfo.academicYear}
            </p>
          </div>
          {/* Global Class Selector */}
          <Select
            value={selectedClassId?.toString() || ""}
            onValueChange={(val) => setSelectedClassId(val ? parseInt(val) : undefined)}
          >
            <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              {assignedClasses.map((cls) => (
                <SelectItem key={cls.classYearId} value={cls.classYearId.toString()}>
                  {cls.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs with color themes - below header, aligned with content */}
      <div className="px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl h-10 bg-muted/50 p-1">
            <TabsTrigger 
              value="content" 
              className={cn(
                "gap-2 text-xs rounded-lg",
                "data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Content
            </TabsTrigger>
            <TabsTrigger 
              value="reflections" 
              className={cn(
                "gap-2 text-xs rounded-lg",
                "data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/50 dark:data-[state=active]:text-amber-300 data-[state=active]:shadow-none"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Reflections
            </TabsTrigger>
            <TabsTrigger 
              value="homework" 
              className={cn(
                "gap-2 text-xs rounded-lg",
                "data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700 dark:data-[state=active]:bg-sky-900/50 dark:data-[state=active]:text-sky-300 data-[state=active]:shadow-none"
              )}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Homework
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Tab - Green Theme */}
      {activeTab === "content" && (
        <div className="p-4 space-y-3 pb-24">
          {topics.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-primary/50 mb-3" />
              <p className="text-muted-foreground">No topics found</p>
            </div>
          ) : (
            topics.map((topic) => (
              <Collapsible
                key={topic.id}
                open={expandedTopics.has(topic.id)}
                onOpenChange={() => handleTopicToggle(topic.id)}
              >
                <Card className="border-primary/30 overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="py-3 px-4 cursor-pointer hover:bg-primary/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {expandedTopics.has(topic.id) ? (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-primary" />
                          )}
                          <CardTitle className="text-sm font-medium">{topic.title}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                          {getWeeksForTopic(topic.id).length} weeks
                        </Badge>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="px-4 pb-4 pt-0 space-y-2">
                      {getWeeksForTopic(topic.id).map((week) => (
                        <Collapsible
                          key={week.id}
                          open={expandedWeeks.has(week.id)}
                          onOpenChange={() => handleWeekToggle(week.id)}
                        >
                          <Card className="bg-primary/5 border-primary/30 overflow-hidden">
                            <CollapsibleTrigger asChild>
                              <CardHeader className="py-2 px-3 cursor-pointer hover:bg-primary/10">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {loadingWeeks.has(week.id) ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                    ) : expandedWeeks.has(week.id) ? (
                                      <ChevronDown className="h-3.5 w-3.5 text-primary" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 text-primary" />
                                    )}
                                    <span className="text-xs font-medium">
                                      Week {week.weekNumber}: {week.title}
                                    </span>
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="px-3 pb-3 pt-0 space-y-2">
                                {!isLessonsLoaded(week.id) ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  </div>
                                ) : getLessonsForWeek(week.id).length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-2">
                                    No lessons in this week
                                  </p>
                                ) : (
                                  getLessonsForWeek(week.id).map((lesson) => (
                                    <Card
                                      key={lesson.id}
                                      className={cn(
                                        "cursor-pointer transition-colors overflow-hidden",
                                        selectedLessonId === lesson.id
                                          ? "border-primary bg-primary/5"
                                          : "hover:bg-primary/10"
                                      )}
                                      onClick={() =>
                                        setSelectedLessonId(selectedLessonId === lesson.id ? null : lesson.id)
                                      }
                                    >
                                      <CardHeader className="py-2 px-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium">
                                            L{lesson.lessonNumber}: {lesson.title || "Untitled"}
                                          </span>
                                          {selectedLessonId === lesson.id ? (
                                            <ChevronDown className="h-3 w-3 text-primary" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3 text-primary" />
                                          )}
                                        </div>
                                      </CardHeader>
                                      {selectedLessonId === lesson.id && (
                                        <CardContent
                                          className="px-3 pb-3 pt-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <ReadOnlyLessonContent lesson={lesson} />
                                        </CardContent>
                                      )}
                                    </Card>
                                  ))
                                )}
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>
      )}

      {/* Reflections Tab */}
      {activeTab === "reflections" && (
        <div className="space-y-0">
          {!selectedClassId ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="h-12 w-12 mx-auto text-amber-400/50 mb-3" />
              <p className="text-muted-foreground">Select a class from the header to view reflections</p>
            </div>
          ) : reflectionsLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="p-4 space-y-3 pb-24">
              {topics.map((topic) => (
                <Collapsible
                  key={topic.id}
                  open={expandedTopics.has(topic.id)}
                  onOpenChange={() => handleTopicToggle(topic.id)}
                >
                  <Card className="border-amber-200/50 dark:border-amber-800/50">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-3 px-4 cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {expandedTopics.has(topic.id) ? (
                              <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            )}
                            <CardTitle className="text-sm font-medium">{topic.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="px-4 pb-4 pt-0 space-y-3">
                        {getWeeksForTopic(topic.id).map((week) => (
                          <Collapsible
                            key={week.id}
                            open={expandedWeeks.has(week.id)}
                            onOpenChange={() => handleWeekToggle(week.id)}
                          >
                            <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-card">
                              <CollapsibleTrigger asChild>
                                <div className="py-2 px-3 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {loadingWeeks.has(week.id) ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                                    ) : expandedWeeks.has(week.id) ? (
                                      <ChevronDown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    )}
                                    <span className="text-xs font-medium">
                                      Week {week.weekNumber}: {week.title}
                                    </span>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="px-3 pb-3 space-y-2">
                                  {!isLessonsLoaded(week.id) ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
                                    </div>
                                  ) : getLessonsForWeek(week.id).length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                      No lessons in this week
                                    </p>
                                  ) : (
                                    getLessonsForWeek(week.id).map((lesson) => (
                                      <TeacherLessonReflectionForm
                                        key={lesson.id}
                                        lesson={lesson}
                                        reflection={getReflection(lesson.id)}
                                        onSave={(data) => handleSaveReflection(lesson.id, data)}
                                        saving={saving}
                                        disabled={!selectedClassId}
                                      />
                                    ))
                                  )}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Homework Tab */}
      {activeTab === "homework" && (
        <div className="p-4 space-y-3 pb-24">
          {topics.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-sky-400/50 mb-3" />
              <p className="text-muted-foreground">No topics found</p>
            </div>
          ) : (
            topics.map((topic) => (
              <Collapsible
                key={topic.id}
                open={expandedTopics.has(topic.id)}
                onOpenChange={() => handleTopicToggle(topic.id)}
              >
                <Card className="border-sky-200/50 dark:border-sky-800/50">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="py-3 px-4 cursor-pointer hover:bg-sky-50/50 dark:hover:bg-sky-950/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {expandedTopics.has(topic.id) ? (
                            <ChevronDown className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          )}
                          <CardTitle className="text-sm font-medium">{topic.title}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                          {getWeeksForTopic(topic.id).length} weeks
                        </Badge>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="px-4 pb-4 pt-0 space-y-2">
                      {getWeeksForTopic(topic.id).map((week) => (
                        <Collapsible
                          key={week.id}
                          open={expandedWeeks.has(week.id)}
                          onOpenChange={() => handleWeekToggle(week.id)}
                        >
                          <Card className="bg-sky-50/30 dark:bg-sky-950/20 border-sky-200/50 dark:border-sky-800/50">
                            <CollapsibleTrigger asChild>
                              <CardHeader className="py-2 px-3 cursor-pointer hover:bg-sky-100/50 dark:hover:bg-sky-900/30">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {loadingWeeks.has(week.id) ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600 dark:text-sky-400" />
                                    ) : expandedWeeks.has(week.id) ? (
                                      <ChevronDown className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                                    )}
                                    <span className="text-xs font-medium">
                                      Week {week.weekNumber}: {week.title}
                                    </span>
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="px-3 pb-3 pt-0 space-y-2">
                                {!isLessonsLoaded(week.id) ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-sky-600 dark:text-sky-400" />
                                  </div>
                                ) : getLessonsForWeek(week.id).length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-2">
                                    No lessons in this week
                                  </p>
                                ) : (
                                  getLessonsForWeek(week.id).map((lesson) => (
                                    <TeacherHomeworkForm
                                      key={lesson.id}
                                      lesson={lesson}
                                      onSave={(homework) => handleSaveHomework(lesson.id, homework)}
                                      saving={savingHomework}
                                    />
                                  ))
                                )}
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>
      )}
    </TeacherAppLayout>
  );
};

export default TeacherMLPDetailPage;
