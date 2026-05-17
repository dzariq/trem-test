import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Bike, PartyPopper, type LucideIcon } from "lucide-react";
import { useCcaTypesByCampus, type CcaType } from "@/hooks/useCcaTypes";
import { cn } from "@/lib/utils";

interface CcaTypeTabsProps {
  selectedTypeId: string; // "all" or type_id
  onSelectType: (typeId: string) => void;
  campusCode?: string | null;
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
export function CcaTypeTabs({ selectedTypeId, onSelectType, campusCode = null }: CcaTypeTabsProps) {
  const { types, loading, error } = useCcaTypesByCampus(campusCode);

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
      return "bg-sky-200 text-sky-900 dark:bg-sky-900/60 dark:text-sky-200";
    case "outdoor":
    case "outdoor cca":
      return "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200";
    case "enrichment":
      return "bg-teal-200 text-teal-900 dark:bg-teal-900/60 dark:text-teal-200";
    case "indoor talks/workshop":
      return "bg-cyan-200 text-cyan-900 dark:bg-cyan-900/60 dark:text-cyan-200";
    case "community service":
      return "bg-lime-200 text-lime-900 dark:bg-lime-900/60 dark:text-lime-200";
    case "event":
    case "events":
      return "bg-fuchsia-200 text-fuchsia-900 dark:bg-fuchsia-900/60 dark:text-fuchsia-200";
    case "other":
      return "bg-slate-200 text-slate-900 dark:bg-slate-800/60 dark:text-slate-200";
    case "competition":
      return "bg-rose-200 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200";
    // Legacy category names
    case "sports":
      return "bg-orange-200 text-orange-900 dark:bg-orange-900/60 dark:text-orange-200";
    case "arts":
      return "bg-pink-200 text-pink-900 dark:bg-pink-900/60 dark:text-pink-200";
    case "academic":
      return "bg-indigo-200 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-200";
    case "club":
    case "clubs":
      return "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200";
    case "music":
      return "bg-violet-200 text-violet-900 dark:bg-violet-900/60 dark:text-violet-200";
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

/**
 * Outline-pill variant for CCA chips inside the calendar grid.
 * Provides a soft tinted background + matching border + text color
 * so CCA chips are visually distinct from solid event chips.
 */
export function getCcaTypePillColor(typeName: string | null | undefined): string {
  return CCA_BUCKET_PILL[getCcaBucket(typeName)];
}

/**
 * Three visual buckets used across calendar surfaces for CCA sessions.
 */
export type CcaBucket = "clubs" | "outdoor" | "events";

export function getCcaBucket(typeName: string | null | undefined): CcaBucket {
  const name = (typeName ?? "").toLowerCase().trim();
  switch (name) {
    case "event":
    case "events":
      return "events";
    case "outdoor":
    case "outdoor cca":
    case "sports":
      return "outdoor";
    default:
      return "clubs";
  }
}

const CCA_BUCKET_PILL: Record<CcaBucket, string> = {
  clubs:
    "bg-yellow-50 text-yellow-800 border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-500/60",
  outdoor:
    "bg-orange-50 text-orange-800 border-orange-400 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-500/60",
  events:
    "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-500/60",
};

const CCA_BUCKET_ICON: Record<CcaBucket, LucideIcon> = {
  clubs: Users,
  outdoor: Bike,
  events: PartyPopper,
};

export function getCcaBucketIcon(bucketOrType: CcaBucket | string | null | undefined): LucideIcon {
  const bucket =
    bucketOrType === "clubs" || bucketOrType === "outdoor" || bucketOrType === "events"
      ? bucketOrType
      : getCcaBucket(bucketOrType);
  return CCA_BUCKET_ICON[bucket];
}
