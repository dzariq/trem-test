import { cn } from "@/lib/utils";
import { 
  Palette, Trophy, BookOpen, Music, 
  Dumbbell, Mountain, Sparkles, Users,
  type LucideIcon
} from "lucide-react";

interface CcaActivityImageProps {
  imageUrl: string | null | undefined;
  activityName: string;
  category?: string | null;
  typeName?: string | null;
  variant?: "card" | "details";
  className?: string;
}

/**
 * Map category/type name to an appropriate icon
 */
function getCategoryIcon(category: string | null | undefined): LucideIcon {
  const name = (category ?? "").toLowerCase();
  switch (name) {
    case "arts":
    case "art":
      return Palette;
    case "sports":
    case "outdoor":
    case "outdoor cca":
      return Dumbbell;
    case "indoor":
    case "indoor cca":
      return Mountain;
    case "music":
      return Music;
    case "academic":
      return BookOpen;
    case "competition":
      return Trophy;
    case "enrichment":
      return Sparkles;
    default:
      return Users;
  }
}

/**
 * Map category/type to background color class for fallback icon
 */
function getCategoryBgColor(category: string | null | undefined): string {
  const name = (category ?? "").toLowerCase();
  switch (name) {
    case "arts":
    case "art":
      return "bg-pink-100 dark:bg-pink-900/30";
    case "sports":
    case "outdoor":
    case "outdoor cca":
      return "bg-amber-100 dark:bg-amber-900/30";
    case "indoor":
    case "indoor cca":
      return "bg-sky-100 dark:bg-sky-900/30";
    case "music":
      return "bg-violet-100 dark:bg-violet-900/30";
    case "academic":
      return "bg-indigo-100 dark:bg-indigo-900/30";
    case "competition":
      return "bg-rose-100 dark:bg-rose-900/30";
    case "enrichment":
      return "bg-teal-100 dark:bg-teal-900/30";
    default:
      return "bg-muted";
  }
}

/**
 * Map category/type to icon color class
 */
function getCategoryIconColor(category: string | null | undefined): string {
  const name = (category ?? "").toLowerCase();
  switch (name) {
    case "arts":
    case "art":
      return "text-pink-500 dark:text-pink-400";
    case "sports":
    case "outdoor":
    case "outdoor cca":
      return "text-amber-500 dark:text-amber-400";
    case "indoor":
    case "indoor cca":
      return "text-sky-500 dark:text-sky-400";
    case "music":
      return "text-violet-500 dark:text-violet-400";
    case "academic":
      return "text-indigo-500 dark:text-indigo-400";
    case "competition":
      return "text-rose-500 dark:text-rose-400";
    case "enrichment":
      return "text-teal-500 dark:text-teal-400";
    default:
      return "text-muted-foreground/60";
  }
}

/**
 * Displays a CCA activity image or a category-based fallback icon.
 * 
 * - When `imageUrl` is provided: Shows the image
 * - When no image: Shows a colored icon based on category/type
 */
export function CcaActivityImage({
  imageUrl,
  activityName,
  category,
  typeName,
  variant = "card",
  className,
}: CcaActivityImageProps) {
  const categoryKey = typeName || category;
  const Icon = getCategoryIcon(categoryKey);
  const bgColor = getCategoryBgColor(categoryKey);
  const iconColor = getCategoryIconColor(categoryKey);
  
  const sizeClasses = variant === "card" 
    ? "w-16 h-16 rounded-lg" 
    : "w-full h-32 rounded-xl";
  
  const iconSize = variant === "card" ? "h-8 w-8" : "h-12 w-12";

  if (imageUrl) {
    return (
      <div className={cn(sizeClasses, "overflow-hidden flex-shrink-0", className)}>
        <img
          src={imageUrl}
          alt={activityName}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide broken image - parent will re-render with fallback
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Fallback: Icon with category-colored background
  return (
    <div 
      className={cn(
        sizeClasses,
        bgColor,
        "flex items-center justify-center flex-shrink-0",
        className
      )}
    >
      <Icon className={cn(iconSize, iconColor)} />
    </div>
  );
}
