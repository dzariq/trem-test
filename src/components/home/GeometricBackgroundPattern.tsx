import { cn } from "@/lib/utils";

interface GeometricBackgroundPatternProps {
  className?: string;
}

export function GeometricBackgroundPattern({ className }: GeometricBackgroundPatternProps) {
  return (
    <div 
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none z-0",
        className
      )}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 400 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Soft gradient for leaves */}
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(200, 60%, 70%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(200, 50%, 60%)" stopOpacity="0.04" />
          </linearGradient>
          
          {/* Flower gradient */}
          <linearGradient id="flowerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(200, 55%, 65%)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="hsl(200, 45%, 55%)" stopOpacity="0.03" />
          </linearGradient>

          {/* Circle gradient */}
          <radialGradient id="circleGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(200, 60%, 75%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(200, 50%, 65%)" stopOpacity="0.02" />
          </radialGradient>
        </defs>

        {/* Abstract leaf shapes */}
        <g className="leaves">
          {/* Leaf 1 - Top left */}
          <path
            d="M30 80 Q60 40 90 80 Q60 120 30 80"
            fill="url(#leafGradient)"
            stroke="hsl(200, 50%, 70%)"
            strokeWidth="0.5"
            strokeOpacity="0.1"
          />
          
          {/* Leaf 2 - Top right */}
          <path
            d="M320 50 Q350 20 380 50 Q350 80 320 50"
            fill="url(#leafGradient)"
            stroke="hsl(200, 50%, 70%)"
            strokeWidth="0.5"
            strokeOpacity="0.1"
            transform="rotate(45 350 50)"
          />

          {/* Leaf 3 - Middle left */}
          <path
            d="M10 220 Q50 180 80 220 Q50 260 10 220"
            fill="url(#leafGradient)"
            stroke="hsl(200, 50%, 70%)"
            strokeWidth="0.5"
            strokeOpacity="0.08"
            transform="rotate(-30 45 220)"
          />

          {/* Leaf 4 - Middle right */}
          <path
            d="M340 280 Q370 250 400 280 Q370 310 340 280"
            fill="url(#leafGradient)"
            stroke="hsl(200, 50%, 70%)"
            strokeWidth="0.5"
            strokeOpacity="0.08"
          />

          {/* Leaf 5 - Bottom */}
          <path
            d="M180 520 Q220 480 260 520 Q220 560 180 520"
            fill="url(#leafGradient)"
            stroke="hsl(200, 50%, 70%)"
            strokeWidth="0.5"
            strokeOpacity="0.1"
            transform="rotate(15 220 520)"
          />

          {/* Leaf 6 - Bottom left */}
          <path
            d="M50 450 Q80 420 110 450 Q80 480 50 450"
            fill="url(#leafGradient)"
            stroke="hsl(200, 50%, 70%)"
            strokeWidth="0.5"
            strokeOpacity="0.06"
          />
        </g>

        {/* Abstract flower shapes */}
        <g className="flowers">
          {/* Flower 1 - 6 petal flower top */}
          <g transform="translate(280, 140)">
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="-20"
                rx="8"
                ry="18"
                fill="url(#flowerGradient)"
                stroke="hsl(200, 50%, 70%)"
                strokeWidth="0.3"
                strokeOpacity="0.08"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle cx="0" cy="0" r="6" fill="url(#circleGradient)" />
          </g>

          {/* Flower 2 - Simple 4 petal flower */}
          <g transform="translate(80, 350)">
            {[0, 90, 180, 270].map((angle, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="-15"
                rx="6"
                ry="14"
                fill="url(#flowerGradient)"
                stroke="hsl(200, 50%, 70%)"
                strokeWidth="0.3"
                strokeOpacity="0.06"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle cx="0" cy="0" r="5" fill="url(#circleGradient)" />
          </g>

          {/* Flower 3 - Bottom right */}
          <g transform="translate(350, 480)">
            {[0, 72, 144, 216, 288].map((angle, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="-12"
                rx="5"
                ry="11"
                fill="url(#flowerGradient)"
                stroke="hsl(200, 50%, 70%)"
                strokeWidth="0.3"
                strokeOpacity="0.07"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle cx="0" cy="0" r="4" fill="url(#circleGradient)" />
          </g>
        </g>

        {/* Decorative geometric circles */}
        <g className="circles">
          <circle cx="150" cy="100" r="25" fill="url(#circleGradient)" />
          <circle cx="380" cy="200" r="18" fill="url(#circleGradient)" />
          <circle cx="20" cy="320" r="20" fill="url(#circleGradient)" />
          <circle cx="300" cy="380" r="15" fill="url(#circleGradient)" />
          <circle cx="100" cy="480" r="22" fill="url(#circleGradient)" />
          <circle cx="250" cy="580" r="16" fill="url(#circleGradient)" />
        </g>

        {/* Subtle curved lines */}
        <g className="lines" stroke="hsl(200, 50%, 70%)" strokeOpacity="0.06" fill="none" strokeWidth="1">
          <path d="M0 150 Q100 130 200 160 Q300 190 400 150" />
          <path d="M0 300 Q80 280 160 310 Q240 340 320 300 Q400 260 400 300" />
          <path d="M0 450 Q120 430 240 470 Q360 510 400 450" />
        </g>

        {/* Small decorative dots */}
        <g className="dots" fill="hsl(200, 55%, 65%)" fillOpacity="0.08">
          <circle cx="60" cy="150" r="3" />
          <circle cx="340" cy="100" r="2" />
          <circle cx="200" cy="200" r="2.5" />
          <circle cx="120" cy="280" r="2" />
          <circle cx="280" cy="320" r="3" />
          <circle cx="40" cy="400" r="2" />
          <circle cx="180" cy="420" r="2.5" />
          <circle cx="360" cy="420" r="2" />
          <circle cx="240" cy="500" r="3" />
          <circle cx="320" cy="550" r="2" />
        </g>
      </svg>
    </div>
  );
}
