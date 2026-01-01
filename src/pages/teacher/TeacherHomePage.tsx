import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementCarousel } from "@/components/home/AnnouncementCarousel";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { UserCheck, BookOpen, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import schoolBadge from "@/assets/school-badge.png";
import { teacherProfile, teacherQuickStats } from "@/data/teacherMockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function TeacherHomePage() {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState(teacherProfile.classes[0]);

  const quickActions = [
    { 
      icon: UserCheck, 
      label: "Take Attendance", 
      onClick: () => navigate("/teacher/attendance"),
      color: "text-emerald-600"
    },
    { 
      icon: BookOpen, 
      label: "Grade Entry", 
      onClick: () => navigate("/teacher/academic"),
      color: "text-blue-600"
    },
  ];

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

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
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
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {teacherQuickStats.upcomingDeadlines}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Deadlines</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
              >
                <action.icon className={`h-6 w-6 mb-2 ${action.color}`} />
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <AnnouncementCarousel />
      <UpcomingEvents />
    </TeacherAppLayout>
  );
}
