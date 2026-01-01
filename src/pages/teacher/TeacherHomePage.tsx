import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnnouncementCarousel } from "@/components/home/AnnouncementCarousel";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { TeacherQuickLinks } from "@/components/home/TeacherQuickLinks";
import TeacherWelcomeQuote from "@/components/home/TeacherWelcomeQuote";
import { BookOpen, Users, Clock, FileText, Calendar, AlertTriangle, ClipboardList, Check, ChevronDown, ChevronUp } from "lucide-react";
import schoolBadge from "@/assets/school-badge.png";
import heroBanner from "@/assets/teacher-hero-banner.png";
import { teacherProfile, teacherQuickStats, teacherDeadlines, Deadline } from "@/data/teacherMockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { differenceInDays, format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const getDeadlineIcon = (type: Deadline["type"]) => {
  switch (type) {
    case "grade": return BookOpen;
    case "report": return FileText;
    case "meeting": return Users;
    case "submission": return ClipboardList;
    case "event": return Calendar;
  }
};

const getDeadlineColor = (daysLeft: number, isCompleted: boolean) => {
  if (isCompleted) return "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400";
  if (daysLeft < 8) return "bg-destructive/10 border-destructive/30 text-destructive";
  return "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400";
};

const getDaysLeftBadge = (daysLeft: number, isCompleted: boolean) => {
  if (isCompleted) return { text: "Done", variant: "default" as const };
  if (daysLeft <= 0) return { text: "Overdue", variant: "destructive" as const };
  if (daysLeft === 1) return { text: "Tomorrow", variant: "destructive" as const };
  if (daysLeft <= 3) return { text: `${daysLeft}d left`, variant: "destructive" as const };
  if (daysLeft <= 7) return { text: `${daysLeft}d left`, variant: "secondary" as const };
  return { text: `${daysLeft}d left`, variant: "outline" as const };
};

export default function TeacherHomePage() {
  const [selectedClass, setSelectedClass] = useState(teacherProfile.classes[0]);
  const [completedDeadlines, setCompletedDeadlines] = useState<string[]>([]);
  const [expandedDeadline, setExpandedDeadline] = useState<string | null>(null);
  const [showPendingGrades, setShowPendingGrades] = useState(false);

  const totalPendingGrades = teacherQuickStats.pendingGrades.reduce((sum, item) => sum + item.count, 0);

  // Filter deadlines within 30 days
  const today = new Date();
  const upcomingDeadlines = teacherDeadlines
    .map(deadline => ({
      ...deadline,
      daysLeft: differenceInDays(parseISO(deadline.dueDate), today),
      isCompleted: completedDeadlines.includes(deadline.id)
    }))
    .filter(deadline => deadline.daysLeft <= 30 && deadline.daysLeft >= -7)
    .sort((a, b) => {
      // Completed items go to the end
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return a.daysLeft - b.daysLeft;
    })
    .slice(0, 3); // Only show 3

  const toggleComplete = (id: string) => {
    setCompletedDeadlines(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedDeadline(prev => prev === id ? null : id);
  };

  return (
    <TeacherAppLayout>
      <AppHeader 
        title="" 
        showNotifications 
        showProfile 
        leftContent={
          <div className="flex items-center gap-3">
            <img src={schoolBadge} alt="School Badge" className="h-11 w-auto" />
            <div>
              <p className="text-xs text-muted-foreground">Welcome back,</p>
              <p className="text-sm font-semibold text-foreground">{teacherProfile.name}</p>
            </div>
          </div>
        }
      />

      {/* Hero Banner */}
      <div className="relative">
        <img 
          src={heroBanner} 
          alt="School Banner" 
          className="w-full h-auto"
        />
        <TeacherWelcomeQuote />
      </div>

      {/* Quick Links */}
      <TeacherQuickLinks />

      <div className="px-4 space-y-4 mt-4">
        {/* Class Selector */}
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            {teacherProfile.classes.map((cls) => (
              <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quick Stats - Now 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-3 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {teacherQuickStats.todayAttendance.present}/{teacherQuickStats.todayAttendance.total}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">Present Today</p>
            </CardContent>
          </Card>
          <Card 
            className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 cursor-pointer transition-all hover:shadow-md"
            onClick={() => setShowPendingGrades(!showPendingGrades)}
          >
            <CardContent className="p-3 text-center">
              <BookOpen className="h-5 w-5 mx-auto mb-1 text-amber-600" />
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {totalPendingGrades}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Pending Grades</p>
              <p className="text-[10px] text-amber-500 dark:text-amber-400 mt-1 flex items-center justify-center gap-0.5">
                {showPendingGrades ? (
                  <>Hide <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>View <ChevronDown className="h-3 w-3" /></>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Grades Details */}
        {showPendingGrades && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <BookOpen className="h-4 w-4" />
                Pending Grades by Class
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {teacherQuickStats.pendingGrades.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.class}
                    </Badge>
                    <span className="text-sm text-foreground">{item.subject}</span>
                  </div>
                  <Badge className="bg-amber-500 text-white">
                    {item.count} students
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Deadlines Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming deadlines
              </p>
            ) : (
              upcomingDeadlines.map((deadline) => {
                const Icon = getDeadlineIcon(deadline.type);
                const badgeInfo = getDaysLeftBadge(deadline.daysLeft, deadline.isCompleted);
                const isExpanded = expandedDeadline === deadline.id;
                
                return (
                  <div 
                    key={deadline.id}
                    className={cn(
                      "rounded-lg border transition-all",
                      getDeadlineColor(deadline.daysLeft, deadline.isCompleted),
                      deadline.isCompleted && "opacity-60"
                    )}
                  >
                    {/* Collapsed View - Always Visible */}
                    <div 
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => toggleExpand(deadline.id)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6 rounded-full flex-shrink-0",
                          deadline.isCompleted 
                            ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                            : "border-2 hover:bg-accent"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComplete(deadline.id);
                        }}
                      >
                        {deadline.isCompleted && <Check className="h-3 w-3" />}
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          deadline.isCompleted && "line-through"
                        )}>
                          {deadline.title}
                        </p>
                        <p className="text-xs opacity-70">
                          {format(parseISO(deadline.dueDate), "d MMM yyyy")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={badgeInfo.variant} className="text-xs">
                          {badgeInfo.text}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 opacity-50" />
                        ) : (
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-current/10">
                        <div className="pt-2 space-y-2">
                          <p className="text-xs opacity-80">{deadline.description}</p>
                          <div className="flex items-center gap-2">
                            <Icon className="h-3 w-3 opacity-60" />
                            <span className="text-xs opacity-60 capitalize">{deadline.type}</span>
                            {deadline.class && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Class {deadline.class}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <AnnouncementCarousel />
      <UpcomingEvents />
    </TeacherAppLayout>
  );
}
