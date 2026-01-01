import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AttendancePage from "./pages/AttendancePage";
import AcademicPage from "./pages/AcademicPage";
import CalendarPage from "./pages/CalendarPage";
import SupportPage from "./pages/SupportPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import SecurityPrivacyPage from "./pages/SecurityPrivacyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/academic" element={<AcademicPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/security-privacy" element={<SecurityPrivacyPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
