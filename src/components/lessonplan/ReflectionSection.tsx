import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, MessageSquare, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonPlanReflection } from "@/data/lessonPlanData";

interface ReflectionSectionProps {
  reflection: LessonPlanReflection;
  onChange: (reflection: LessonPlanReflection) => void;
}

const successQuestions = [
  { 
    key: "objectivesAchieved", 
    label: "Were the learning objectives achieved?",
    placeholder: "Describe the extent to which objectives were met."
  },
  { 
    key: "topSuccesses", 
    label: "What were the top two most successful learning outcomes or moments of strong student engagement? Why did they work?",
    placeholder: "Describe the successful moments and why they worked."
  },
] as const;

const challengeQuestions = [
  { 
    key: "objectivesNotAchieved", 
    label: "What were the reasons if the learning objectives were not achieved?",
    placeholder: "Explain factors that prevented achievement of objectives."
  },
  { 
    key: "biggestObstacle", 
    label: "What was the biggest obstacle to student learning or engagement, and what do you believe was the root cause?",
    placeholder: "Identify the main challenge and its root cause."
  },
] as const;

const differentiationQuestions = [
  { 
    key: "noviceLearners", 
    label: "Novice learners",
    sublabel: "Describe a task or support specifically given to this group.",
    placeholder: "• Were they able to attempt the task?\n• Did they progress toward their learning objectives?"
  },
  { 
    key: "intermediateLearners", 
    label: "Intermediate learners",
    sublabel: "Describe the core task assigned to this group.",
    placeholder: "• Did they struggle or finish too quickly?\n• Did they progress toward their learning objectives?"
  },
  { 
    key: "advancedLearners", 
    label: "Advanced learners",
    sublabel: "Describe the extension or challenge activity provided.",
    placeholder: "• Any evidence they achieved further mastery in the topic?"
  },
] as const;

