import { useState, useRef, useMemo, TouchEvent, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { getTinySubjectCode } from "@/data/subjectsConfig";
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
  // Animated zoom level for smooth transitions
  const [animatedZoom, setAnimatedZoom] = useState<number>(() => Math.min(6, data.length));
  // Scroll offset - which subject index to start from
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  // Pinch feedback state
  const [isPinching, setIsPinching] = useState(false);
  const [pinchScale, setPinchScale] = useState(1);
  
  // Touch gesture refs
  const initialTouchDistance = useRef<number | null>(null);
  const initialZoomLevel = useRef<number>(6);
  const lastTouchY = useRef<number | null>(null);
  const isScrolling = useRef<boolean>(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Smooth zoom animation
  useEffect(() => {
    if (animatedZoom !== zoomLevel) {
      const startZoom = animatedZoom;
      const targetZoom = zoomLevel;
      const startTime = performance.now();
      const duration = 200; // ms
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentZoom = startZoom + (targetZoom - startZoom) * eased;
        
        setAnimatedZoom(currentZoom);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [zoomLevel, animatedZoom]);

  // Haptic feedback helper with intensity based on zoom change
  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (navigator.vibrate) {
      const patterns = { light: 8, medium: 15, heavy: 25 };
      navigator.vibrate(patterns[style]);
    }
  }, []);

  // Get visible subjects based on zoom and scroll, with short names for display
  const visibleData = useMemo(() => {
    const effectiveZoom = Math.round(animatedZoom);
    const maxOffset = Math.max(0, data.length - effectiveZoom);
    const clampedOffset = Math.min(scrollOffset, maxOffset);
    return data.slice(clampedOffset, clampedOffset + effectiveZoom).map(item => ({
      ...item,
      displayName: getTinySubjectCode(item.name)
    }));
  }, [data, animatedZoom, scrollOffset]);

  // Touch handlers - only capture pinch gestures, let single finger scroll pass through
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch gesture start - prevent default to capture gesture
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialTouchDistance.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      initialZoomLevel.current = zoomLevel;
      isScrolling.current = false;
      lastTouchY.current = null;
      setIsPinching(true);
      setPinchScale(1);
      triggerHaptic('light');
    }
    // Single touch - don't capture, let page scroll normally
  }, [zoomLevel, triggerHaptic]);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && initialTouchDistance.current !== null) {
      // Pinch gesture only
      e.preventDefault();
      isScrolling.current = false;

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const ratio = currentDistance / initialTouchDistance.current;
      
      // Update visual scale for immediate feedback
      setPinchScale(Math.max(0.8, Math.min(1.2, ratio)));
      
      const deadzone = 0.08;

      if (Math.abs(1 - ratio) < deadzone) return;

      const maxSubjects = data.length;
      // Inverted: pinch out (ratio > 1) = show fewer subjects (zoom in)
      // pinch in (ratio < 1) = show more subjects (zoom out)
      const proposed = Math.round(initialZoomLevel.current / ratio);
      const newZoom = Math.max(3, Math.min(maxSubjects, proposed));

      if (newZoom !== zoomLevel) {
        // Haptic intensity based on zoom change magnitude
        const zoomDiff = Math.abs(newZoom - zoomLevel);
        triggerHaptic(zoomDiff > 2 ? 'heavy' : zoomDiff > 1 ? 'medium' : 'light');
        
        setZoomLevel(newZoom);
        // Adjust scroll offset to keep centered
        const maxOffset = Math.max(0, data.length - newZoom);
        setScrollOffset(prev => Math.min(prev, maxOffset));
        // Update baseline for continuous pinching
        initialTouchDistance.current = currentDistance;
        initialZoomLevel.current = newZoom;
      }
    }
    // Single touch - let page scroll normally (no internal scroll capture)
  }, [data.length, zoomLevel, triggerHaptic]);

  const handleTouchEnd = useCallback(() => {
    initialTouchDistance.current = null;
    lastTouchY.current = null;
    isScrolling.current = false;
    setIsPinching(false);
    setPinchScale(1);
  }, []);

  // Calculate if we can scroll
  const canScrollUp = scrollOffset > 0;
  const canScrollDown = scrollOffset < data.length - zoomLevel;

  // Calculate dynamic height with smooth transition
  const chartHeight = Math.max(220, Math.round(animatedZoom) * 40);

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
              className="text-[10px] text-primary underline ml-1 transition-opacity hover:opacity-70"
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
              className="text-[10px] text-primary underline ml-1 transition-opacity hover:opacity-70"
            >
              Show all
            </button>
          )}
        </div>
      </div>
      
      
      <div 
        ref={chartContainerRef}
        className="select-none relative overflow-hidden rounded-lg"
        style={{ 
          height: chartHeight,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'pan-y',
          transition: isPinching ? 'none' : 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pinch feedback overlay */}
        {isPinching && (
          <div 
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)',
            }}
          >
            <div 
              className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
              style={{
                transform: `scale(${pinchScale})`,
                transition: 'transform 0.05s ease-out',
              }}
            >
              <span className="text-xs font-medium text-primary">
                {zoomLevel < 6 ? '🔍 Zoomed In' : zoomLevel > 6 ? '🔭 Zoomed Out' : '📊 Default'}
              </span>
            </div>
          </div>
        )}
        
        <div
          style={{
            transform: isPinching ? `scale(${0.95 + (pinchScale - 1) * 0.1})` : 'scale(1)',
            transition: isPinching ? 'transform 0.05s ease-out' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: 'center center',
            height: '100%',
          }}
        >
          <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
            <BarChart data={visibleData} layout="vertical" margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
              <XAxis 
                type="number" 
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="displayName" 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                width={55}
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
                labelFormatter={(label) => {
                  const item = visibleData.find(d => d.displayName === label);
                  return item?.name || label;
                }}
                trigger="click"
                cursor={false}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} animationDuration={300} animationEasing="ease-out">
                {visibleData.map((entry, index) => (
                  <Cell key={index} fill={lineColors[(scrollOffset + index) % lineColors.length]} />
                ))}
              </Bar>
              {visibleData.map((entry) => (
                <ReferenceDot
                  key={`goal-${entry.displayName}`}
                  x={entry.goal}
                  y={entry.displayName}
                  r={4}
                  fill="hsl(var(--foreground))"
                  stroke="hsl(var(--background))"
                  strokeWidth={1}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
        <span className="inline-flex items-center gap-0.5">
          <span>👌</span>
          <span>Pinch to zoom</span>
        </span>
        {isPinching && (
          <span className="text-primary animate-pulse">• Zooming...</span>
        )}
      </p>
    </div>
  );
}