import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useCcaTypes, type CcaType } from "@/hooks/useCcaTypes";

interface CcaTypeTabsProps {
  selectedTypeId: string; // "all" or type_id
  onSelectType: (typeId: string) => void;
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

  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {/* Always include "All" tab */}
      <Badge
        variant={selectedTypeId === "all" ? "default" : "outline"}
        className="cursor-pointer"
        onClick={() => onSelectType("all")}
      >
        All
      </Badge>
      
      {/* Dynamic tabs from backend */}
      {types.map((type) => (
        <Badge
          key={type.id}
          variant={selectedTypeId === type.id ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onSelectType(type.id)}
        >
          {type.name}
        </Badge>
      ))}
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
