import { useState, useMemo, type KeyboardEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin } from "lucide-react";
import type { UpcomingEvent } from "@/data/calendar";
import type { UpcomingCcaSession } from "@/hooks/useUpcomingCcaSessions";
import { getEventBadgeColor, getEventBadgeLabel } from "@/lib/calendarUtils";
import { getCcaTypePillColor, getCcaBucketIcon, getCcaBucket } from "@/components/cca/CcaTypeTabs";
import {
  UPCOMING_TABS,
  UPCOMING_TAB_COLORS,
  filterByUpcomingTab,
  formatDateRange,
  getDaysDuration,
  type UpcomingTab,
} from "@/lib/calendarFilters";
import { cn } from "@/lib/utils";

interface UpcomingEventsSectionProps {
  events: UpcomingEvent[];
  ccaSessions?: UpcomingCcaSession[];
  onEventClick: (event: UpcomingEvent, el?: HTMLElement | null) => void;
  onCcaSessionClick?: (session: UpcomingCcaSession, el?: HTMLElement | null) => void;
}

/**
 * Upcoming events section with tab switcher (Highlights | Exams | Holidays | CCA).
 * - Only shows future events (end_date >= today)
 * - Multi-day events render as single card with date range
 * - CCA sessions render with a distinct filled-primary visual treatment
 */
export function UpcomingEventsSection({ events, ccaSessions = [], onEventClick, onCcaSessionClick }: UpcomingEventsSectionProps) {
  const [activeTab, setActiveTab] = useState<UpcomingTab>("events");

  const filteredEvents = useMemo(
    () => filterByUpcomingTab(events, activeTab),
    [events, activeTab]
  );

  const sortedCcaSessions = useMemo(
    () => [...ccaSessions].sort((a, b) => a.sessionDate.localeCompare(b.sessionDate)),
    [ccaSessions]
  );

  const handleEventKeyDown = (e: KeyboardEvent<HTMLDivElement>, event: UpcomingEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEventClick(event, e.currentTarget);
    }
  };

  const handleCcaKeyDown = (e: KeyboardEvent<HTMLDivElement>, session: UpcomingCcaSession) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCcaSessionClick?.(session, e.currentTarget);
    }
  };

  const formatTimeRange = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return "All Day";
    const fmt = (t: string) => {
      const [h, m] = t.split(":");
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };
    return endTime ? `${fmt(startTime)} - ${fmt(endTime)}` : fmt(startTime);
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">What's Coming Up</CardTitle>
      </CardHeader>

      {/* Tab switcher */}
      <div className="px-4 pb-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UpcomingTab)}>
          <TabsList className="grid w-full grid-cols-4 h-8 p-0.5 bg-muted/60 rounded-lg gap-0.5">
            {UPCOMING_TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              let activeClass = "";
              if (isActive) {
                if (tab.value === "events") activeClass = "bg-purple-500 text-white shadow-sm";
                else if (tab.value === "exams") activeClass = "bg-red-500 text-white shadow-sm";
                else if (tab.value === "holidays") activeClass = "bg-green-600 text-white shadow-sm";
                else if (tab.value === "cca") activeClass = "bg-primary text-primary-foreground shadow-sm";
              }
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "text-xs font-medium h-7 rounded-md transition-colors data-[state=active]:shadow-sm",
                    isActive ? activeClass : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      <CardContent className="space-y-3 pt-0">
        {activeTab === "cca" ? (
          <>
            {sortedCcaSessions.map((session) => {
              const [sY, sM, sD] = session.sessionDate.split("-").map(Number);
              const date = new Date(sY, sM - 1, sD);
              const timeLabel = formatTimeRange(session.startTime, session.endTime);
              const bucketKey = session.kind || session.category;
              const bucket = getCcaBucket(bucketKey);
              const pillClass = getCcaTypePillColor(bucketKey);
              const Icon = getCcaBucketIcon(bucket);
              return (
                <div
                  key={session.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    pillClass,
                  )}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => onCcaSessionClick?.(session, e.currentTarget)}
                  onKeyDown={(e) => handleCcaKeyDown(e, session)}
                >
                  {/* Filled date box (inverse of regular events) */}
                  <div className={cn(
                    "flex flex-col items-center justify-center rounded-xl w-16 h-16 flex-shrink-0 shadow-sm border",
                    pillClass,
                  )}>
                    <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                    <span className="text-xs uppercase mt-0.5">
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      <h3 className="font-medium truncate">
                        {session.customTitle || session.activityName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm opacity-90">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeLabel}
                      </span>
                    </div>
                    {session.locationName && (
                      <div className="flex items-center gap-1 text-sm opacity-90 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {session.locationName}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {sortedCcaSessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming CCA sessions</p>
            )}
          </>
        ) : (
          <>
        {filteredEvents.map((event) => {
          const isMultiDay = event.startDay !== event.endDay;
          const [sY, sM, sD] = event.startDay.split("-").map(Number);
          const eventDate = new Date(sY, sM - 1, sD);

          return (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={(e) => onEventClick(event, e.currentTarget)}
              onKeyDown={(e) => handleEventKeyDown(e, event)}
            >
              {/* Date box - enlarged */}
              <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-xl w-16 h-16 flex-shrink-0">
                <span className="text-lg font-bold leading-none">{eventDate.getDate()}</span>
                <span className="text-xs uppercase mt-0.5">
                  {eventDate.toLocaleDateString("en-US", { month: "short" })}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{event.title}</h3>

                {isMultiDay ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <span>{formatDateRange(event.startDay, event.endDay)}</span>
                    <span className="text-xs opacity-70">
                      ({getDaysDuration(event.startDay, event.endDay)} days)
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-1">
                    {event.allDay ? "All Day" : event.time || "—"}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {(event.tags && event.tags.length > 0
                    ? event.tags.slice(0, 2)
                    : event.category
                      ? [event.category as any]
                      : []
                  ).map((tag, idx) => {
                    let displayText = getEventBadgeLabel(tag, event.category);
                    if (displayText.toUpperCase() === "HOLIDAY") displayText = "Holidays";
                    return (
                      <Badge
                        key={`${tag}-${idx}`}
                        className={`text-xs border-transparent ${getEventBadgeColor(tag, event.category, (event as any).eventType)}`}
                      >
                        {displayText}
                      </Badge>
                    );
                  })}
                  {event.tags && event.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{event.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No events found</p>
        )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
