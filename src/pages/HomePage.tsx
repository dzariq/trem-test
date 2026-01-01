import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { AnnouncementCarousel } from "@/components/home/AnnouncementCarousel";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { QuickLinks } from "@/components/home/QuickLinks";
import { AttendanceSummary } from "@/components/home/AttendanceSummary";
import { ResultsSummary } from "@/components/home/ResultsSummary";
import { StudentPillSelector } from "@/components/home/StudentPillSelector";

export default function HomePage() {
  return (
    <AppLayout>
      <AppHeader 
        title="" 
        showNotifications 
        showProfile 
        leftContent={<StudentPillSelector />}
      />
      
      <AnnouncementCarousel />
      <UpcomingEvents />
      <QuickLinks />
      <AttendanceSummary />
      <ResultsSummary />
    </AppLayout>
  );
}
