import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Role Selection
import RoleSelectionPage from "./pages/RoleSelectionPage";

// Parent/Student Pages
import HomePage from "./pages/HomePage";
import AttendancePage from "./pages/AttendancePage";
import AcademicPage from "./pages/AcademicPage";
import CalendarPage from "./pages/CalendarPage";
import SupportPage from "./pages/SupportPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import SecurityPrivacyPage from "./pages/SecurityPrivacyPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";

// Teacher Pages
import TeacherHomePage from "./pages/teacher/TeacherHomePage";
import TeacherAttendancePage from "./pages/teacher/TeacherAttendancePage";
import TeacherAcademicPage from "./pages/teacher/TeacherAcademicPage";
import TeacherCalendarPage from "./pages/teacher/TeacherCalendarPage";
import TeacherProfilePage from "./pages/teacher/TeacherProfilePage";
import TeacherNotificationsPage from "./pages/teacher/TeacherNotificationsPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Role Selection - Landing Page */}
          <Route path="/" element={<RoleSelectionPage />} />

          {/* Parent/Student Routes */}
          <Route path="/parent" element={<HomePage />} />
          <Route path="/parent/attendance" element={<AttendancePage />} />
          <Route path="/parent/academic" element={<AcademicPage />} />
          <Route path="/parent/calendar" element={<CalendarPage />} />
          <Route path="/parent/support" element={<SupportPage />} />
          <Route path="/parent/profile" element={<ProfilePage />} />
          <Route path="/parent/notifications" element={<NotificationsPage />} />
          <Route path="/parent/announcements" element={<AnnouncementsPage />} />
          <Route path="/parent/security-privacy" element={<SecurityPrivacyPage />} />
          <Route path="/parent/privacy-policy" element={<PrivacyPolicyPage />} />

          {/* Teacher Routes */}
          <Route path="/teacher" element={<TeacherHomePage />} />
          <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
          <Route path="/teacher/academic" element={<TeacherAcademicPage />} />
          <Route path="/teacher/calendar" element={<TeacherCalendarPage />} />
          <Route path="/teacher/profile" element={<TeacherProfilePage />} />
          <Route path="/teacher/notifications" element={<TeacherNotificationsPage />} />
          <Route path="/teacher/security-privacy" element={<SecurityPrivacyPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
