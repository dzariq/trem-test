import { useState, useMemo } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Filter, RotateCcw } from "lucide-react";
import { cn, formatClassDisplay } from "@/lib/utils";
import { sortYearLevels, sortClasses } from "@/lib/classSorting";
import {
  type AttendanceScope,
  type AttendanceScopeFilterState,
} from "@/hooks/useAttendanceScopeFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttendanceScopeFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: AttendanceScopeFilterState;
}

export function AttendanceScopeFilterSheet({
  open,
  onOpenChange,
  filter,
}: AttendanceScopeFilterSheetProps) {
  // Local draft state so changes only apply on "Apply"
  const [wholeSchool, setWholeSchool] = useState<boolean>(filter.scope === "school");
  const [draftCohort, setDraftCohort] = useState<string | null>(filter.selectedCohort);
  const [draftClasses, setDraftClasses] = useState<string[]>(filter.selectedClassNames);

  // Sync draft with current filter when sheet opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setWholeSchool(filter.scope === "school");
      setDraftCohort(filter.selectedCohort);
      setDraftClasses(filter.selectedClassNames);
    }
    onOpenChange(open);
  };

  const handleApply = () => {
    if (wholeSchool) {
      filter.setScope("school");
      filter.setSelectedCohort(null);
      filter.setSelectedClassNames([]);
    } else if (draftClasses.length > 0) {
      filter.setScope("class");
      filter.setSelectedCohort(draftCohort);
      filter.setSelectedClassNames(draftClasses);
    } else if (draftCohort) {
      filter.setScope("cohort");
      filter.setSelectedCohort(draftCohort);
      filter.setSelectedClassNames([]);
    } else {
      filter.setScope("school");
      filter.setSelectedCohort(null);
      filter.setSelectedClassNames([]);
    }
    onOpenChange(false);
  };

  const handleReset = () => {
    setWholeSchool(true);
    setDraftCohort(null);
    setDraftClasses([]);
  };

  const toggleClass = (name: string) => {
    setDraftClasses((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  // Classes available for the selected cohort
  const cohortClasses = useMemo(() => {
    if (!draftCohort) return [];
    const list = filter.availableClasses.filter((c) => c.year_level === draftCohort);
    // Dedupe by display name (stripped of campus prefix) so cross-campus
    // duplicates collapse into one row. Keep all underlying class_names so
    // toggling selects every campus variant.
    const grouped = new Map<string, { id: number; class_names: string[]; display: string }>();
    for (const c of list) {
      const display = formatClassDisplay(c.class_name);
      const existing = grouped.get(display);
      if (existing) {
        existing.class_names.push(c.class_name);
      } else {
        grouped.set(display, { id: c.id, class_names: [c.class_name], display });
      }
    }
    const order = sortClasses(Array.from(grouped.keys()));
    return Array.from(grouped.values()).sort(
      (a, b) => order.indexOf(a.display) - order.indexOf(b.display)
    );
  }, [draftCohort, filter.availableClasses]);

  const selectAllCohort = () => {
    setDraftClasses(cohortClasses.flatMap((c) => c.class_names));
  };

  const clearAll = () => {
    setDraftClasses([]);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Attendance Scope
          </span>
          <Button size="sm" className="h-8 px-4" onClick={handleApply}>
            Apply
          </Button>
        </div>
      }
      description="Filter attendance data by scope"
        snapPoints={[0, 0.9, 1]}
        defaultSnapPoint={0.9}
    >
        <div className="px-4 py-3 pb-24 space-y-5">
        {/* Whole School Yes/No */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Whole School</Label>
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
            {[
              { value: true, label: "Yes" },
              { value: false, label: "No" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => {
                  setWholeSchool(opt.value);
                  if (opt.value) {
                    setDraftCohort(null);
                    setDraftClasses([]);
                  }
                }}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all",
                  wholeSchool === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cohort Selector — visible when not whole-school */}
        {!wholeSchool && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Cohort</Label>
            <Select
              value={draftCohort ?? ""}
              onValueChange={(v) => {
                setDraftCohort(v || null);
                setDraftClasses([]); // reset classes when cohort changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a year group" />
              </SelectTrigger>
              <SelectContent>
                {sortYearLevels(filter.availableCohorts).map((cohort) => (
                  <SelectItem key={cohort} value={cohort}>
                    {cohort}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Leave classes empty to include the whole cohort.
            </p>
          </div>
        )}

        {/* Class Multi-Select — visible when a cohort is chosen */}
        {!wholeSchool && draftCohort && cohortClasses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Classes (optional)</Label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllCohort}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Select all
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <button
                  onClick={clearAll}
                  className="text-xs text-muted-foreground font-medium hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {draftClasses.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {Array.from(new Set(draftClasses.map(formatClassDisplay))).map((display) => (
                  <Badge
                    key={display}
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() =>
                      setDraftClasses((prev) =>
                        prev.filter((n) => formatClassDisplay(n) !== display)
                      )
                    }
                  >
                    {display} ×
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-1">
              {cohortClasses.map((cls) => (
                <label
                  key={cls.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={cls.class_names.every((n) => draftClasses.includes(n))}
                    onCheckedChange={() => {
                      const allSelected = cls.class_names.every((n) => draftClasses.includes(n));
                      setDraftClasses((prev) =>
                        allSelected
                          ? prev.filter((n) => !cls.class_names.includes(n))
                          : Array.from(new Set([...prev, ...cls.class_names]))
                      );
                    }}
                  />
                  <span className="text-sm font-medium">{cls.display}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Reset action */}
        <div className="pt-2">
          <Button variant="outline" className="w-full" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

/** Compact pill to show active filter. Tap to reopen sheet. */
export function AttendanceScopeFilterPill({
  filter,
  onClick,
}: {
  filter: AttendanceScopeFilterState;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
        filter.isFiltered
          ? "bg-primary/10 text-primary border border-primary/20"
          : "bg-muted text-muted-foreground border border-border/50"
      )}
    >
      <Filter className="h-3 w-3" />
      {filter.filterLabel}
    </button>
  );
}
