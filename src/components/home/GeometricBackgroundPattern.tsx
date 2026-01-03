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
          {/* Canva-style subtle blue to purple gradient */}
          <linearGradient id="bgGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(210, 60%, 95%)" />
            <stop offset="50%" stopColor="hsl(240, 50%, 96%)" />
            <stop offset="100%" stopColor="hsl(270, 45%, 95%)" />
          </linearGradient>

          {/* Subtle blue patch on left */}
          <radialGradient id="patch1" cx="10%" cy="20%" r="50%">
            <stop offset="0%" stopColor="hsl(200, 70%, 92%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Subtle purple patch on right */}
          <radialGradient id="patch2" cx="90%" cy="30%" r="50%">
            <stop offset="0%" stopColor="hsl(270, 60%, 93%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Soft lavender blend in center */}
          <radialGradient id="patch3" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="hsl(250, 50%, 94%)" stopOpacity="0.3" />
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