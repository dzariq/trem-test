import { cn } from "@/lib/utils";

interface GeometricBackgroundPatternProps {
  className?: string;
}

export function GeometricBackgroundPattern({ className }: GeometricBackgroundPatternProps) {
  // Diamond grid pattern with floral motifs inside - based on reference image
  const diamondSize = 80;
  const rows = 10;
  const cols = 6;

  return (
    <div 
      className={cn(
        "absolute inset-x-0 top-16 bottom-0 overflow-hidden pointer-events-none z-0",
        className
      )}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 480 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Light blue gradient for diamond shapes */}
          <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(200, 70%, 70%)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="hsl(200, 60%, 60%)" stopOpacity="0.08" />
          </linearGradient>

          {/* Floral center gradient */}
          <radialGradient id="floralCenterGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(200, 65%, 65%)" stopOpacity="0.20" />
            <stop offset="100%" stopColor="hsl(200, 55%, 55%)" stopOpacity="0.10" />
          </radialGradient>

          {/* Petal gradient */}
          <linearGradient id="petalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(200, 70%, 75%)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(200, 60%, 60%)" stopOpacity="0.12" />
          </linearGradient>

          {/* Diamond shape with floral pattern inside */}
          <symbol id="floralDiamond" viewBox="-40 -40 80 80">
            {/* Diamond outline */}
            <path
              d="M0 -38 L38 0 L0 38 L-38 0 Z"
              fill="none"
              stroke="hsl(200, 55%, 60%)"
              strokeWidth="1"
              strokeOpacity="0.25"
            />
            
            {/* Inner diamond */}
            <path
              d="M0 -28 L28 0 L0 28 L-28 0 Z"
              fill="none"
              stroke="hsl(200, 55%, 65%)"
              strokeWidth="0.8"
              strokeOpacity="0.18"
            />

            {/* Central 8-petal flower */}
            <g>
              {/* Outer petals */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <ellipse
                  key={`outer-${i}`}
                  cx="0"
                  cy="-14"
                  rx="4"
                  ry="10"
                  fill="url(#petalGradient)"
                  stroke="hsl(200, 55%, 60%)"
                  strokeWidth="0.5"
                  strokeOpacity="0.22"
                  transform={`rotate(${angle})`}
                />
              ))}
              
              {/* Inner petals (smaller, rotated) */}
              {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => (
                <ellipse
                  key={`inner-${i}`}
                  cx="0"
                  cy="-8"
                  rx="3"
                  ry="6"
                  fill="url(#petalGradient)"
                  stroke="hsl(200, 55%, 65%)"
                  strokeWidth="0.4"
                  strokeOpacity="0.18"
                  transform={`rotate(${angle})`}
                />
              ))}

              {/* Center circle */}
              <circle 
                cx="0" 
                cy="0" 
                r="5" 
                fill="url(#floralCenterGradient)"
                stroke="hsl(200, 55%, 60%)"
                strokeWidth="0.5"
                strokeOpacity="0.2"
              />
            </g>

            {/* Corner decorative elements - small curved leaves pointing to corners */}
            <g stroke="hsl(200, 55%, 60%)" strokeWidth="0.6" strokeOpacity="0.2" fill="none">
              {/* Top corner leaf */}
              <path d="M0 -24 Q-4 -28 0 -32 Q4 -28 0 -24" />
              {/* Right corner leaf */}
              <path d="M24 0 Q28 -4 32 0 Q28 4 24 0" />
              {/* Bottom corner leaf */}
              <path d="M0 24 Q-4 28 0 32 Q4 28 0 24" />
              {/* Left corner leaf */}
              <path d="M-24 0 Q-28 -4 -32 0 Q-28 4 -24 0" />
            </g>

            {/* Decorative dots at mid-edges */}
            <g fill="hsl(200, 60%, 60%)" fillOpacity="0.22">
              <circle cx="19" cy="-19" r="2" />
              <circle cx="19" cy="19" r="2" />
              <circle cx="-19" cy="19" r="2" />
              <circle cx="-19" cy="-19" r="2" />
            </g>
          </symbol>
        </defs>

        {/* Repeating diamond grid pattern */}
        {Array.from({ length: rows }, (_, row) => 
          Array.from({ length: cols }, (_, col) => {
            // Offset every other row for diamond tessellation
            const xOffset = row % 2 === 0 ? 0 : diamondSize / 2;
            const x = col * diamondSize + xOffset + diamondSize / 2;
            const y = row * diamondSize * 0.7 + diamondSize / 2;
            
            return (
              <use
                key={`diamond-${row}-${col}`}
                href="#floralDiamond"
                x={x - 40}
                y={y - 40}
                width="80"
                height="80"
              />
            );
          })
        ).flat()}
      </svg>
    </div>
  );
}
