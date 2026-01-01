import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementCarousel } from "@/components/home/AnnouncementCarousel";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { TeacherQuickLinks } from "@/components/home/TeacherQuickLinks";
import { BookOpen, Clock, Users } from "lucide-react";
import schoolBadge from "@/assets/school-badge.png";
import heroBanner from "@/assets/hero-banner.png";
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
  const [selectedClass, setSelectedClass] = useState(teacherProfile.classes[0]);

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
      <div className="px-4 mt-4">
        <img 
          src={heroBanner} 
          alt="School Banner" 
          className="w-full h-auto rounded-2xl shadow-md"
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
      </div>

      <AnnouncementCarousel />
      <UpcomingEvents />
    </TeacherAppLayout>
  );
}
