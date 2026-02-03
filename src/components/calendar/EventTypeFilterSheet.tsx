import { useState, useCallback } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, Check } from "lucide-react";
import {
  EVENT_TYPE_FILTERS,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  type EventTypeFilter,
} from "@/lib/calendarFilters";

interface EventTypeFilterSheetProps {
  selectedTypes: EventTypeFilter[];
  onApply: (types: EventTypeFilter[]) => void;
}

/**
 * Bottom sheet with multi-select pills for event type visibility.
 * Triggered by a filter icon pill next to the calendar.
 * Changes are local UI state only - no DB writes.
 */
export function EventTypeFilterSheet({ selectedTypes, onApply }: EventTypeFilterSheetProps) {
  const [open, setOpen] = useState(false);
  // Local draft so user can toggle without immediate re-render of calendar
  const [draft, setDraft] = useState<EventTypeFilter[]>(selectedTypes);

  const handleOpen = useCallback(() => {
    setDraft(selectedTypes);
    setOpen(true);
  }, [selectedTypes]);

  const toggle = (type: EventTypeFilter) => {
    setDraft((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleApply = () => {
    onApply(draft);
    setOpen(false);
  };

  const activeCount = selectedTypes.length;

  return (
    <>
      {/* Trigger pill */}
      <Badge
        variant="outline"
        className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 h-auto"
        onClick={handleOpen}
      >
        <Filter className="h-3.5 w-3.5" />
        <span>Filter</span>
        {activeCount > 0 && activeCount < EVENT_TYPE_FILTERS.length && (
          <span className="ml-0.5 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </Badge>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        snapPoints={[0, 0.75, 1]}
        defaultSnapPoint={0.75}
        title="Filter Event Types"
        description="Select which event types to show on the calendar"
        bodyClassName="px-4 py-3 space-y-4"
      >
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPE_FILTERS.map((type) => {
            const isSelected = draft.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggle(type)}
                className={
                  `inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all border ${
                    isSelected
                      ? `${EVENT_TYPE_COLORS[type]} border-transparent`
                      : "bg-muted/30 text-muted-foreground border-border"
                  }`
                }
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
                {EVENT_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>

        <Button onClick={handleApply} className="w-full">
          Apply Filters
        </Button>
      </BottomSheet>
    </>
  );
}
