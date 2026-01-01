import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementCarousel } from "@/components/home/AnnouncementCarousel";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { TeacherQuickLinks } from "@/components/home/TeacherQuickLinks";
import { BookOpen, Users, Clock, FileText, Calendar, AlertTriangle, ClipboardList } from "lucide-react";
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

const getDeadlineIcon = (type: Deadline["type"]) => {
  switch (type) {
    case "grade": return BookOpen;
    case "report": return FileText;
    case "meeting": return Users;
    case "submission": return ClipboardList;
    case "event": return Calendar;
  }
};

const getDeadlineColor = (daysLeft: number) => {
  if (daysLeft <= 3) return "bg-destructive/10 border-destructive/30 text-destructive";
  if (daysLeft <= 7) return "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400";
  return "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400";
};

const getDaysLeftBadge = (daysLeft: number) => {
  if (daysLeft <= 0) return { text: "Overdue", variant: "destructive" as const };
  if (daysLeft === 1) return { text: "Tomorrow", variant: "destructive" as const };
  if (daysLeft <= 3) return { text: `${daysLeft} days`, variant: "destructive" as const };
  if (daysLeft <= 7) return { text: `${daysLeft} days`, variant: "secondary" as const };
  return { text: `${daysLeft} days`, variant: "outline" as const };
};

export default function TeacherHomePage() {
  const [selectedClass, setSelectedClass] = useState(teacherProfile.classes[0]);

  // Filter deadlines within 30 days
  const today = new Date();
  const upcomingDeadlines = teacherDeadlines
    .map(deadline => ({
      ...deadline,
      daysLeft: differenceInDays(parseISO(deadline.dueDate), today)
    }))
    .filter(deadline => deadline.daysLeft <= 30 && deadline.daysLeft >= -7) // Include overdue up to 7 days
    .sort((a, b) => a.daysLeft - b.daysLeft);

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
      <div>
        <img 
          src={heroBanner} 
          alt="School Banner" 
          className="w-full h-auto"
        />
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
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-3 text-center">
              <BookOpen className="h-5 w-5 mx-auto mb-1 text-amber-600" />
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {teacherQuickStats.pendingGrades}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Pending Grades</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Upcoming Deadlines
              {upcomingDeadlines.filter(d => d.daysLeft <= 7).length > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  {upcomingDeadlines.filter(d => d.daysLeft <= 7).length} urgent
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming deadlines within 30 days
              </p>
            ) : (
              upcomingDeadlines.map((deadline) => {
                const Icon = getDeadlineIcon(deadline.type);
                const badgeInfo = getDaysLeftBadge(deadline.daysLeft);
                
                return (
                  <div 
                    key={deadline.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${getDeadlineColor(deadline.daysLeft)}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {deadline.daysLeft <= 3 ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{deadline.title}</p>
                        <Badge variant={badgeInfo.variant} className="text-xs flex-shrink-0">
                          {badgeInfo.text}
                        </Badge>
                      </div>
                      <p className="text-xs opacity-80 mt-0.5">{deadline.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs opacity-70">
                          {format(parseISO(deadline.dueDate), "EEE, d MMM yyyy")}
                        </span>
                        {deadline.class && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {deadline.class}
                          </Badge>
                        )}
                      </div>
                    </div>
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
