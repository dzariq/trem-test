import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CategoryFilterPill } from "./CategoryFilterPill";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TagCategory, CalendarTag } from "@/types/calendarTags";

interface CalendarFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCategories: TagCategory[];
  isAllSelected: boolean;
  categoryFilters: Record<TagCategory, (CalendarTag | "all")[]>;
  setIsAllSelected: (v: boolean) => void;
  setCategoryFilters: React.Dispatch<
    React.SetStateAction<Record<TagCategory, (CalendarTag | "all")[]>>
  >;
}

export function CalendarFiltersSheet({
  open,
  onOpenChange,
  availableCategories,
  isAllSelected,
  categoryFilters,
  setIsAllSelected,
  setCategoryFilters,
}: CalendarFiltersSheetProps) {
  const reset = () => {
    setIsAllSelected(true);
    setCategoryFilters({} as Record<TagCategory, (CalendarTag | "all")[]>);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="z-[100] rounded-t-2xl max-h-[75vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter events</SheetTitle>
        </SheetHeader>

        <div className="flex flex-wrap gap-1.5 mt-4">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
              isAllSelected
                ? "bg-foreground text-background border-foreground"
                : "bg-muted/40 text-muted-foreground border-border",
            )}
            onClick={reset}
          >
            All
          </button>

          {availableCategories.map((category) => {
            const subtypes = categoryFilters[category] || [];
            const isSelected = subtypes.length > 0;

            return (
              <CategoryFilterPill
                key={category}
                category={category}
                isSelected={isSelected}
                selectedSubtypes={subtypes.length > 0 ? subtypes : ["all"]}
                onToggleCategory={(cat) => {
                  setIsAllSelected(false);
                  setCategoryFilters((prev) => {
                    const current = prev[cat] || [];
                    if (current.length > 0) {
                      const newFilters = { ...prev };
                      delete newFilters[cat];
                      if (Object.keys(newFilters).length === 0) {
                        setIsAllSelected(true);
                      }
                      return newFilters;
                    }
                    return { ...prev, [cat]: ["all"] };
                  });
                }}
                onSubtypeChange={(cat, nextSubtypes) => {
                  setIsAllSelected(false);
                  setCategoryFilters((prev) => ({ ...prev, [cat]: nextSubtypes }));
                }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 mt-6">
          <Button type="button" variant="ghost" onClick={reset} className="flex-1">
            Reset
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)} className="flex-1">
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}