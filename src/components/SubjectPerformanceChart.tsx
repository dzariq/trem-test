import { useState, useRef, useMemo, TouchEvent, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceDot,
} from "recharts";

interface SubjectData {
  name: string;
  fullName?: string;
  score: number;
  goal: number;
}

interface SubjectPerformanceChartProps {
  data: SubjectData[];
  lineColors?: string[];
  showGoalBadge?: boolean;
}

// Default colors
const defaultLineColors = [
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

export function SubjectPerformanceChart({
  data,
  lineColors = defaultLineColors,
  showGoalBadge = true,
}: SubjectPerformanceChartProps) {
  // Zoom state - controls how many subjects are visible
  const [zoomLevel, setZoomLevel] = useState<number>(() => Math.min(6, data.length));
  // Scroll offset - which subject index to start from
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  
  // Touch gesture refs
  const initialTouchDistance = useRef<number | null>(null);
  const initialZoomLevel = useRef<number>(6);
  const lastTouchY = useRef<number | null>(null);
  const isScrolling = useRef<boolean>(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Haptic feedback helper
  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (navigator.vibrate) {
      const patterns = { light: 10, medium: 20, heavy: 30 };
      navigator.vibrate(patterns[style]);
    }
  }, []);

  // Get visible subjects based on zoom and scroll
  const visibleData = useMemo(() => {
    const maxOffset = Math.max(0, data.length - zoomLevel);
    const clampedOffset = Math.min(scrollOffset, maxOffset);
    return data.slice(clampedOffset, clampedOffset + zoomLevel);
  }, [data, zoomLevel, scrollOffset]);

  // Touch handlers
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch gesture start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialTouchDistance.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      initialZoomLevel.current = zoomLevel;
      isScrolling.current = false;
      lastTouchY.current = null;
    } else if (e.touches.length === 1) {
      // Single touch - scroll gesture start
      lastTouchY.current = e.touches[0].clientY;
      isScrolling.current = true;
      initialTouchDistance.current = null;
    }
  }, [zoomLevel]);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && initialTouchDistance.current !== null) {
      // Pinch gesture
      e.preventDefault();
      isScrolling.current = false;

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const ratio = currentDistance / initialTouchDistance.current;
      const deadzone = 0.05;

      if (Math.abs(1 - ratio) < deadzone) return;

      const maxSubjects = data.length;
      // Inverted: pinch out (ratio > 1) = show fewer subjects (zoom in)
      // pinch in (ratio < 1) = show more subjects (zoom out)
      const proposed = Math.round(initialZoomLevel.current / ratio);
      const newZoom = Math.max(3, Math.min(maxSubjects, proposed));

      if (newZoom !== zoomLevel) {
        triggerHaptic('medium');
        setZoomLevel(newZoom);
        // Adjust scroll offset to keep centered
        const maxOffset = Math.max(0, data.length - newZoom);
        setScrollOffset(prev => Math.min(prev, maxOffset));
        // Update baseline for continuous pinching
        initialTouchDistance.current = currentDistance;
        initialZoomLevel.current = newZoom;
      }
    } else if (e.touches.length === 1 && isScrolling.current && lastTouchY.current !== null) {
      // Scroll gesture
      const currentY = e.touches[0].clientY;
      const deltaY = lastTouchY.current - currentY;
      const threshold = 30; // pixels to move before scrolling

      if (Math.abs(deltaY) > threshold) {
        const direction = deltaY > 0 ? 1 : -1;
        const maxOffset = Math.max(0, data.length - zoomLevel);
        const newOffset = Math.max(0, Math.min(maxOffset, scrollOffset + direction));
        
        if (newOffset !== scrollOffset) {
          triggerHaptic('light');
          setScrollOffset(newOffset);
        }
        lastTouchY.current = currentY;
      }
    }
  }, [data.length, zoomLevel, scrollOffset, triggerHaptic]);

  const handleTouchEnd = useCallback(() => {
    initialTouchDistance.current = null;
    lastTouchY.current = null;
    isScrolling.current = false;
  }, []);

  // Calculate if we can scroll
  const canScrollUp = scrollOffset > 0;
  const canScrollDown = scrollOffset < data.length - zoomLevel;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          Subject Performance
          {showGoalBadge && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: "hsl(var(--foreground))" }} />
              Goal
            </Badge>
          )}
        </h4>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">
            {scrollOffset + 1}-{Math.min(scrollOffset + zoomLevel, data.length)}/{data.length}
          </span>
          {zoomLevel !== 6 && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setZoomLevel(6);
                setScrollOffset(0);
              }}
              className="text-[10px] text-primary underline ml-1"
            >
              Reset
            </button>
          )}
          {zoomLevel < data.length && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setZoomLevel(data.length);
                setScrollOffset(0);
              }}
              className="text-[10px] text-primary underline ml-1"
            >
              Show all
            </button>
          )}
        </div>
      </div>
      
      {/* Scroll indicator - top */}
      {canScrollUp && (
        <div className="flex justify-center">
          <div className="w-8 h-1 rounded-full bg-muted-foreground/30 animate-pulse" />
        </div>
      )}
      
      <div 
        ref={chartContainerRef}
        className="touch-none select-none relative"
        style={{ 
          height: Math.max(180, visibleData.length * 32),
          WebkitTapHighlightColor: 'transparent'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <BarChart data={visibleData} layout="vertical" margin={{ left: 0, right: 48, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis 
              type="number" 
              domain={[0, 105]}
              ticks={[0, 25, 50, 75, 100]}
              padding={{ right: 24 }}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
              width={75}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))", 
                borderRadius: "8px",
                fontSize: "11px"
              }}
              formatter={(value: number, name: string) => [
                `${value}%`, 
                name === "score" ? "Score" : name === "goal" ? "Goal" : name
              ]}
              trigger="click"
              cursor={false}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {visibleData.map((entry, index) => (
                <Cell key={index} fill={lineColors[(scrollOffset + index) % lineColors.length]} />
              ))}
            </Bar>
            {visibleData.map((entry) => (
              <ReferenceDot
                key={`goal-${entry.name}`}
                x={entry.goal}
                y={entry.name}
                r={4}
                fill="hsl(var(--foreground))"
                stroke="hsl(var(--background))"
                strokeWidth={1}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Scroll indicator - bottom */}
      {canScrollDown && (
        <div className="flex justify-center">
          <div className="w-8 h-1 rounded-full bg-muted-foreground/30 animate-pulse" />
        </div>
      )}
      
      <p className="text-[10px] text-muted-foreground text-center">
        Pinch to zoom • Swipe to scroll
      </p>
    </div>
  );
}
