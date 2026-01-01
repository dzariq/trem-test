import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { AnnouncementCarousel } from "@/components/home/AnnouncementCarousel";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { QuickLinks } from "@/components/home/QuickLinks";
import { AttendanceSummary } from "@/components/home/AttendanceSummary";
import { ResultsSummary } from "@/components/home/ResultsSummary";
import { StudentPillSelector } from "@/components/home/StudentPillSelector";
import schoolBadge from "@/assets/school-badge.png";
import heroBanner from "@/assets/hero-banner.png";

export default function HomePage() {
  return (
    <AppLayout>
      <AppHeader 
        title="" 
        showNotifications 
        showProfile 
        leftContent={
          <div className="flex items-center gap-3">
            <img src={schoolBadge} alt="School Badge" className="h-11 w-auto" />
            <StudentPillSelector />
          </div>
        }
      />
      
      <div className="w-full">
        <img src={heroBanner} alt="School banner" className="w-full h-auto" />
      </div>
      
      <AnnouncementCarousel />
      <UpcomingEvents />
      <QuickLinks />
      <AttendanceSummary />
      <ResultsSummary />
    </AppLayout>
  );
}
