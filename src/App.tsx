import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { FEATURES } from "@/config/featureFlags";
import { AuthProvider } from "@/contexts/AuthContext";
import { CampusProvider } from "@/contexts/CampusContext";
import { StudentSelectionProvider } from "@/contexts/StudentSelectionContext";
import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";
import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary";

// Login - kept eager since it's the landing page
import Login from "./pages/Login";
import ParentStudentGuard from "./components/auth/ParentStudentGuard";
import TeacherGuard from "./components/auth/TeacherGuard";

// Parent/Student Pages - lazy loaded for route-level code splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const AcademicPage = lazy(() => import("./pages/AcademicPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));
const AnnouncementDetailPage = lazy(() => import("./pages/AnnouncementDetailPage"));
const SecurityPrivacyPage = lazy(() => import("./pages/SecurityPrivacyPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AwardsPage = lazy(() => import("./pages/AwardsPage"));
const StudentHandbookPage = lazy(() => import("./pages/StudentHandbookPage"));
const HomeworkPage = lazy(() => import("./pages/HomeworkPage"));
const InvoicePage = lazy(() => import("./pages/InvoicePage"));
const VisaPage = lazy(() => import("./pages/VisaPage"));
const ParentTimetablePage = lazy(() => import("./pages/ParentTimetablePage"));
const ParentCcaPage = lazy(() => import("./pages/ParentCcaPage"));
const ParentCcaDetailPage = lazy(() => import("./pages/ParentCcaDetailPage"));

// Teacher Pages - lazy loaded
const TeacherHomePage = lazy(() => import("./pages/teacher/TeacherHomePage"));
const TeacherAttendancePage = lazy(() => import("./pages/teacher/TeacherAttendancePage"));
const TeacherAcademicPage = lazy(() => import("./pages/teacher/TeacherAcademicPage"));
const TeacherCalendarPage = lazy(() => import("./pages/teacher/TeacherCalendarPage"));
const TeacherProfilePage = lazy(() => import("./pages/teacher/TeacherProfilePage"));
const TeacherNotificationsPage = lazy(() => import("./pages/teacher/TeacherNotificationsPage"));
const TeacherDNAPage = lazy(() => import("./pages/teacher/TeacherDNAPage"));
const TeacherTimetablePage = lazy(() => import("./pages/teacher/TeacherTimetablePage"));
const TeacherHandbookPage = lazy(() => import("./pages/teacher/TeacherHandbookPage"));
const TeacherAnnouncementsPage = lazy(() => import("./pages/teacher/TeacherAnnouncementsPage"));
const TeacherLessonPlansListPage = lazy(() => import("./pages/teacher/TeacherLessonPlansListPage"));
const TeacherMLPDetailPage = lazy(() => import("./pages/teacher/TeacherMLPDetailPage"));
const WeekConfigPage = lazy(() => import("./pages/teacher/WeekConfigPage"));
const TeacherCcaPage = lazy(() => import("./pages/teacher/TeacherCcaPage"));
const TeacherCcaDetailPage = lazy(() => import("./pages/teacher/TeacherCcaDetailPage"));
const TeacherVenueDetailPage = lazy(() => import("./pages/teacher/TeacherVenueDetailPage"));

const NotFound = lazy(() => import("./pages/NotFound"));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Unified Login - Landing Page */}
                <Route path="/" element={<Login />} />
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
                  <Route path="/parent/timetable" element={<ParentTimetablePage />} />
                  <Route path="/parent/cca" element={<ParentCcaPage />} />
                  <Route path="/parent/cca/:activityId" element={<ParentCcaDetailPage />} />
                  {FEATURES.homeworkParent && (
                    <Route path="/parent/homework" element={<HomeworkPage />} />
                  )}
                  {FEATURES.lessonPlanParent && (
                    <Route path="/parent/lesson-plans" element={<NotFound />} />
                  )}

                  {/* Student Routes - same components as Parent */}
                  <Route path="/students" element={<HomePage />} />
                  <Route path="/students/attendance" element={<AttendancePage />} />
                  <Route path="/students/academic" element={<AcademicPage />} />
                  <Route path="/students/calendar" element={<CalendarPage />} />
                  <Route path="/students/invoice" element={<InvoicePage />} />
                  <Route path="/students/support" element={<SupportPage />} />
                  <Route path="/students/profile" element={<ProfilePage />} />
                  <Route path="/students/notifications" element={<NotificationsPage />} />
                  <Route path="/students/announcements" element={<AnnouncementsPage />} />
                  <Route path="/students/announcements/:id" element={<AnnouncementDetailPage />} />
                  <Route path="/students/security-privacy" element={<SecurityPrivacyPage />} />
                  <Route path="/students/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/students/contact" element={<ContactPage />} />
                  <Route path="/students/awards" element={<AwardsPage />} />
                  <Route path="/students/handbook" element={<StudentHandbookPage />} />
                  <Route path="/students/visa" element={<VisaPage />} />
                  <Route path="/students/cca" element={<ParentCcaPage />} />
                  <Route path="/students/cca/:activityId" element={<ParentCcaDetailPage />} />
                  {FEATURES.homeworkParent && (
                    <Route path="/students/homework" element={<HomeworkPage />} />
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
                  <Route
                    path="/teacher/venue/:venueId"
                    element={<TeacherVenueDetailPage />}
                  />
                  <Route path="/teacher/week-config" element={<WeekConfigPage />} />
                  <Route
                    path="/teacher/security-privacy"
                    element={<SecurityPrivacyPage />}
                  />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
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
