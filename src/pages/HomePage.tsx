import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { AnnouncementCarousel } from "@/components/home/AnnouncementCarousel";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { QuickLinks } from "@/components/home/QuickLinks";
import { AttendanceSummary } from "@/components/home/AttendanceSummary";
import { StudentPillSelector } from "@/components/home/StudentPillSelector";
import { WelcomeTypingAnimation } from "@/components/home/WelcomeTypingAnimation";
import { Card, CardContent } from "@/components/ui/card";
import schoolBadge from "@/assets/school-badge.png";
import heroBanner from "@/assets/hero-banner.png";
import { listAnnouncements, markAnnouncementRead, type Announcement } from "@/data/announcements";
import { listUpcomingEvents, type UpcomingEvent } from "@/data/calendar";
import { useNavigate } from "react-router-dom";
import { useMyProfile } from "@/hooks/useMyProfile";

export default function HomePage() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useMyProfile();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAnnouncements = async () => {
      setAnnouncementsLoading(true);
      setAnnouncementsError(null);
      try {
        const data = await listAnnouncements({ limit: 10 });
        if (isMounted) {
          setAnnouncements(data);
        }
      } catch (error) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Failed to load announcements.";
          setAnnouncementsError(message);
        }
      } finally {
        if (isMounted) {
          setAnnouncementsLoading(false);
        }
      }
    };

    loadAnnouncements();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const data = await listUpcomingEvents({
          role: profile?.role,
          limit: 10,
        });
        if (isMounted) {
          setEvents(data);
        }
      } catch (error) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Failed to load events.";
          setEventsError(message);
        }
      } finally {
        if (isMounted) {
          setEventsLoading(false);
        }
      }
    };

    if (!profileLoading) {
      loadEvents();
    }
    return () => {
      isMounted = false;
    };
  }, [profileLoading, profile?.role]);

  const handleMarkAnnouncementRead = async (id: Announcement["id"]) => {
    try {
      await markAnnouncementRead(id);
      setAnnouncements(prev =>
        prev.map(item => (item.id === id ? { ...item, is_read: true } : item))
      );
    } catch {
      // Ignore read tracking errors to avoid blocking the UI.
    }
  };

  const greetingName = profile?.full_name ?? profile?.email ?? "there";

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
        <WelcomeTypingAnimation name={greetingName} />
      </div>
      
      <QuickLinks />
      {announcementsLoading && (
        <div className="px-4 py-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Loading announcements...
            </CardContent>
          </Card>
        </div>
      )}

      {announcementsError && !announcementsLoading && (
        <div className="px-4 py-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 text-center text-sm text-destructive">
              {announcementsError}
            </CardContent>
          </Card>
        </div>
      )}

      {!announcementsLoading && !announcementsError && (
        <AnnouncementCarousel
          announcements={announcements}
          onSeeAll={() => navigate("/parent/announcements")}
          onMarkRead={handleMarkAnnouncementRead}
          enableListDrawer
        />
      )}

      {eventsLoading && (
        <div className="px-4 py-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Loading events...
            </CardContent>
          </Card>
        </div>
      )}

      {eventsError && !eventsLoading && (
        <div className="px-4 py-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 text-center text-sm text-destructive">
              {eventsError}
            </CardContent>
          </Card>
        </div>
      )}

      {!eventsLoading && !eventsError && (
        <UpcomingEvents events={events} seeAllPath="/parent/calendar" />
      )}
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
