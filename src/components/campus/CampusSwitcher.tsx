import { useCampus } from "@/contexts/CampusContext";
import { CampusBadge } from "@/components/campus/CampusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CampusSwitcher() {
  const { campuses, activeCampus, setActiveCampus, isMultiCampus } = useCampus();

  if (!isMultiCampus) return null;

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Active Campus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {campuses.map((campus) => (
            <button
              key={campus.campus_code}
              onClick={() => setActiveCampus(campus.campus_code)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 transition-all",
                activeCampus === campus.campus_code
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <CampusBadge code={campus.campus_code} size="md" />
              <span className="text-sm font-medium text-foreground">{campus.name}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
