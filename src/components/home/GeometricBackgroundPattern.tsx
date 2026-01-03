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
          {/* Light blue to teal gradient */}
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(200, 70%, 85%)" />
            <stop offset="50%" stopColor="hsl(190, 60%, 80%)" />
            <stop offset="100%" stopColor="hsl(175, 50%, 75%)" />
          </linearGradient>

          {/* Small noise filter */}
          <filter id="noise">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.9" 
              numOctaves="4" 
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.08" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" mode="overlay" />
          </filter>
        </defs>

        {/* Gradient background */}
        <rect width="100%" height="100%" fill="url(#bgGradient)" />
        
        {/* Noise overlay */}
        <rect width="100%" height="100%" filter="url(#noise)" opacity="0.5" />
      </svg>
    </div>
  );
}