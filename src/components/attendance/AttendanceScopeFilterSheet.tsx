import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter, RotateCcw } from "lucide-react";
import { cn, stripCampusPrefix } from "@/lib/utils";
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
  const [draftScope, setDraftScope] = useState<AttendanceScope>(filter.scope);
  const [draftCohort, setDraftCohort] = useState<string | null>(filter.selectedCohort);
  const [draftClasses, setDraftClasses] = useState<string[]>(filter.selectedClassNames);

  // Sync draft with current filter when sheet opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setDraftScope(filter.scope);
      setDraftCohort(filter.selectedCohort);
      setDraftClasses(filter.selectedClassNames);
    }
    onOpenChange(open);
  };

  const handleApply = () => {
    filter.setScope(draftScope);
    filter.setSelectedCohort(draftCohort);
    filter.setSelectedClassNames(draftClasses);
    onOpenChange(false);
  };

  const handleReset = () => {
    setDraftScope("school");
    setDraftCohort(null);
    setDraftClasses([]);
  };

  const toggleClass = (name: string) => {
    setDraftClasses((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const selectAll = () => {
    setDraftClasses(filter.availableClasses.map((c) => c.class_name));
  };

  const clearAll = () => {
    setDraftClasses([]);
  };

  // Group classes by year_level for better display
  const classesByCohort = filter.availableClasses.reduce<
    Record<string, { id: number; class_name: string }[]>
  >((acc, cls) => {
    if (!acc[cls.year_level]) acc[cls.year_level] = [];
    acc[cls.year_level].push(cls);
    return acc;
  }, {});

  return (
    <BottomSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={
        <>
          <Filter className="h-4 w-4" />
          Attendance Scope
        </>
      }
      description="Filter attendance data by scope"
      snapPoints={[0, 0.65, 1]}
      defaultSnapPoint={0.65}
    >
      <div className="px-4 py-3 space-y-5">
        {/* Scope Selector */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Scope</Label>
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
            {(["school", "cohort", "class"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setDraftScope(s)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all capitalize",
                  draftScope === s
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s === "school" ? "Whole School" : s === "cohort" ? "Cohort" : "Class"}
              </button>
            ))}
          </div>
        </div>

        {/* Cohort Selector */}
        {draftScope === "cohort" && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Select Cohort</Label>
            <Select
              value={draftCohort ?? ""}
              onValueChange={(v) => setDraftCohort(v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a year group" />
              </SelectTrigger>
              <SelectContent>
                {filter.availableCohorts.map((cohort) => (
                  <SelectItem key={cohort} value={cohort}>
                    {cohort}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Class Multi-Select */}
        {draftScope === "class" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Select Classes</Label>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
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
                {draftClasses.map((name) => (
                  <Badge
                    key={name}
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() => toggleClass(name)}
                  >
                    {stripCampusPrefix(name)} ×
                  </Badge>
                ))}
              </div>
            )}

            <ScrollArea className="max-h-[200px]">
              <div className="space-y-3">
                {Object.entries(classesByCohort)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([yearLevel, classes]) => (
                    <div key={yearLevel}>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                        {yearLevel}
                      </p>
                      <div className="space-y-1">
                        {classes.map((cls) => (
                          <label
                            key={cls.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={draftClasses.includes(cls.class_name)}
                              onCheckedChange={() => toggleClass(cls.class_name)}
                            />
                            <span className="text-sm font-medium">{stripCampusPrefix(cls.class_name)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            Apply
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
