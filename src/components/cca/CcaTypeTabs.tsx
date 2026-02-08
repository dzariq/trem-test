import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useCcaTypes, type CcaType } from "@/hooks/useCcaTypes";
import { cn } from "@/lib/utils";

interface CcaTypeTabsProps {
  selectedTypeId: string; // "all" or type_id
  onSelectType: (typeId: string) => void;
}

/**
 * Get color classes for CCA type tabs based on selection state.
 * Returns [unselected, selected] classes.
 */
function getTypeTabColors(typeName: string): { light: string; strong: string } {
  const name = typeName.toLowerCase();
  switch (name) {
    case "indoor":
    case "indoor cca":
      return {
        light: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-150",
        strong: "bg-sky-500 text-white border-sky-500",
      };
    case "outdoor":
    case "outdoor cca":
      return {
        light: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-150",
        strong: "bg-amber-500 text-white border-amber-500",
      };
    case "enrichment":
    case "indoor talks/workshop":
      return {
        light: "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-150",
        strong: "bg-teal-500 text-white border-teal-500",
      };
    case "competition":
      return {
        light: "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-150",
        strong: "bg-rose-500 text-white border-rose-500",
      };
    case "sports":
      return {
        light: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-150",
        strong: "bg-orange-500 text-white border-orange-500",
      };
    case "event":
    case "events":
      return {
        light: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-150",
        strong: "bg-purple-500 text-white border-purple-500",
      };
    default:
      return {
        light: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
        strong: "bg-primary text-primary-foreground border-primary",
      };
  }
}

/**
 * Reusable component for CCA type filter tabs.
 * Fetches types from backend and always includes "All" option.
 */
export function CcaTypeTabs({ selectedTypeId, onSelectType }: CcaTypeTabsProps) {
  const { types, loading, error } = useCcaTypes();

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive py-2">
        Failed to load categories
      </div>
    );
  }

  // "All" tab colors
  const allColors = {
    light: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-150",
    strong: "bg-emerald-600 text-white border-emerald-600",
  };
  const isAllSelected = selectedTypeId === "all";

  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {/* Always include "All" tab */}
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer border transition-colors",
          isAllSelected ? allColors.strong : allColors.light
        )}
        onClick={() => onSelectType("all")}
      >
        All
      </Badge>
      
      {/* Dynamic tabs from backend */}
      {types.map((type) => {
        const isSelected = selectedTypeId === type.id;
        const colors = getTypeTabColors(type.name);
        
        return (
          <Badge
            key={type.id}
            variant="outline"
            className={cn(
              "cursor-pointer border transition-colors",
              isSelected ? colors.strong : colors.light
            )}
            onClick={() => onSelectType(type.id)}
          >
            {type.name}
          </Badge>
        );
      })}
    </div>
  );
}

/**
 * Get color class for CCA type by name.
 * Falls back gracefully for unknown types.
 */
export function getCcaTypeColor(typeName: string | null | undefined): string {
  const name = (typeName ?? "").toLowerCase();
  switch (name) {
    // CCA Type categories (Indoor, Outdoor, etc.)
    case "indoor":
    case "indoor cca":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300";
    case "outdoor":
    case "outdoor cca":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300";
    case "enrichment":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300";
    case "competition":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300";
    // Legacy category names
    case "sports":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
    case "arts":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300";
    case "academic":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300";
    case "club":
    case "clubs":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300";
    case "music":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * Get badge color for CCA type (solid variant for upcoming events).
 */
export function getCcaTypeBadgeColor(typeName: string | null | undefined): string {
  const name = (typeName ?? "").toLowerCase();
  switch (name) {
    // CCA Type categories (Indoor, Outdoor, etc.)
    case "indoor":
    case "indoor cca":
      return "bg-sky-500 text-white";
    case "outdoor":
    case "outdoor cca":
      return "bg-amber-500 text-white";
    case "enrichment":
      return "bg-teal-500 text-white";
    case "competition":
      return "bg-rose-500 text-white";
    // Legacy category names
    case "sports":
      return "bg-orange-500 text-white";
    case "arts":
      return "bg-pink-500 text-white";
    case "academic":
      return "bg-indigo-500 text-white";
    case "club":
    case "clubs":
      return "bg-emerald-500 text-white";
    case "music":
      return "bg-violet-500 text-white";
    default:
      return "bg-primary text-primary-foreground";
  }
}
