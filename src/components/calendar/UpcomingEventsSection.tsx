import { useState, useMemo, type KeyboardEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UpcomingEvent } from "@/data/calendar";
import { getTagDisplayName } from "@/lib/calendarUtils";
import { TAG_CATEGORIES } from "@/types/calendarTags";
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
  onEventClick: (event: UpcomingEvent, el?: HTMLElement | null) => void;
}

/**
 * Upcoming events section with tab switcher (Upcoming | Exams | Holidays).
 * - Only shows future events (end_date >= today)
 * - Multi-day events render as single card with date range
 * - Event cards have a colored left indicator based on event type
 */
export function UpcomingEventsSection({ events, onEventClick }: UpcomingEventsSectionProps) {
  const [activeTab, setActiveTab] = useState<UpcomingTab>("events");

  const filteredEvents = useMemo(
    () => filterByUpcomingTab(events, activeTab),
    [events, activeTab]
  );

  const handleEventKeyDown = (e: KeyboardEvent<HTMLDivElement>, event: UpcomingEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEventClick(event, e.currentTarget);
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
      </CardHeader>

      {/* Tab switcher */}
      <div className="px-4 pb-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UpcomingTab)}>
          <TabsList className="grid w-full grid-cols-3 h-9 bg-muted/50">
            {UPCOMING_TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              // Apply color based on tab type when active
              let activeClass = "";
              if (isActive) {
                if (tab.value === "events") activeClass = "bg-purple-500 text-white";
                else if (tab.value === "exams") activeClass = "bg-red-500 text-white";
                else if (tab.value === "holidays") activeClass = "bg-green-600 text-white";
              }
              return (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value} 
                  className={cn(
                    "text-xs transition-colors",
                    isActive && activeClass
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
                  {event.tags.slice(0, 2).map((tag) => {
                    // Match colors to the top calendar filter colors
                    const tagCategory = TAG_CATEGORIES[tag];
                    const category = (event.category || "").toLowerCase();
                    
                    // Determine badge color based on tag category or event.category
                    let badgeColor = "bg-purple-100 text-purple-800"; // default events color
                    let displayText = getTagDisplayName(tag);
                    let isHoliday = false;
                    
                    if (tagCategory === "exams" || category.includes("exam")) {
                      badgeColor = "bg-red-100 text-red-800"; // red like Exams filter
                    } else if (tagCategory === "holidays" || category.includes("holiday")) {
                      badgeColor = "bg-emerald-100 text-emerald-800"; // green like Holidays filter
                      isHoliday = true;
                    } else if (tagCategory === "students" || category.includes("student")) {
                      badgeColor = "bg-teal-100 text-teal-800"; // teal like Students filter
                    } else if (tagCategory === "parents" || category.includes("parent")) {
                      badgeColor = "bg-pink-100 text-pink-800"; // pink like Parents filter
                    }
                    
                    return (
                      <Badge key={tag} className={`text-xs ${badgeColor}`}>
                        {isHoliday ? displayText.toUpperCase() : displayText}
                      </Badge>
                    );
                  })}
                  {event.tags.length > 2 && (
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
      </CardContent>
    </Card>
  );
}
