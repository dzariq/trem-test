import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Loader2, ClipboardList, ClipboardCheck, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeacherHomeworkForm } from "./TeacherHomeworkForm";
import { HomeworkTrackingView } from "./HomeworkTrackingView";
import type { LessonDetail, LessonTopic, LessonWeek } from "@/hooks/useTeacherLessonPlans";

interface HomeworkSubTabsProps {
  lessonPlanId: string;
  topics: LessonTopic[];
  classYearId: number | undefined;
  expandedTopics: Set<string>;
  expandedWeeks: Set<string>;
  loadingWeeks: Set<string>;
  onTopicToggle: (topicId: string) => void;
  onWeekToggle: (weekId: string) => void;
  getWeeksForTopic: (topicId: string) => LessonWeek[];
  getLessonsForWeek: (weekId: string) => LessonDetail[];
  isLessonsLoaded: (weekId: string) => boolean;
  onSaveHomework: (lessonId: string, homework: string) => Promise<boolean>;
  savingHomework: boolean;
}

export function HomeworkSubTabs({
  lessonPlanId,
  topics,
  classYearId,
  expandedTopics,
  expandedWeeks,
  loadingWeeks,
  onTopicToggle,
  onWeekToggle,
  getWeeksForTopic,
  getLessonsForWeek,
  isLessonsLoaded,
  onSaveHomework,
  savingHomework,
}: HomeworkSubTabsProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>("assign");

  return (
    <div className="space-y-3">
      {/* Sub-Tab Navigation */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-xl h-9 bg-sky-100/50 dark:bg-sky-900/30 p-1">
          <TabsTrigger 
            value="assign" 
            className={cn(
              "gap-1.5 text-xs rounded-xl",
              "data-[state=active]:bg-sky-200 data-[state=active]:text-sky-800 dark:data-[state=active]:bg-sky-800 dark:data-[state=active]:text-sky-100 data-[state=active]:shadow-none"
            )}
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Assign
          </TabsTrigger>
          <TabsTrigger 
            value="track" 
            className={cn(
              "gap-1.5 text-xs rounded-xl",
              "data-[state=active]:bg-sky-200 data-[state=active]:text-sky-800 dark:data-[state=active]:bg-sky-800 dark:data-[state=active]:text-sky-100 data-[state=active]:shadow-none"
            )}
          >
            <ListChecks className="h-3.5 w-3.5" />
            Track
          </TabsTrigger>
        </TabsList>

        {/* Assign Tab Content */}
        <TabsContent value="assign" className="mt-3 space-y-3">
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
                onOpenChange={() => onTopicToggle(topic.id)}
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
                          onOpenChange={() => onWeekToggle(week.id)}
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
                                      onSave={(homework) => onSaveHomework(lesson.id, homework)}
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
        </TabsContent>

        {/* Track Tab Content */}
        <TabsContent value="track" className="mt-3">
          <HomeworkTrackingView
            lessonPlanId={lessonPlanId}
            topics={topics}
            classYearId={classYearId}
            getWeeksForTopic={getWeeksForTopic}
            getLessonsForWeek={getLessonsForWeek}
            isLessonsLoaded={isLessonsLoaded}
            onWeekToggle={onWeekToggle}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
