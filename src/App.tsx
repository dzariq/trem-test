import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FEATURES } from "@/config/featureFlags";
import { AuthProvider } from "@/contexts/AuthContext";
import { CampusProvider } from "@/contexts/CampusContext";
import { StudentSelectionProvider } from "@/contexts/StudentSelectionContext";
import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";
import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary";

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
import HomeworkPage from "./pages/HomeworkPage";
import InvoicePage from "./pages/InvoicePage";
import VisaPage from "./pages/VisaPage";
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
import TeacherLessonPlansListPage from "./pages/teacher/TeacherLessonPlansListPage";
import TeacherMLPDetailPage from "./pages/teacher/TeacherMLPDetailPage";
import WeekConfigPage from "./pages/teacher/WeekConfigPage";
import TeacherGuard from "./components/auth/TeacherGuard";
import TeacherCcaPage from "./pages/teacher/TeacherCcaPage";
import TeacherCcaDetailPage from "./pages/teacher/TeacherCcaDetailPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function NativeBindings() {
  useAndroidBackButton();
  return null;
}

function RouteScrollRestoration() {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      const appScroll = document.querySelector('[data-app-scroll="true"]') as HTMLElement | null;
      appScroll?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    const raf = requestAnimationFrame(scrollToTop);
    const timeout = window.setTimeout(scrollToTop, 50);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StudentSelectionProvider>
      <CampusProvider>
        <TooltipProvider>
          <Toaster />
          <div
            data-app-scroll="true"
            className="app-shell h-screen overflow-y-auto overflow-x-hidden"
          >
            <BrowserRouter>
              <NativeBindings />
              <RouteScrollRestoration />
              <RouteErrorBoundary>
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
                  <Route path="/parent/invoice" element={<InvoicePage />} />
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
                  <Route path="/parent/visa" element={<VisaPage />} />
                  {FEATURES.homeworkParent && (
                    <Route path="/parent/homework" element={<HomeworkPage />} />
                  )}
                  {FEATURES.lessonPlanParent && (
                    <Route path="/parent/lesson-plans" element={<NotFound />} />
                  )}
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
                  <Route path="/teacher/lesson-plans" element={<TeacherLessonPlansListPage />} />
                  <Route
                    path="/teacher/lesson-plans/:id"
                    element={<TeacherMLPDetailPage />}
                  />
                  <Route path="/teacher/cca" element={<TeacherCcaPage />} />
                  <Route
                    path="/teacher/cca/:activityId"
                    element={<TeacherCcaDetailPage />}
                  />
                  <Route path="/teacher/week-config" element={<WeekConfigPage />} />
                  <Route
                    path="/teacher/security-privacy"
                    element={<SecurityPrivacyPage />}
                  />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              </RouteErrorBoundary>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </CampusProvider>
      </StudentSelectionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
