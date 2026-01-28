import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  ChevronDown,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMLPContent, useLessonReflections } from "@/hooks/useTeacherLessonPlans";
import { ReadOnlyLessonContent } from "@/components/lessonplan/ReadOnlyLessonContent";
import { TeacherLessonReflectionForm } from "@/components/lessonplan/TeacherLessonReflectionForm";

const TeacherMLPDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("content");
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(undefined);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [loadingWeeks, setLoadingWeeks] = useState<Set<string>>(new Set());
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const {
    topics,
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

  // Set default class when loaded
  useState(() => {
    if (assignedClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(assignedClasses[0].classYearId);
    }
  });

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
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none h-10 bg-muted/30">
            <TabsTrigger value="content" className="gap-2 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Content
            </TabsTrigger>
            <TabsTrigger value="reflections" className="gap-2 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              Reflections
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Tab */}
      {activeTab === "content" && (
        <div className="p-4 space-y-3 pb-24">
          {topics.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No topics found</p>
            </div>
          ) : (
            topics.map((topic) => (
              <Collapsible
                key={topic.id}
                open={expandedTopics.has(topic.id)}
                onOpenChange={() => handleTopicToggle(topic.id)}
              >
                <Card>
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
                                  getLessonsForWeek(week.id).map((lesson) => (
                                    <Card
                                      key={lesson.id}
                                      className={cn(
                                        "cursor-pointer transition-colors",
                                        selectedLessonId === lesson.id
                                          ? "border-primary bg-primary/5"
                                          : "hover:bg-muted/50"
                                      )}
                                      onClick={() =>
                                        setSelectedLessonId(
                                          selectedLessonId === lesson.id ? null : lesson.id
                                        )
                                      }
                                    >
                                      <CardHeader className="py-2 px-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium">
                                            L{lesson.lessonNumber}: {lesson.title || "Untitled"}
                                          </span>
                                          {selectedLessonId === lesson.id ? (
                                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
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
          {/* Class Selector */}
          <div className="sticky top-[88px] z-10 px-4 py-3 bg-background border-b border-border">
            <Select
              value={selectedClassId?.toString() || ""}
              onValueChange={(val) => setSelectedClassId(val ? parseInt(val) : undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a class" />
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

          {!selectedClassId ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Select a class to view reflections</p>
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
                  <Card>
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
                            <div className="rounded-lg border bg-muted/30">
                              <CollapsibleTrigger asChild>
                                <div className="py-2 px-3 cursor-pointer hover:bg-muted/50 flex items-center justify-between">
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
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="px-3 pb-3 space-y-2">
                                  {!isLessonsLoaded(week.id) ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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
    </TeacherAppLayout>
  );
};

export default TeacherMLPDetailPage;
