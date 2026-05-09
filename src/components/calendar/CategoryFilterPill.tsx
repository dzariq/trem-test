import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORY_DISPLAY_NAMES, type TagCategory, type CalendarTag } from "@/types/calendarTags";
import {
  CATEGORY_SUBTYPES,
  CATEGORIES_WITH_DROPDOWN,
  CATEGORY_PILL_STYLES,
} from "@/lib/calendarCategorySubtypes";
import { cn } from "@/lib/utils";

interface CategoryFilterPillProps {
  category: TagCategory;
  isSelected: boolean;
  selectedSubtypes: (CalendarTag | "all")[];
  onToggleCategory: (category: TagCategory) => void;
  onSubtypeChange: (category: TagCategory, subtypes: (CalendarTag | "all")[]) => void;
}

export function CategoryFilterPill({
  category,
  isSelected,
  selectedSubtypes,
  onToggleCategory,
  onSubtypeChange,
}: CategoryFilterPillProps) {
  const [open, setOpen] = useState(false);
  const hasDropdown = CATEGORIES_WITH_DROPDOWN.includes(category);
  const subtypeOptions = CATEGORY_SUBTYPES[category] || [];
  const pillStyle = CATEGORY_PILL_STYLES[category];
  const displayName = CATEGORY_DISPLAY_NAMES[category];

  // Get current label - show first subtype name if not "all", or count if multiple
  const getDisplayLabel = () => {
    if (!isSelected || selectedSubtypes.length === 0 || selectedSubtypes.includes("all")) {
      return displayName;
    }
    if (selectedSubtypes.length === 1) {
      const opt = subtypeOptions.find((o) => o.value === selectedSubtypes[0]);
      return opt?.label || displayName;
    }
    // Multiple selected - show category name with count
    return `${displayName} (${selectedSubtypes.length})`;
  };

  const handleItemClick = (value: CalendarTag | "all") => {
    if (value === "all") {
      // Clicking "All" selects the category with all subtypes
      onSubtypeChange(category, ["all"]);
    } else {
      // Remove "all" if present, then toggle this specific subtype
      const withoutAll = selectedSubtypes.filter((s) => s !== "all");
      
      if (withoutAll.includes(value)) {
        // Already selected - remove it
        const newSelection = withoutAll.filter((s) => s !== value);
        // If nothing left, revert to "all"
        onSubtypeChange(category, newSelection.length > 0 ? newSelection : ["all"]);
      } else {
        // Add to selection
        onSubtypeChange(category, [...withoutAll, value]);
      }
    }
    // Keep dropdown open for multi-select
  };

  const isItemSelected = (value: CalendarTag | "all") => {
    if (value === "all") {
      return selectedSubtypes.includes("all") || selectedSubtypes.length === 0;
    }
    return selectedSubtypes.includes(value);
  };

  // Handle pill click (not dropdown) - toggle category selection
  const handlePillClick = () => {
    onToggleCategory(category);
  };

  if (hasDropdown) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
              pillStyle,
              isSelected ? "ring-2 ring-primary/30" : "opacity-60"
            )}
            onClick={(e) => {
              // If not selected, clicking the pill toggles it on
              if (!isSelected) {
                e.preventDefault();
                handlePillClick();
              }
              // If already selected, let the dropdown open
            }}
          >
            <span className="truncate max-w-[90px]">{getDisplayLabel()}</span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          sideOffset={6} 
          className="min-w-[220px] max-h-[300px] overflow-y-auto bg-card border-border z-50"
        >
          {subtypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleItemClick(option.value)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors",
                isItemSelected(option.value) && "bg-accent/50"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border border-primary",
                  isItemSelected(option.value) ? "bg-primary text-primary-foreground" : "bg-transparent"
                )}
              >
                {isItemSelected(option.value) && <Check className="h-3 w-3" />}
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Simple button for categories without dropdown (like school-level)
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
        pillStyle,
        isSelected ? "ring-2 ring-primary/30" : "opacity-60"
      )}
      onClick={handlePillClick}
    >
      {displayName}
    </button>
  );
}
