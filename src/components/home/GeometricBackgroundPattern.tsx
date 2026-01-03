import { cn } from "@/lib/utils";

interface GeometricBackgroundPatternProps {
  className?: string;
}

export function GeometricBackgroundPattern({ className }: GeometricBackgroundPatternProps) {
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
        viewBox="0 0 400 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Soft gradient for leaves - increased opacity */}
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(200, 70%, 65%)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(200, 60%, 55%)" stopOpacity="0.15" />
          </linearGradient>
          
          {/* Flower gradient - increased opacity */}
          <linearGradient id="flowerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(200, 65%, 60%)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="hsl(200, 55%, 50%)" stopOpacity="0.12" />
          </linearGradient>

          {/* Circle gradient - increased opacity */}
          <radialGradient id="circleGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(200, 70%, 70%)" stopOpacity="0.20" />
            <stop offset="100%" stopColor="hsl(200, 60%, 60%)" stopOpacity="0.08" />
          </radialGradient>
        </defs>

        {/* Abstract leaf shapes */}
        <g className="leaves">
          {/* Leaf 1 - Top left */}
          <path
            d="M30 80 Q60 40 90 80 Q60 120 30 80"
            fill="url(#leafGradient)"
            stroke="hsl(200, 60%, 60%)"
            strokeWidth="1"
            strokeOpacity="0.3"
          />
          
          {/* Leaf 2 - Top right */}
          <path
            d="M320 50 Q350 20 380 50 Q350 80 320 50"
            fill="url(#leafGradient)"
            stroke="hsl(200, 60%, 60%)"
            strokeWidth="1"
            strokeOpacity="0.3"
            transform="rotate(45 350 50)"
          />

          {/* Leaf 3 - Middle left */}
          <path
            d="M10 220 Q50 180 80 220 Q50 260 10 220"
            fill="url(#leafGradient)"
            stroke="hsl(200, 60%, 60%)"
            strokeWidth="1"
            strokeOpacity="0.25"
            transform="rotate(-30 45 220)"
          />

          {/* Leaf 4 - Middle right */}
          <path
            d="M340 280 Q370 250 400 280 Q370 310 340 280"
            fill="url(#leafGradient)"
            stroke="hsl(200, 60%, 60%)"
            strokeWidth="1"
            strokeOpacity="0.25"
          />

          {/* Leaf 5 - Bottom */}
          <path
            d="M180 520 Q220 480 260 520 Q220 560 180 520"
            fill="url(#leafGradient)"
            stroke="hsl(200, 60%, 60%)"
            strokeWidth="1"
            strokeOpacity="0.3"
            transform="rotate(15 220 520)"
          />

          {/* Leaf 6 - Bottom left */}
          <path
            d="M50 450 Q80 420 110 450 Q80 480 50 450"
            fill="url(#leafGradient)"
            stroke="hsl(200, 60%, 60%)"
            strokeWidth="1"
            strokeOpacity="0.2"
          />

          {/* Additional leaves for more coverage */}
          <path
            d="M200 150 Q230 110 260 150 Q230 190 200 150"
            fill="url(#leafGradient)"
            stroke="hsl(200, 60%, 60%)"
            strokeWidth="1"
            strokeOpacity="0.28"
          />

          <path
            d="M120 380 Q150 340 180 380 Q150 420 120 380"
            fill="url(#leafGradient)"
            stroke="hsl(200, 60%, 60%)"
            strokeWidth="1"
            strokeOpacity="0.25"
            transform="rotate(20 150 380)"
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
                rx="10"
                ry="22"
                fill="url(#flowerGradient)"
                stroke="hsl(200, 60%, 60%)"
                strokeWidth="0.8"
                strokeOpacity="0.25"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle cx="0" cy="0" r="8" fill="url(#circleGradient)" />
          </g>

          {/* Flower 2 - Simple 4 petal flower */}
          <g transform="translate(80, 350)">
            {[0, 90, 180, 270].map((angle, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="-18"
                rx="8"
                ry="18"
                fill="url(#flowerGradient)"
                stroke="hsl(200, 60%, 60%)"
                strokeWidth="0.8"
                strokeOpacity="0.22"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle cx="0" cy="0" r="7" fill="url(#circleGradient)" />
          </g>

          {/* Flower 3 - Bottom right */}
          <g transform="translate(350, 480)">
            {[0, 72, 144, 216, 288].map((angle, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="-15"
                rx="7"
                ry="15"
                fill="url(#flowerGradient)"
                stroke="hsl(200, 60%, 60%)"
                strokeWidth="0.8"
                strokeOpacity="0.22"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle cx="0" cy="0" r="6" fill="url(#circleGradient)" />
          </g>

          {/* Flower 4 - Top center */}
          <g transform="translate(150, 60)">
            {[0, 72, 144, 216, 288].map((angle, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="-12"
                rx="6"
                ry="12"
                fill="url(#flowerGradient)"
                stroke="hsl(200, 60%, 60%)"
                strokeWidth="0.6"
                strokeOpacity="0.2"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle cx="0" cy="0" r="5" fill="url(#circleGradient)" />
          </g>

          {/* Flower 5 - Middle center */}
          <g transform="translate(320, 350)">
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="-14"
                rx="7"
                ry="14"
                fill="url(#flowerGradient)"
                stroke="hsl(200, 60%, 60%)"
                strokeWidth="0.6"
                strokeOpacity="0.2"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle cx="0" cy="0" r="5" fill="url(#circleGradient)" />
          </g>
        </g>

        {/* Decorative geometric circles */}
        <g className="circles">
          <circle cx="150" cy="100" r="30" fill="url(#circleGradient)" />
          <circle cx="380" cy="200" r="22" fill="url(#circleGradient)" />
          <circle cx="20" cy="320" r="25" fill="url(#circleGradient)" />
          <circle cx="300" cy="380" r="18" fill="url(#circleGradient)" />
          <circle cx="100" cy="480" r="28" fill="url(#circleGradient)" />
          <circle cx="250" cy="580" r="20" fill="url(#circleGradient)" />
          <circle cx="380" cy="450" r="16" fill="url(#circleGradient)" />
          <circle cx="50" cy="180" r="20" fill="url(#circleGradient)" />
        </g>

        {/* Subtle curved lines - increased visibility */}
        <g className="lines" stroke="hsl(200, 60%, 60%)" strokeOpacity="0.18" fill="none" strokeWidth="1.5">
          <path d="M0 150 Q100 130 200 160 Q300 190 400 150" />
          <path d="M0 300 Q80 280 160 310 Q240 340 320 300 Q400 260 400 300" />
          <path d="M0 450 Q120 430 240 470 Q360 510 400 450" />
        </g>

        {/* Small decorative dots - increased size and opacity */}
        <g className="dots" fill="hsl(200, 65%, 55%)" fillOpacity="0.25">
          <circle cx="60" cy="150" r="4" />
          <circle cx="340" cy="100" r="3" />
          <circle cx="200" cy="200" r="3.5" />
          <circle cx="120" cy="280" r="3" />
          <circle cx="280" cy="320" r="4" />
          <circle cx="40" cy="400" r="3" />
          <circle cx="180" cy="420" r="3.5" />
          <circle cx="360" cy="420" r="3" />
          <circle cx="240" cy="500" r="4" />
          <circle cx="320" cy="550" r="3" />
          <circle cx="80" cy="520" r="3.5" />
          <circle cx="160" cy="300" r="3" />
        </g>
      </svg>
    </div>
  );
}
