import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { AnnouncementCarousel } from "@/components/home/AnnouncementCarousel";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { QuickLinks } from "@/components/home/QuickLinks";
import { AttendanceSummary } from "@/components/home/AttendanceSummary";
import { ResultsSummary } from "@/components/home/ResultsSummary";
import { studentProfile } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function HomePage() {
  return (
    <AppLayout>
      <AppHeader title="Dashboard" showNotifications showProfile />
      
      {/* Student Welcome Card */}
      <section className="px-4 pt-4">
        <Card className="bg-primary text-primary-foreground border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary-foreground/30">
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-lg font-semibold">
                {studentProfile.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm opacity-90">Welcome back!</p>
              <h2 className="text-lg font-semibold">{studentProfile.name}</h2>
              <p className="text-sm opacity-80">{studentProfile.grade} • Class {studentProfile.class}</p>
            </div>
          </CardContent>
        </Card>
      </section>
      
      <AnnouncementCarousel />
      <UpcomingEvents />
      <QuickLinks />
      <AttendanceSummary />
      <ResultsSummary />
    </AppLayout>
  );
}
