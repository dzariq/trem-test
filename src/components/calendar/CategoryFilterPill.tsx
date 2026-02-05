import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
  selectedSubtype: CalendarTag | "all";
  onCategorySelect: (category: TagCategory) => void;
  onSubtypeSelect: (category: TagCategory, subtype: CalendarTag | "all") => void;
}

export function CategoryFilterPill({
  category,
  isSelected,
  selectedSubtype,
  onCategorySelect,
  onSubtypeSelect,
}: CategoryFilterPillProps) {
  const hasDropdown = CATEGORIES_WITH_DROPDOWN.includes(category);
  const subtypeOptions = CATEGORY_SUBTYPES[category] || [];
  const pillStyle = CATEGORY_PILL_STYLES[category];
  const displayName = CATEGORY_DISPLAY_NAMES[category];

  // Get current label - show subtype name if not "all"
  const currentLabel =
    selectedSubtype !== "all" && isSelected
      ? subtypeOptions.find((opt) => opt.value === selectedSubtype)?.label || displayName
      : displayName;

  if (hasDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
              pillStyle,
              isSelected ? "ring-2 ring-primary/30" : "opacity-80"
            )}
            onClick={() => onCategorySelect(category)}
          >
            <span className="truncate max-w-[120px]">{currentLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          sideOffset={6} 
          className="min-w-[220px] max-h-[300px] overflow-y-auto bg-card border-border z-50"
        >
          <DropdownMenuRadioGroup
            value={isSelected ? selectedSubtype : "all"}
            onValueChange={(value) => {
              onSubtypeSelect(category, value as CalendarTag | "all");
            }}
          >
            {subtypeOptions.map((option) => (
              <DropdownMenuRadioItem 
                key={option.value} 
                value={option.value}
                className="cursor-pointer"
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Simple button for categories without dropdown (like school-level)
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
        pillStyle,
        isSelected ? "ring-2 ring-primary/30" : "opacity-80"
      )}
      onClick={() => onCategorySelect(category)}
    >
      {displayName}
    </button>
  );
}
