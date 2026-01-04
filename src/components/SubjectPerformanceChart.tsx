import { useState, useRef, useMemo, TouchEvent, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { getTinySubjectCode } from "@/data/subjectsConfig";
import { Maximize2, Target } from "lucide-react";
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
  const totalSubjects = data.length;
  const MIN_VISIBLE = 3;
  const FOCUS_COUNT = Math.min(5, totalSubjects);
  
  // Default to showing ALL subjects - user can zoom IN to see fewer
  const [zoomLevel, setZoomLevel] = useState<number>(totalSubjects);
  const [animatedZoom, setAnimatedZoom] = useState<number>(totalSubjects);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  
  // UI feedback states
  const [isPinching, setIsPinching] = useState(false);
  const [pinchScale, setPinchScale] = useState(1);
  const [zoomFeedback, setZoomFeedback] = useState<string | null>(null);
  const [isAtLimit, setIsAtLimit] = useState<'min' | 'max' | null>(null);
  
  // Touch gesture refs
  const initialTouchDistance = useRef<number | null>(null);
  const initialZoomLevel = useRef<number>(totalSubjects);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const swipeStartX = useRef<number | null>(null);

  // Spring animation for smooth zoom transitions
  useEffect(() => {
    if (animatedZoom !== zoomLevel) {
      const startZoom = animatedZoom;
      const targetZoom = zoomLevel;
      const startTime = performance.now();
      const duration = 250;
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Spring-like easing with slight overshoot
        const easeOutBack = (t: number) => {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        };
        
        const eased = easeOutBack(progress);
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

  // Haptic feedback helper
  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (navigator.vibrate) {
      const patterns = { light: 8, medium: 15, heavy: 30 };
      navigator.vibrate(patterns[style]);
    }
  }, []);

  // Show zoom feedback with auto-dismiss
  const showFeedback = useCallback((message: string, limit?: 'min' | 'max') => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setZoomFeedback(message);
    setIsAtLimit(limit || null);
    
    feedbackTimeoutRef.current = setTimeout(() => {
      setZoomFeedback(null);
      setIsAtLimit(null);
    }, 1200);
  }, []);

  // Zoom preset handlers
  const handleShowAll = useCallback(() => {
    if (zoomLevel !== totalSubjects) {
      setZoomLevel(totalSubjects);
      setScrollOffset(0);
      triggerHaptic('medium');
      showFeedback('All subjects');
    }
  }, [zoomLevel, totalSubjects, triggerHaptic, showFeedback]);

  const handleFocusView = useCallback(() => {
    if (zoomLevel !== FOCUS_COUNT) {
      setZoomLevel(FOCUS_COUNT);
      setScrollOffset(0);
      triggerHaptic('medium');
      showFeedback(`Top ${FOCUS_COUNT} subjects`);
    }
  }, [zoomLevel, FOCUS_COUNT, triggerHaptic, showFeedback]);

  // Get visible subjects based on zoom and scroll
  const visibleData = useMemo(() => {
    const effectiveZoom = Math.round(animatedZoom);
    const maxOffset = Math.max(0, data.length - effectiveZoom);
    const clampedOffset = Math.min(scrollOffset, maxOffset);
    return data.slice(clampedOffset, clampedOffset + effectiveZoom).map(item => ({
      ...item,
      displayName: getTinySubjectCode(item.name)
    }));
  }, [data, animatedZoom, scrollOffset]);

  // Touch handlers
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialTouchDistance.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      initialZoomLevel.current = zoomLevel;
      setIsPinching(true);
      setPinchScale(1);
      triggerHaptic('light');
    } else if (e.touches.length === 1 && zoomLevel < totalSubjects) {
      // Single touch for swipe (only when zoomed in)
      swipeStartX.current = e.touches[0].clientX;
    }
  }, [zoomLevel, totalSubjects, triggerHaptic]);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && initialTouchDistance.current !== null) {
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const ratio = currentDistance / initialTouchDistance.current;
      
      // Visual scale feedback
      setPinchScale(Math.max(0.85, Math.min(1.15, ratio)));
      
      const deadzone = 0.08;
      if (Math.abs(1 - ratio) < deadzone) return;

      // REVERSED: Pinch IN (ratio < 1) = show FEWER subjects (zoom in for detail)
      // Pinch OUT (ratio > 1) = show MORE subjects (zoom out to see all)
      const proposed = Math.round(initialZoomLevel.current * ratio);
      const newZoom = Math.max(MIN_VISIBLE, Math.min(totalSubjects, proposed));

      if (newZoom !== zoomLevel) {
        // Check limits
        if (newZoom === MIN_VISIBLE && proposed < MIN_VISIBLE) {
          triggerHaptic('heavy');
          showFeedback('Maximum focus', 'min');
        } else if (newZoom === totalSubjects && proposed > totalSubjects) {
          triggerHaptic('heavy');
          showFeedback('All subjects visible', 'max');
        } else {
          const zoomDiff = Math.abs(newZoom - zoomLevel);
          triggerHaptic(zoomDiff > 2 ? 'heavy' : zoomDiff > 1 ? 'medium' : 'light');
        }
        
        setZoomLevel(newZoom);
        // Adjust scroll offset
        const maxOffset = Math.max(0, data.length - newZoom);
        setScrollOffset(prev => Math.min(prev, maxOffset));
        
        initialTouchDistance.current = currentDistance;
        initialZoomLevel.current = newZoom;
      }
    }
  }, [data.length, zoomLevel, totalSubjects, triggerHaptic, showFeedback]);

  const handleTouchEnd = useCallback((e: TouchEvent<HTMLDivElement>) => {
    // Handle swipe end for scrolling when zoomed in
    if (swipeStartX.current !== null && zoomLevel < totalSubjects && e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - swipeStartX.current;
      const threshold = 50;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX < 0 && scrollOffset + zoomLevel < totalSubjects) {
          setScrollOffset(prev => Math.min(prev + 1, totalSubjects - zoomLevel));
          triggerHaptic('light');
        } else if (deltaX > 0 && scrollOffset > 0) {
          setScrollOffset(prev => Math.max(prev - 1, 0));
          triggerHaptic('light');
        }
      }
      swipeStartX.current = null;
    }
    
    initialTouchDistance.current = null;
    setIsPinching(false);
    setPinchScale(1);
  }, [zoomLevel, totalSubjects, scrollOffset, triggerHaptic]);

  // Dynamic chart height - compact: ~20px per subject instead of 40px
  const chartHeight = Math.max(160, Math.round(animatedZoom) * 20);

  // Generate help text
  const getHelpText = () => {
    if (zoomLevel === totalSubjects) {
      return `All ${totalSubjects} subjects • Pinch in to focus`;
    }
    return `${zoomLevel} of ${totalSubjects} • Swipe to browse • Pinch out for all`;
  };

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
        
        {/* Zoom indicator */}
        <div className="flex items-center gap-2 text-xs">
          {zoomLevel < totalSubjects && (
            <button
              onClick={handleShowAll}
              className="text-primary hover:underline font-medium"
            >
              Reset zoom
            </button>
          )}
          <span className="text-muted-foreground">
            {Math.round((totalSubjects / zoomLevel) * 100)}%
          </span>
        </div>
      </div>
      
      {/* Scroll indicator dots when zoomed in */}
      {zoomLevel < totalSubjects && (
        <div className="flex justify-center gap-1 py-1">
          {Array.from({ length: Math.ceil(totalSubjects / zoomLevel) }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                Math.floor(scrollOffset / zoomLevel) === i
                  ? 'bg-primary w-4'
                  : 'bg-muted-foreground/30 w-1.5'
              }`}
            />
          ))}
        </div>
      )}
      
      <div 
        ref={chartContainerRef}
        className="select-none relative overflow-hidden rounded-lg"
        style={{ 
          height: chartHeight,
          WebkitTapHighlightColor: 'transparent',
          touchAction: zoomLevel < totalSubjects ? 'pan-y' : 'manipulation',
          transition: isPinching ? 'none' : 'height 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Zoom feedback overlay */}
        {zoomFeedback && (
          <div 
            className={`absolute inset-0 pointer-events-none z-10 flex items-center justify-center transition-opacity duration-200`}
          >
            <div className={`px-4 py-2 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm ${
              isAtLimit === 'min' 
                ? 'bg-amber-500/90 text-white animate-pulse' 
                : isAtLimit === 'max'
                ? 'bg-primary/90 text-primary-foreground animate-pulse'
                : 'bg-background/95 text-foreground border border-border'
            }`}>
              {zoomFeedback}
            </div>
          </div>
        )}
        
        {/* Pinch gesture feedback */}
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
                {pinchScale < 1 ? '🔍 Zooming In' : pinchScale > 1 ? '🔭 Zooming Out' : '📊 Adjusting'}
              </span>
            </div>
          </div>
        )}
        
        <div
          style={{
            transform: isPinching ? `scale(${0.97 + (pinchScale - 1) * 0.08})` : 'scale(1)',
            transition: isPinching ? 'transform 0.05s ease-out' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
      
      <p className="text-[10px] text-muted-foreground text-center">
        {getHelpText()}
      </p>
    </div>
  );
}