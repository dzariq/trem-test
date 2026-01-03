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
          {/* Light pastel gradient with multiple color stops for organic feel */}
          <linearGradient id="bgGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(195, 80%, 92%)" />
            <stop offset="35%" stopColor="hsl(185, 70%, 88%)" />
            <stop offset="65%" stopColor="hsl(190, 75%, 90%)" />
            <stop offset="100%" stopColor="hsl(180, 65%, 86%)" />
          </linearGradient>

          {/* Overlay gradient for more variation */}
          <radialGradient id="bgGradient2" cx="30%" cy="20%" r="60%">
            <stop offset="0%" stopColor="hsl(200, 85%, 94%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(185, 70%, 90%)" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="bgGradient3" cx="80%" cy="70%" r="50%">
            <stop offset="0%" stopColor="hsl(175, 60%, 88%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(190, 70%, 92%)" stopOpacity="0" />
          </radialGradient>

          {/* Fine noise filter */}
          <filter id="noise">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="1.2" 
              numOctaves="4" 
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.04" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" mode="overlay" />
          </filter>
        </defs>

        {/* Base gradient */}
        <rect width="100%" height="100%" fill="url(#bgGradient1)" />
        
        {/* Random overlay gradients */}
        <rect width="100%" height="100%" fill="url(#bgGradient2)" />
        <rect width="100%" height="100%" fill="url(#bgGradient3)" />
        
        {/* Fine noise overlay */}
        <rect width="100%" height="100%" filter="url(#noise)" opacity="0.4" />
      </svg>
    </div>
  );
}