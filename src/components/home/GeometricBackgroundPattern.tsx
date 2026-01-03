import { cn } from "@/lib/utils";

interface GeometricBackgroundPatternProps {
  className?: string;
}

export function GeometricBackgroundPattern({ className }: GeometricBackgroundPatternProps) {
  return (
    <div 
      className={cn(
        "absolute inset-x-0 top-0 bottom-0 overflow-hidden pointer-events-none z-0",
        className
      )}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Almost white base with very subtle color hints */}
          <linearGradient id="bgGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 0%, 100%)" />
            <stop offset="40%" stopColor="hsl(195, 30%, 98%)" />
            <stop offset="70%" stopColor="hsl(180, 25%, 97%)" />
            <stop offset="100%" stopColor="hsl(175, 20%, 98%)" />
          </linearGradient>

          {/* Very subtle blue hint */}
          <radialGradient id="patch1" cx="15%" cy="25%" r="45%">
            <stop offset="0%" stopColor="hsl(200, 40%, 95%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Very subtle teal hint */}
          <radialGradient id="patch2" cx="80%" cy="65%" r="40%">
            <stop offset="0%" stopColor="hsl(175, 35%, 94%)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Another subtle light blue patch */}
          <radialGradient id="patch3" cx="50%" cy="90%" r="50%">
            <stop offset="0%" stopColor="hsl(190, 30%, 96%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* White to very light color base */}
        <rect width="100%" height="100%" fill="url(#bgGradient1)" />
        
        {/* Very subtle color patches */}
        <rect width="100%" height="100%" fill="url(#patch1)" />
        <rect width="100%" height="100%" fill="url(#patch2)" />
        <rect width="100%" height="100%" fill="url(#patch3)" />
      </svg>
    </div>
  );
}