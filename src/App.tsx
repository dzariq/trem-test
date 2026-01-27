import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Role Selection
import RoleSelectionPage from "./pages/RoleSelectionPage";
import Login from "./pages/Login";

// Parent/Student Pages
import HomePage from "./pages/HomePage";
import AttendancePage from "./pages/AttendancePage";
import AcademicPage from "./pages/AcademicPage";
import CalendarPage from "./pages/CalendarPage";
import SupportPage from "./pages/SupportPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import AnnouncementDetailPage from "./pages/AnnouncementDetailPage";
import SecurityPrivacyPage from "./pages/SecurityPrivacyPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import ContactPage from "./pages/ContactPage";
import AwardsPage from "./pages/AwardsPage";
import StudentHandbookPage from "./pages/StudentHandbookPage";
import ParentStudentGuard from "./components/auth/ParentStudentGuard";

// Teacher Pages
import TeacherHomePage from "./pages/teacher/TeacherHomePage";
import TeacherAttendancePage from "./pages/teacher/TeacherAttendancePage";
import TeacherAcademicPage from "./pages/teacher/TeacherAcademicPage";
import TeacherCalendarPage from "./pages/teacher/TeacherCalendarPage";
import TeacherProfilePage from "./pages/teacher/TeacherProfilePage";
import TeacherNotificationsPage from "./pages/teacher/TeacherNotificationsPage";
import TeacherDNAPage from "./pages/teacher/TeacherDNAPage";
import TeacherTimetablePage from "./pages/teacher/TeacherTimetablePage";
import TeacherHandbookPage from "./pages/teacher/TeacherHandbookPage";
import TeacherAnnouncementsPage from "./pages/teacher/TeacherAnnouncementsPage";
import TeacherLessonPlansPage from "./pages/teacher/TeacherLessonPlansPage";
import LessonPlanDetailPage from "./pages/teacher/LessonPlanDetailPage";
import WeekConfigPage from "./pages/teacher/WeekConfigPage";
import TeacherGuard from "./components/auth/TeacherGuard";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div
          data-app-scroll="true"
          className="app-shell h-screen overflow-y-auto overflow-x-hidden"
        >
          <BrowserRouter>
            <Routes>
              {/* Role Selection - Landing Page */}
              <Route path="/" element={<RoleSelectionPage />} />
              <Route path="/login" element={<Login />} />

              {/* Parent/Student Routes - Protected */}
              <Route element={<ParentStudentGuard />}>
                <Route path="/portal" element={<HomePage />} />
                <Route path="/parent" element={<HomePage />} />
                <Route path="/parent/attendance" element={<AttendancePage />} />
                <Route path="/parent/academic" element={<AcademicPage />} />
                <Route path="/parent/calendar" element={<CalendarPage />} />
                <Route path="/parent/support" element={<SupportPage />} />
                <Route path="/parent/profile" element={<ProfilePage />} />
                <Route path="/parent/notifications" element={<NotificationsPage />} />
                <Route path="/parent/announcements" element={<AnnouncementsPage />} />
                <Route
                  path="/parent/announcements/:id"
                  element={<AnnouncementDetailPage />}
                />
                <Route
                  path="/parent/security-privacy"
                  element={<SecurityPrivacyPage />}
                />
                <Route path="/parent/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/parent/contact" element={<ContactPage />} />
                <Route path="/parent/awards" element={<AwardsPage />} />
                <Route path="/parent/handbook" element={<StudentHandbookPage />} />
              </Route>
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

              {/* Teacher Routes - Protected */}
              <Route element={<TeacherGuard />}>
                <Route path="/teacher" element={<TeacherHomePage />} />
                <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
                <Route path="/teacher/academic" element={<TeacherAcademicPage />} />
                <Route path="/teacher/calendar" element={<TeacherCalendarPage />} />
                <Route path="/teacher/profile" element={<TeacherProfilePage />} />
                <Route
                  path="/teacher/notifications"
                  element={<TeacherNotificationsPage />}
                />
                <Route path="/teacher/dna" element={<TeacherDNAPage />} />
                <Route path="/teacher/timetable" element={<TeacherTimetablePage />} />
                <Route path="/teacher/handbook" element={<TeacherHandbookPage />} />
                <Route
                  path="/teacher/announcements"
                  element={<TeacherAnnouncementsPage />}
                />
                <Route path="/teacher/lesson-plans" element={<TeacherLessonPlansPage />} />
                <Route
                  path="/teacher/lesson-plans/:id"
                  element={<LessonPlanDetailPage />}
                />
                <Route path="/teacher/week-config" element={<WeekConfigPage />} />
                <Route
                  path="/teacher/security-privacy"
                  element={<SecurityPrivacyPage />}
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