export function ReflectionSection({ reflection, onChange }: ReflectionSectionProps) {
  const [expandedField, setExpandedField] = useState<string | null>(null);
  
  const allFields = [
    ...successQuestions.map(q => q.key),
    ...challengeQuestions.map(q => q.key),
    "lessonDelivery",
    ...differentiationQuestions.map(q => q.key),
    "strategiesNextLesson",
  ];
  
  const isIncomplete = allFields.some(key => !reflection[key as keyof LessonPlanReflection]?.toString().trim());
  
  const isLearnerFilled = (key: string) => {
    return !!reflection[key as keyof LessonPlanReflection]?.toString().trim();
  };

  const handleFocus = (key: string) => {
    setExpandedField(key);
  };

  const handleBlur = () => {
    setExpandedField(null);
  };
  
  return (
    <Card id="reflection-section" className={cn("bg-amber-50/50", isIncomplete && "border-amber-300")}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Reflection</CardTitle>
          </div>
          {isIncomplete && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Incomplete</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-6">
        {/* Successes Section */}
        <div className="space-y-4">
          <div className="bg-sky-100 px-3 py-2 rounded-md">
            <h3 className="font-semibold text-sm">Successes</h3>
          </div>
          {successQuestions.map((q) => (
            <div key={q.key} className="space-y-2">
              <Label className="text-sm font-medium">
                {q.label}
                {!reflection[q.key]?.trim() && (
                  <span className="text-amber-600 ml-2 text-xs font-normal">(Required)</span>
                )}
              </Label>
              <Textarea
                value={reflection[q.key] || ""}
                onChange={(e) => onChange({ ...reflection, [q.key]: e.target.value })}
                onFocus={() => handleFocus(q.key)}
                onBlur={handleBlur}
                placeholder={q.placeholder}
                className={cn(
                  "transition-all duration-200",
                  expandedField === q.key ? "min-h-[160px]" : "min-h-[80px]",
                  !reflection[q.key]?.trim() && "border-amber-300 focus-visible:ring-amber-500"
                )}
              />
            </div>
          ))}
        </div>

        {/* Challenges Section */}
        <div className="space-y-4">
          <div className="bg-sky-100 px-3 py-2 rounded-md">
            <h3 className="font-semibold text-sm">Challenges</h3>
          </div>
          {challengeQuestions.map((q) => (
            <div key={q.key} className="space-y-2">
              <Label className="text-sm font-medium">
                {q.label}
                {!reflection[q.key]?.trim() && (
                  <span className="text-amber-600 ml-2 text-xs font-normal">(Required)</span>
                )}
              </Label>
              <Textarea
                value={reflection[q.key] || ""}
                onChange={(e) => onChange({ ...reflection, [q.key]: e.target.value })}
                onFocus={() => handleFocus(q.key)}
                onBlur={handleBlur}
                placeholder={q.placeholder}
                className={cn(
                  "transition-all duration-200",
                  expandedField === q.key ? "min-h-[160px]" : "min-h-[80px]",
                  !reflection[q.key]?.trim() && "border-amber-300 focus-visible:ring-amber-500"
                )}
              />
            </div>
          ))}
        </div>

        {/* Lesson Delivery Section with Tabs */}
        <div className="space-y-4">
          <div className="bg-sky-100 px-3 py-2 rounded-md">
            <h3 className="font-semibold text-sm">How did your lesson delivery promote active student learning and participation?</h3>
          </div>
          
          <Tabs defaultValue="noviceLearners" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto bg-sky-100">
              {differentiationQuestions.map((q) => (
                <TabsTrigger 
                  key={q.key} 
                  value={q.key}
                  className={cn(
                    "text-xs px-2 py-2 gap-1",
                    isLearnerFilled(q.key) 
                      ? "data-[state=active]:bg-emerald-500 data-[state=active]:text-white bg-emerald-100 text-emerald-700" 
                      : "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  )}
                >
                  <span className="truncate">{q.label.split(" ")[0]}</span>
                  {isLearnerFilled(q.key) && (
                    <Check className="h-3.5 w-3.5 flex-shrink-0" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {differentiationQuestions.map((q) => (
              <TabsContent key={q.key} value={q.key} className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">{q.sublabel}</p>
                <Textarea
                  value={reflection[q.key] || ""}
                  onChange={(e) => onChange({ ...reflection, [q.key]: e.target.value })}
                  onFocus={() => handleFocus(q.key)}
                  onBlur={handleBlur}
                  placeholder={q.placeholder}
                  className={cn(
                    "transition-all duration-200",
                    expandedField === q.key ? "min-h-[180px]" : "min-h-[100px]",
                    !reflection[q.key]?.trim() && "border-amber-300 focus-visible:ring-amber-500"
                  )}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Strategies Section */}
        <div className="space-y-4">
          <div className="bg-sky-100 px-3 py-2 rounded-md">
            <h3 className="font-semibold text-sm">Strategies for next lesson to address the challenges and to replicate the successes</h3>
          </div>
          <Textarea
            value={reflection.strategiesNextLesson || ""}
            onChange={(e) => onChange({ ...reflection, strategiesNextLesson: e.target.value })}
            onFocus={() => handleFocus("strategiesNextLesson")}
            onBlur={handleBlur}
            placeholder="Describe specific strategies you will implement in the next lesson."
            className={cn(
              "transition-all duration-200",
              expandedField === "strategiesNextLesson" ? "min-h-[160px]" : "min-h-[100px]",
              !reflection.strategiesNextLesson?.trim() && "border-amber-300 focus-visible:ring-amber-500"
            )}
          />
        </div>

        {/* Signature & Date */}
        <div className="space-y-2">
          <div className="bg-sky-100 px-3 py-2 rounded-md">
            <h3 className="font-semibold text-sm">Signature & Date</h3>
          </div>
          <Input
            value={reflection.signatureDate || ""}
            onChange={(e) => onChange({ ...reflection, signatureDate: e.target.value })}
            placeholder="Enter your name and date"
            className="max-w-md"
          />
        </div>

        {/* Completion Status */}
        <div className={cn(
          "rounded-md p-3 text-xs",
          isIncomplete 
            ? "bg-amber-50 border border-amber-200 text-amber-700" 
            : "bg-emerald-50 border border-emerald-200 text-emerald-700"
        )}>
          {isIncomplete ? (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Please complete all reflection questions to mark this lesson plan as complete.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Reflection complete.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
