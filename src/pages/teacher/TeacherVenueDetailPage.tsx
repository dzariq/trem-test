import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, MapPin, Users as UsersIcon, CalendarDays, Clock, Image as ImageIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface VenueRow {
  id: string;
  name: string;
  image_url: string | null;
  capacity: number | null;
  location_notes: string | null;
  venue_type: string | null;
  pic_name: string | null;
}

interface BookingRow {
  id: string;
  title: string | null;
  purpose: string | null;
  start_at: string;
  end_at: string;
  status: string;
  linked_activity_id: string | null;
  activity_name?: string | null;
}

export default function TeacherVenueDetailPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();

  const [venue, setVenue] = useState<VenueRow | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!venueId) return;
    (async () => {
      setLoading(true);
      try {
        const [{ data: v }, { data: b }] = await Promise.all([
          supabase
            .from("venues")
            .select("id, name, image_url, capacity, location_notes, venue_type, pic_name")
            .eq("id", venueId)
            .maybeSingle(),
          supabase
            .from("venue_bookings")
            .select("id, title, purpose, start_at, end_at, status, linked_activity_id, cca_activities!venue_bookings_linked_activity_id_fkey(name)")
            .eq("venue_id", venueId)
            .gte("end_at", new Date().toISOString())
            .neq("status", "rejected")
            .neq("status", "cancelled")
            .order("start_at", { ascending: true })
            .limit(50),
        ]);
        if (cancelled) return;
        setVenue((v as VenueRow) ?? null);
        setBookings(
          (b ?? []).map((row: any) => ({
            id: row.id,
            title: row.title,
            purpose: row.purpose,
            start_at: row.start_at,
            end_at: row.end_at,
            status: row.status,
            linked_activity_id: row.linked_activity_id,
            activity_name: row.cca_activities?.name ?? null,
          })),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [venueId]);

  const grouped = useMemo(() => {
    const map = new Map<string, BookingRow[]>();
    bookings.forEach((b) => {
      const key = format(parseISO(b.start_at), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [bookings]);

  return (
    <TeacherAppLayout>
      <div className="px-4 pt-4 pb-24 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground truncate">
            {venue?.name || "Venue"}
          </h1>
        </div>

        {loading ? (
          <Skeleton className="w-full h-44 rounded-xl" />
        ) : !venue ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Venue not found.
          </div>
        ) : (
          <>
            <Card className="rounded-xl overflow-hidden">
              {venue.image_url && !imgFailed ? (
                <img
                  src={venue.image_url}
                  alt={venue.name}
                  className="w-full h-52 object-cover"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="w-full h-40 bg-muted flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                </div>
              )}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-foreground">{venue.name}</h2>
                  {venue.venue_type && (
                    <Badge variant="outline" className="ml-auto">{venue.venue_type}</Badge>
                  )}
                </div>
                {venue.location_notes && (
                  <p className="text-xs text-muted-foreground">{venue.location_notes}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  {venue.capacity != null && (
                    <span className="flex items-center gap-1">
                      <UsersIcon className="h-3 w-3" /> Capacity {venue.capacity}
                    </span>
                  )}
                  {venue.pic_name && (
                    <span>PIC: {venue.pic_name}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <section className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Upcoming bookings</h3>
                <span className="text-xs text-muted-foreground ml-auto">{bookings.length}</span>
              </div>

              {bookings.length === 0 ? (
                <Card className="rounded-xl">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    No upcoming bookings for this venue.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {grouped.map(([dateKey, items]) => (
                    <div key={dateKey} className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground px-1">
                        {format(parseISO(dateKey), "EEE, dd MMM yyyy")}
                      </div>
                      {items.map((bk) => (
                        <Card key={bk.id} className="rounded-xl">
                          <CardContent className="p-3 flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {bk.title || bk.activity_name || bk.purpose || "Booking"}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(parseISO(bk.start_at), "HH:mm")}–{format(parseISO(bk.end_at), "HH:mm")}
                                </span>
                                {bk.activity_name && bk.title && bk.title !== bk.activity_name && (
                                  <span className="truncate">{bk.activity_name}</span>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant={bk.status === "approved" ? "default" : "outline"}
                              className="shrink-0 capitalize"
                            >
                              {bk.status}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </TeacherAppLayout>
  );
}