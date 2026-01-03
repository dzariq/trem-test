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
          {/* Very light pastel base */}
          <linearGradient id="bgGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(190, 40%, 97%)" />
            <stop offset="50%" stopColor="hsl(180, 35%, 96%)" />
            <stop offset="100%" stopColor="hsl(175, 30%, 95%)" />
          </linearGradient>

          {/* Subtle color patches for organic variation */}
          <radialGradient id="patch1" cx="20%" cy="30%" r="40%">
            <stop offset="0%" stopColor="hsl(195, 50%, 94%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="patch2" cx="75%" cy="60%" r="35%">
            <stop offset="0%" stopColor="hsl(175, 45%, 93%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="patch3" cx="50%" cy="80%" r="45%">
            <stop offset="0%" stopColor="hsl(185, 40%, 95%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Base gradient - very light */}
        <rect width="100%" height="100%" fill="url(#bgGradient1)" />
        
        {/* Subtle color patches */}
        <rect width="100%" height="100%" fill="url(#patch1)" />
        <rect width="100%" height="100%" fill="url(#patch2)" />
        <rect width="100%" height="100%" fill="url(#patch3)" />
      </svg>
    </div>
  );
}