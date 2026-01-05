import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { AnnouncementCarousel } from "@/components/home/AnnouncementCarousel";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { QuickLinks } from "@/components/home/QuickLinks";
import { AttendanceSummary } from "@/components/home/AttendanceSummary";
import { StudentPillSelector } from "@/components/home/StudentPillSelector";
import { WelcomeTypingAnimation } from "@/components/home/WelcomeTypingAnimation";
import schoolBadge from "@/assets/school-badge.png";
import heroBanner from "@/assets/hero-banner.png";
import teacherHomePattern from "@/assets/teacher-home-pattern.png";

export default function HomePage() {
  return (
    <AppLayout>
      <AppHeader 
        title="" 
        showNotifications 
        showProfile 
        leftContent={
          <div className="flex items-center gap-3">
            <img 
              src={schoolBadge} 
              alt="School Badge" 
              className="h-16 w-auto -my-3 drop-shadow-md" 
            />
            <StudentPillSelector />
          </div>
        }
      />
      
      <div className="w-full relative">
        <img src={heroBanner} alt="School banner" className="w-full h-auto" />
        <WelcomeTypingAnimation />
      </div>
      
      <QuickLinks />
      
      {/* Background pattern that overlaps with announcements */}
      <div className="relative z-0 -mb-24 mx-4">
        <img 
          src={teacherHomePattern} 
          alt="" 
          className="w-full h-auto rounded-3xl"
        />
      </div>
      
      <AnnouncementCarousel />
      <UpcomingEvents />
      <AttendanceSummary />
      
      {/* Footer with faded school badge */}
      <div className="flex flex-col items-center justify-center py-8 mt-4">
        <img 
          src={schoolBadge} 
          alt="School Badge" 
          className="h-20 w-auto opacity-20 grayscale"
        />
        <p className="text-muted-foreground/50 text-xs mt-2">Collinz International School</p>
      </div>
    </AppLayout>
  );
}
