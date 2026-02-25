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
  isEnrolled?: boolean;
  /** ISO timestamp for cache-busting (e.g. activity.updatedAt) */
  updatedAt?: string | null;
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
function getCategoryBgColor(isEnrolled: boolean): string {
  // Primary green for enrolled, gray for available
  return isEnrolled 
    ? "bg-primary/20" 
    : "bg-gray-200 dark:bg-gray-700/50";
}

/**
 * Map to icon color based on enrollment status
 */
function getCategoryIconColor(isEnrolled: boolean): string {
  // Primary green for enrolled, gray for available
  return isEnrolled 
    ? "text-primary/60" 
    : "text-gray-400 dark:text-gray-500";
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
  isEnrolled = false,
  updatedAt,
  className,
}: CcaActivityImageProps) {
  const categoryKey = typeName || category;
  const Icon = getCategoryIcon(categoryKey);
  const bgColor = getCategoryBgColor(isEnrolled);
  const iconColor = getCategoryIconColor(isEnrolled);
  
  const sizeClasses = variant === "card" 
    ? "w-16 h-16 rounded-lg" 
    : "w-full h-32 rounded-xl";
  
  const iconSize = variant === "card" ? "h-8 w-8" : "h-12 w-12";

  // Cache-busted image URL
  const resolvedUrl = imageUrl
    ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}v=${updatedAt || '1'}`
    : null;

  if (resolvedUrl) {
    return (
      <div className={cn(sizeClasses, "overflow-hidden flex-shrink-0", className)}>
        <img
          src={resolvedUrl}
          alt={activityName}
          className="w-full h-full object-cover"
          loading="lazy"
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
