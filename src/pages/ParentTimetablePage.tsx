import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";

export default function ParentTimetablePage() {
  return (
    <AppLayout>
      <AppHeader title="Timetable" showBack showNotifications />
      <div className="px-4 py-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-center py-12 gap-3">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <CalendarClock className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Timetable coming soon
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Your child's weekly class schedule will appear here once published by the school.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}