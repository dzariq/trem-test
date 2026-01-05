import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Plus, 
  ChevronRight, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { 
  mockLessonPlans, 
  getAvailableSubjects, 
  getLessonPlanStatus,
  type LessonPlan,
  type SubjectCurriculum 
} from "@/data/lessonPlanData";

const TeacherLessonPlansPage = () => {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string>(mockLessonPlans[0]?.subject || "");
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [isAddSubtopicOpen, setIsAddSubtopicOpen] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState<string>("");
  const [newSubtopicTitle, setNewSubtopicTitle] = useState("");
  
  const subjects = getAvailableSubjects();
  const curriculum = mockLessonPlans.find(s => s.subject === selectedSubject);

  const getStatusIcon = (status: "complete" | "incomplete" | "draft" | "empty") => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
      case "incomplete":
        return <AlertCircle className="h-3 w-3 text-amber-500" />;
      case "draft":
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: "complete" | "incomplete" | "draft" | "empty") => {
    switch (status) {
      case "complete":
        return "default";
      case "incomplete":
        return "secondary";
      case "draft":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleLessonPlanClick = (lp: LessonPlan) => {
    navigate(`/teacher/lesson-plans/${lp.id}`);
  };

  const handleAddTopic = () => {
    if (!newTopicTitle.trim()) return;
    
    // In a real app, this would save to the database
    toast({
      title: "Topic Created",
      description: `Topic "${newTopicTitle}" has been added to ${selectedSubject}.`,
    });
    
    setNewTopicTitle("");
    setIsAddTopicOpen(false);
  };

  const handleOpenAddSubtopic = (topicId: string) => {
    setCurrentTopicId(topicId);
    setIsAddSubtopicOpen(true);
  };

  const handleAddSubtopic = () => {
    if (!newSubtopicTitle.trim()) return;
    
    const topic = curriculum?.topics.find(t => t.id === currentTopicId);
    // In a real app, this would save to the database
    toast({
      title: "Subtopic Added",
      description: `"${newSubtopicTitle}" has been added to ${topic?.title || "topic"}.`,
    });
    
    setNewSubtopicTitle("");
    setIsAddSubtopicOpen(false);
    setCurrentTopicId("");
  };

  const handleCreateNew = () => {
    navigate("/teacher/lesson-plans/new");
  };

  const renderLessonPlanItem = (lp: LessonPlan | undefined, lessonNumber: number, weekId: string) => {
    if (!lp) {
      return (
        <button
          onClick={() => navigate(`/teacher/lesson-plans/new?week=${weekId}&lesson=${lessonNumber}`)}
          className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:bg-muted/50 transition-colors w-full"
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Plus className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-muted-foreground">Lesson {lessonNumber}</p>
            <p className="text-xs text-muted-foreground">Tap to create</p>
          </div>
        </button>
      );
    }

    const status = getLessonPlanStatus(lp);
    
    return (
      <button
        onClick={() => handleLessonPlanClick(lp)}
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg border transition-colors w-full text-left overflow-hidden",
          status === "complete" && "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50",
          status === "incomplete" && "border-amber-200 bg-amber-50/50 hover:bg-amber-50",
          status === "draft" && "border-border bg-muted/30 hover:bg-muted/50"
        )}
      >
        <div className={cn(
          "h-8 w-8 min-w-[2rem] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
          status === "complete" && "bg-emerald-500 text-white",
          status === "incomplete" && "bg-amber-500 text-white",
          status === "draft" && "bg-muted text-muted-foreground"
        )}>
          {lessonNumber}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-medium truncate">{lp.title}</p>
          <p className="text-xs text-muted-foreground truncate">{lp.topic}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </button>
    );
  };

  return (
    <TeacherAppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with Subject Selector */}
        <div className="px-4 py-3 border-b border-border bg-card/50">
          <div className="flex items-center justify-between gap-3">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button size="sm" onClick={() => setIsAddTopicOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Topic</span>
            </Button>
          </div>
        </div>

        {/* Topics and Weeks List */}
        <ScrollArea className="flex-1 overflow-x-hidden">
          <div className="p-4 space-y-4 overflow-hidden">
            {curriculum?.topics.map((topic, topicIndex) => (
              <Card key={topic.id} className="overflow-hidden w-full">
                <CardHeader className="py-3 px-4 bg-muted/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm font-semibold">
                        Topic {topicIndex + 1}: {topic.title}
                      </CardTitle>
                    </div>
                  </div>
                  
                  {/* Subtopics Section */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Subtopics:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleOpenAddSubtopic(topic.id)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {topic.subtopics && topic.subtopics.length > 0 ? (
                        topic.subtopics.map((subtopic, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs font-normal">
                            {subtopic}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No subtopics added</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                  <Accordion type="multiple" className="w-full overflow-hidden">
                    {topic.weeks.map((week) => {
                      const lpCount = week.lessonPlans.length;
                      const completedCount = week.lessonPlans.filter(
                        lp => getLessonPlanStatus(lp) === "complete"
                      ).length;
                      
                      return (
                        <AccordionItem 
                          key={week.id} 
                          value={week.id}
                          className="border-b last:border-b-0 overflow-hidden"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/20 [&>svg]:flex-shrink-0">
                            <div className="flex items-center justify-between w-full pr-2 min-w-0">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Badge variant="outline" className="text-xs font-normal flex-shrink-0">
                                  Week {week.weekNumber}
                                </Badge>
                                <span className="text-sm font-medium truncate">{week.title}</span>
                              </div>
                              <Badge 
                                variant="secondary" 
                                className="text-xs ml-2 flex-shrink-0"
                              >
                                {completedCount}/{lpCount > 0 ? lpCount : 5}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-3">
                            <div className="space-y-2 pt-2">
                              {[1, 2, 3, 4, 5].map((lessonNum) => {
                                const lp = week.lessonPlans.find(p => p.lessonNumber === lessonNum);
                                return (
                                  <div key={lessonNum}>
                                    {renderLessonPlanItem(lp, lessonNum, week.id)}
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Week Summary */}
                            {week.lessonPlans.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                    <span>{week.lessonPlans.filter(lp => getLessonPlanStatus(lp) === "complete").length} Complete</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                    <span>{week.lessonPlans.filter(lp => getLessonPlanStatus(lp) === "incomplete").length} Incomplete</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span>{week.lessonPlans.filter(lp => getLessonPlanStatus(lp) === "draft").length} Draft</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            ))}

            {(!curriculum || curriculum.topics.length === 0) && (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No lesson plans found for this subject.</p>
                <Button className="mt-4" onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Lesson Plan
                </Button>
              </Card>
            )}
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

      {/* Add Subtopic Dialog */}
      <Dialog open={isAddSubtopicOpen} onOpenChange={setIsAddSubtopicOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Subtopic</DialogTitle>
            <DialogDescription>
              Add a new subtopic to "{curriculum?.topics.find(t => t.id === currentTopicId)?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subtopic-title">Subtopic Title</Label>
              <Input
                id="subtopic-title"
                placeholder="e.g., Solving Quadratic Equations"
                value={newSubtopicTitle}
                onChange={(e) => setNewSubtopicTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSubtopicOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubtopic} disabled={!newSubtopicTitle.trim()}>
              Add Subtopic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherAppLayout>
  );
};

export default TeacherLessonPlansPage;
