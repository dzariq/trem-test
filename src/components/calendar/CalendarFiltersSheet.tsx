import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TagCategory, CalendarTag } from "@/types/calendarTags";
import { CATEGORY_DISPLAY_NAMES } from "@/types/calendarTags";
import {
  CATEGORY_SUBTYPES,
  CATEGORIES_WITH_DROPDOWN,
  CATEGORY_PILL_STYLES,
} from "@/lib/calendarCategorySubtypes";

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
  const [expanded, setExpanded] = useState<TagCategory | null>(null);

  const reset = () => {
    setIsAllSelected(true);
    setCategoryFilters({} as Record<TagCategory, (CalendarTag | "all")[]>);
    setExpanded(null);
  };

  const toggleCategory = (cat: TagCategory) => {
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
  };

  const setSubtypes = (cat: TagCategory, next: (CalendarTag | "all")[]) => {
    setIsAllSelected(false);
    setCategoryFilters((prev) => ({ ...prev, [cat]: next }));
  };

  const handleSubtypeClick = (cat: TagCategory, value: CalendarTag | "all") => {
    const current = categoryFilters[cat] || [];
    if (value === "all") {
      setSubtypes(cat, ["all"]);
      return;
    }
    const withoutAll = current.filter((s) => s !== "all");
    if (withoutAll.includes(value)) {
      const next = withoutAll.filter((s) => s !== value);
      setSubtypes(cat, next.length > 0 ? next : ["all"]);
    } else {
      setSubtypes(cat, [...withoutAll, value]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="z-[100] rounded-t-2xl h-[75dvh] flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-2 shrink-0">
          <SheetTitle>Filter events</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <button
            type="button"
            className={cn(
              "inline-flex items-center min-h-11 rounded-full px-4 text-xs font-medium border transition-colors mb-3 [touch-action:manipulation]",
              isAllSelected
                ? "bg-foreground text-background border-foreground"
                : "bg-muted/40 text-muted-foreground border-border",
            )}
            onClick={reset}
          >
            All categories
          </button>

          <div className="flex flex-col gap-2">
            {availableCategories.map((category) => {
              const subtypes = categoryFilters[category] || [];
              const isSelected = subtypes.length > 0;
              const hasDropdown = CATEGORIES_WITH_DROPDOWN.includes(category);
              const subtypeOptions = CATEGORY_SUBTYPES[category] || [];
              const pillStyle = CATEGORY_PILL_STYLES[category];
              const displayName = CATEGORY_DISPLAY_NAMES[category];
              const isOpen = expanded === category;

              const isItemSelected = (value: CalendarTag | "all") => {
                if (value === "all") {
                  return subtypes.includes("all") || subtypes.length === 0;
                }
                return subtypes.includes(value);
              };

              return (
                <div
                  key={category}
                  className={cn(
                    "rounded-xl border border-border bg-card transition-colors",
                    isSelected && "border-primary/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        "inline-flex items-center gap-1 min-h-11 rounded-full px-4 text-xs font-medium border transition-colors [touch-action:manipulation]",
                        pillStyle,
                        isSelected ? "ring-2 ring-primary/30" : "opacity-70",
                      )}
                    >
                      {displayName}
                    </button>

                    {hasDropdown && (
                      <button
                        type="button"
                        aria-label={`Toggle ${displayName} subtypes`}
                        onClick={() => setExpanded(isOpen ? null : category)}
                        className="inline-flex items-center justify-center h-11 w-11 rounded-full hover:bg-muted transition-colors text-muted-foreground [touch-action:manipulation]"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {hasDropdown && isOpen && (
                    <div className="px-2 pb-2 pt-1 border-t border-border/60">
                      <div className="flex flex-col gap-1">
                        {subtypeOptions.map((option) => {
                          const selected = isItemSelected(option.value);
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleSubtypeClick(category, option.value)}
                              className={cn(
                                "flex w-full items-center gap-2 px-2 py-2 text-sm rounded-md text-left hover:bg-accent transition-colors",
                                selected && "bg-accent/60",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-4 w-4 items-center justify-center rounded border border-primary shrink-0",
                                  selected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-transparent",
                                )}
                              >
                                {selected && <Check className="h-3 w-3" />}
                              </span>
                              <span className="truncate">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-6 py-3 border-t border-border bg-background shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
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