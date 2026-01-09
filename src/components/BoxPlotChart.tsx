/**
 * Box & Whisker Chart Component
 * 
 * Renders a custom SVG-based box and whisker plot using Recharts containers.
 * Supports multiple years of data with tooltips showing full statistics.
 * Features pinch-to-zoom for mobile and legend at the top.
 */

import React, { useState, useRef, useMemo } from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { BoxPlotStats } from "@/utils/boxPlotCalculations";

interface BoxPlotChartProps {
  data: BoxPlotStats[];
  showMean?: boolean;
  height?: number;
}

// Custom tooltip for box plot
const BoxPlotTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0]?.payload as BoxPlotStats;
  if (!data) return null;
  
  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 min-w-[160px]">
      <div className="font-semibold text-sm mb-2 pb-1 border-b border-border">{data.year}</div>
      <div className="text-xs text-muted-foreground mb-2">n: {data.n} {data.n === 1 ? "record" : "records"}</div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">High Whisker:</span>
          <span className="font-medium">{data.whiskerHigh}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Q3 (75%):</span>
          <span className="font-medium">{data.q3}</span>
        </div>
        <div className="flex justify-between font-semibold text-foreground">
          <span>Median:</span>
          <span>{data.median}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Q1 (25%):</span>
          <span className="font-medium">{data.q1}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Low Whisker:</span>
          <span className="font-medium">{data.whiskerLow}</span>
        </div>
        <div className="border-t border-border mt-2 pt-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mean:</span>
            <span className="font-medium text-cyan-600">{data.mean}</span>
          </div>
          {data.outlierDetails && data.outlierDetails.length > 0 && (
            <div className="text-amber-600">
              <span className="font-medium">Outliers ({data.outlierDetails.length}):</span>
              <div className="mt-1 space-y-0.5">
                {data.outlierDetails.slice(0, 5).map((outlier, idx) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span className="truncate max-w-[100px]">{outlier.label}</span>
                    <span className="ml-2 font-medium">{outlier.score}</span>
                  </div>
                ))}
                {data.outlierDetails.length > 5 && (
                  <div className="text-[10px] text-muted-foreground">
                    +{data.outlierDetails.length - 5} more...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Single box plot renderer
const BoxPlotShape = ({ 
  x, 
  y, 
  width, 
  data, 
  yScale, 
  showMean,
  isHovered,
  zoomLevel = 1
}: { 
  x: number; 
  y: number; 
  width: number; 
  data: BoxPlotStats; 
  yScale: (value: number) => number;
  showMean: boolean;
  isHovered: boolean;
  zoomLevel?: number;
}) => {
  const boxWidth = Math.min(width * 0.6, zoomLevel > 1 ? 60 : 50);
  const boxX = x + (width - boxWidth) / 2;
  
  const whiskerTop = yScale(data.whiskerHigh);
  const q3Y = yScale(data.q3);
  const medianY = yScale(data.median);
  const q1Y = yScale(data.q1);
  const whiskerBottom = yScale(data.whiskerLow);
  const meanY = showMean ? yScale(data.mean) : 0;
  
  const whiskerWidth = boxWidth * 0.3;
  
  const isLowSample = data.n > 0 && data.n < 5;
  
  // Calculate heights for upper and lower portions of the box
  const upperBoxHeight = medianY - q3Y; // Q3 to Median (green)
  const lowerBoxHeight = q1Y - medianY; // Median to Q1 (red)
  
  // Colors - always bicolor: green for upper (above median), red for lower (below median)
  const upperBoxFill = "hsl(142, 71%, 45%)"; // green
  const lowerBoxFill = "hsl(0, 84%, 60%)"; // red
  const boxStroke = "hsl(215, 16%, 47%)";
  const medianColor = "hsl(215, 25%, 27%)";
  const whiskerColor = "hsl(215, 16%, 47%)";
  const meanColor = "hsl(199, 89%, 48%)";
  const outlierColor = "hsl(280, 70%, 50%)"; // purple for outliers
  
  // Outlier size scales with zoom
  const outlierSize = zoomLevel > 1.5 ? 6 : 4;
  
  return (
    <g className={cn("transition-opacity", isHovered ? "opacity-100" : "opacity-90")}>
      {/* Whisker line (vertical) */}
      <line
        x1={boxX + boxWidth / 2}
        y1={whiskerTop}
        x2={boxX + boxWidth / 2}
        y2={whiskerBottom}
        stroke={whiskerColor}
        strokeWidth={1.5}
      />
      
      {/* Top whisker cap */}
      <line
        x1={boxX + boxWidth / 2 - whiskerWidth}
        y1={whiskerTop}
        x2={boxX + boxWidth / 2 + whiskerWidth}
        y2={whiskerTop}
        stroke={whiskerColor}
        strokeWidth={2}
      />
      
      {/* Bottom whisker cap */}
      <line
        x1={boxX + boxWidth / 2 - whiskerWidth}
        y1={whiskerBottom}
        x2={boxX + boxWidth / 2 + whiskerWidth}
        y2={whiskerBottom}
        stroke={whiskerColor}
        strokeWidth={2}
      />
      
      {/* Upper Box (Median to Q3) - Green */}
      <rect
        x={boxX}
        y={q3Y}
        width={boxWidth}
        height={Math.max(upperBoxHeight, 1)}
        fill={upperBoxFill}
        fillOpacity={0.7}
        stroke={boxStroke}
        strokeWidth={1.5}
        rx={3}
      />
      
      {/* Lower Box (Q1 to Median) - Red */}
      <rect
        x={boxX}
        y={medianY}
        width={boxWidth}
        height={Math.max(lowerBoxHeight, 1)}
        fill={lowerBoxFill}
        fillOpacity={0.7}
        stroke={boxStroke}
        strokeWidth={1.5}
        rx={3}
      />
      
      {/* Median line */}
      <line
        x1={boxX}
        y1={medianY}
        x2={boxX + boxWidth}
        y2={medianY}
        stroke={medianColor}
        strokeWidth={3}
      />
      
      {/* Mean marker (diamond) */}
      {showMean && (
        <polygon
          points={`
            ${boxX + boxWidth / 2},${meanY - 5}
            ${boxX + boxWidth / 2 + 5},${meanY}
            ${boxX + boxWidth / 2},${meanY + 5}
            ${boxX + boxWidth / 2 - 5},${meanY}
          `}
          fill={meanColor}
          stroke="white"
          strokeWidth={1}
        />
      )}
      
      {/* Outliers with labels */}
      {data.outlierDetails && data.outlierDetails.map((outlier, idx) => {
        const cy = yScale(outlier.score);
        // Shorten label for display (first name or first 8 chars)
        const shortLabel = outlier.label.split(' ')[0].substring(0, 8);
        
        return (
          <g key={idx}>
            <circle
              cx={boxX + boxWidth / 2}
              cy={cy}
              r={outlierSize}
              fill={outlierColor}
              stroke="white"
              strokeWidth={1}
            />
            {/* Label next to outlier dot - show more when zoomed */}
            {zoomLevel > 1.2 && (
              <text
                x={boxX + boxWidth / 2 + outlierSize + 4}
                y={cy + 3}
                fontSize={zoomLevel > 1.5 ? 10 : 8}
                fill={outlierColor}
                fontWeight={500}
                textAnchor="start"
              >
                {shortLabel} ({outlier.score})
              </text>
            )}
            {zoomLevel <= 1.2 && (
              <text
                x={boxX + boxWidth / 2 + 8}
                y={cy + 3}
                fontSize={8}
                fill={outlierColor}
                fontWeight={500}
                textAnchor="start"
              >
                {shortLabel}
              </text>
            )}
          </g>
        );
      })}
      
      {/* Low sample size indicator */}
      {isLowSample && (
        <text
          x={boxX + boxWidth / 2}
          y={whiskerTop - 10}
          textAnchor="middle"
          fontSize={10}
          fill="hsl(45, 93%, 47%)"
          fontWeight={600}
        >
          ⚠
        </text>
      )}
    </g>
  );
};

export const BoxPlotChart: React.FC<BoxPlotChartProps> = ({ 
  data, 
  showMean = true, 
  height = 300 
}) => {
  const [hoveredYear, setHoveredYear] = useState<string | null>(null);
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [isPinching, setIsPinching] = useState(false);
  const [zoomFeedback, setZoomFeedback] = useState<string | null>(null);

  // Refs for gesture tracking
  const initialTouchDistance = useRef<number | null>(null);
  const initialZoomLevel = useRef<number>(1);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipeStartOffset = useRef<number>(0);
  
  // Calculate visible data based on zoom
  const visibleData = useMemo(() => {
    if (zoomLevel <= 1) return data;
    
    const visibleCount = Math.max(2, Math.round(data.length / zoomLevel));
    const maxOffset = Math.max(0, data.length - visibleCount);
    const clampedOffset = Math.min(scrollOffset, maxOffset);
    return data.slice(clampedOffset, clampedOffset + visibleCount);
  }, [data, zoomLevel, scrollOffset]);

  // Touch distance calculation
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Haptic feedback
  const triggerHaptic = (style: 'light' | 'medium' | 'heavy') => {
    if ('vibrate' in navigator) {
      const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30;
      navigator.vibrate(duration);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture start
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      initialTouchDistance.current = distance;
      initialZoomLevel.current = zoomLevel;
      setIsPinching(true);
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      // Swipe gesture start (when zoomed)
      swipeStartX.current = e.touches[0].clientX;
      swipeStartOffset.current = scrollOffset;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistance.current !== null) {
      // Pinch gesture
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / initialTouchDistance.current;
      const newZoom = Math.max(1, Math.min(4, initialZoomLevel.current * scale));
      
      // Show feedback
      const zoomPercent = Math.round(newZoom * 100);
      setZoomFeedback(`${zoomPercent}%`);
      
      setZoomLevel(newZoom);
      
      // Adjust scroll offset if zooming out
      if (newZoom < zoomLevel) {
        const visibleCount = Math.max(2, Math.round(data.length / newZoom));
        const maxOffset = Math.max(0, data.length - visibleCount);
        setScrollOffset(Math.min(scrollOffset, maxOffset));
      }
    } else if (e.touches.length === 1 && swipeStartX.current !== null && zoomLevel > 1) {
      // Swipe to navigate when zoomed
      const deltaX = swipeStartX.current - e.touches[0].clientX;
      const sensitivity = 50; // pixels per item
      const itemDelta = Math.round(deltaX / sensitivity);
      
      const visibleCount = Math.max(2, Math.round(data.length / zoomLevel));
      const maxOffset = Math.max(0, data.length - visibleCount);
      const newOffset = Math.max(0, Math.min(maxOffset, swipeStartOffset.current + itemDelta));
      
      setScrollOffset(newOffset);
    }
  };

  const handleTouchEnd = () => {
    if (isPinching) {
      triggerHaptic('light');
      setIsPinching(false);
      
      // Clear feedback after delay
      setTimeout(() => setZoomFeedback(null), 500);
    }
    
    initialTouchDistance.current = null;
    swipeStartX.current = null;
  };

  // Reset zoom
  const handleResetZoom = () => {
    setZoomLevel(1);
    setScrollOffset(0);
    triggerHaptic('medium');
  };
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No data available for the selected filters
      </div>
    );
  }
  
  // Calculate Y domain with padding for outliers
  const allValues = data.flatMap(d => [
    d.whiskerHigh,
    d.whiskerLow,
    ...d.outliers
  ]).filter(v => v > 0);
  
  const minY = Math.max(0, Math.min(...allValues) - 5);
  const maxY = Math.min(100, Math.max(...allValues) + 5);
  
  // Chart dimensions
  const legendHeight = 20;
  const chartAreaHeight = height - legendHeight;
  const boxSpacing = zoomLevel > 1 ? 100 : 80;
  const chartWidth = visibleData.length * boxSpacing + 60;
  
  return (
    <div 
      ref={chartContainerRef}
      className="w-full relative touch-none"
      style={{ height: height + 30 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Zoom Controls */}
      {zoomLevel > 1 && (
        <div className="absolute top-0 right-0 z-10 flex items-center gap-2 p-1">
          <span className="text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleResetZoom}
            className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Zoom Feedback Overlay */}
      {zoomFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-foreground/80 text-background px-4 py-2 rounded-lg text-lg font-bold animate-pulse">
            {zoomFeedback}
          </div>
        </div>
      )}

      {/* Pinch Hint (shown initially) */}
      {data.length > 3 && zoomLevel === 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/60 z-10">
          Pinch to zoom
        </div>
      )}

      {/* Scroll Indicators */}
      {zoomLevel > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {Array.from({ length: Math.ceil(data.length / Math.max(2, Math.round(data.length / zoomLevel))) }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === Math.floor(scrollOffset / Math.max(1, Math.round(data.length / zoomLevel)))
                  ? 'bg-primary'
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <svg
          viewBox={`0 0 ${chartWidth} ${height + 30}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          {/* Legend - Horizontal at TOP */}
          <g transform={`translate(50, 8)`}>
            {/* Upper (Green) */}
            <rect x={0} y={0} width={12} height={8} fill="hsl(142, 71%, 45%)" fillOpacity={0.7} rx={2} />
            <text x={16} y={7} fontSize={9} fill="hsl(var(--muted-foreground))">Above Median</text>
            
            {/* Lower (Red) */}
            <rect x={95} y={0} width={12} height={8} fill="hsl(0, 84%, 60%)" fillOpacity={0.7} rx={2} />
            <text x={111} y={7} fontSize={9} fill="hsl(var(--muted-foreground))">Below Median</text>
            
            {/* Median */}
            <line x1={185} y1={4} x2={197} y2={4} stroke="hsl(215, 25%, 27%)" strokeWidth={3} />
            <text x={201} y={7} fontSize={9} fill="hsl(var(--muted-foreground))">Median</text>
            
            {/* Mean */}
            {showMean && (
              <>
                <polygon
                  points="255,4 259,8 255,12 251,8"
                  fill="hsl(199, 89%, 48%)"
                />
                <text x={265} y={7} fontSize={9} fill="hsl(var(--muted-foreground))">Mean</text>
              </>
            )}
            
            {/* Outlier */}
            <circle cx={showMean ? 315 : 255} cy={4} r={4} fill="hsl(280, 70%, 50%)" />
            <text x={showMean ? 323 : 263} y={7} fontSize={9} fill="hsl(var(--muted-foreground))">Outlier</text>
          </g>
          
          {/* Chart Area - shifted down for legend */}
          <g transform={`translate(0, ${legendHeight})`}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(tick => {
              const y = chartAreaHeight - 40 - ((tick - minY) / (maxY - minY)) * (chartAreaHeight - 60);
              return (
                <g key={tick}>
                  <line
                    x1={45}
                    y1={y}
                    x2={chartWidth - 10}
                    y2={y}
                    stroke="hsl(var(--border))"
                    strokeDasharray="3,3"
                    opacity={0.5}
                  />
                  <text
                    x={40}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={10}
                    fill="hsl(var(--muted-foreground))"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}
            
            {/* Y-axis label */}
            <text
              x={12}
              y={chartAreaHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, 12, ${chartAreaHeight / 2})`}
              fontSize={11}
              fill="hsl(var(--muted-foreground))"
              fontWeight={500}
            >
              Score
            </text>
            
            {/* Box plots */}
            {visibleData.map((d, idx) => {
              const x = 50 + idx * boxSpacing;
              const boxWidth = zoomLevel > 1 ? 70 : 60;
              
              // Y scale function
              const yScale = (value: number) => 
                chartAreaHeight - 40 - ((value - minY) / (maxY - minY)) * (chartAreaHeight - 60);
              
              return (
                <g 
                  key={d.year}
                  onMouseEnter={() => setHoveredYear(d.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Hover background */}
                  <rect
                    x={x}
                    y={10}
                    width={boxWidth}
                    height={chartAreaHeight - 30}
                    fill={hoveredYear === d.year ? "hsl(var(--accent))" : "transparent"}
                    opacity={0.3}
                    rx={4}
                  />
                  
                  {/* Box plot */}
                  <BoxPlotShape
                    x={x}
                    y={0}
                    width={boxWidth}
                    data={d}
                    yScale={yScale}
                    showMean={showMean}
                    isHovered={hoveredYear === d.year}
                    zoomLevel={zoomLevel}
                  />
                  
                  {/* Year label */}
                  <text
                    x={x + boxWidth / 2}
                    y={chartAreaHeight - 15}
                    textAnchor="middle"
                    fontSize={zoomLevel > 1 ? 12 : 11}
                    fill="hsl(var(--foreground))"
                    fontWeight={500}
                  >
                    {d.year}
                  </text>
                  
                  {/* Sample size */}
                  <text
                    x={x + boxWidth / 2}
                    y={chartAreaHeight - 3}
                    textAnchor="middle"
                    fontSize={9}
                    fill="hsl(var(--muted-foreground))"
                  >
                    n={d.n}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </ResponsiveContainer>
      
      {/* Custom tooltip overlay */}
      {hoveredYear && (() => {
        const idx = visibleData.findIndex(d => d.year === hoveredYear);
        const positionPercent = (idx + 0.5) * (100 / visibleData.length);
        // If tooltip would go off right edge (past 60%), position it to the left of center
        // If tooltip would go off left edge (below 40%), position it to the right of center
        const isRightSide = positionPercent > 50;
        
        return (
          <div 
            className="pointer-events-none absolute z-10" 
            style={{ 
              top: '25%', 
              left: isRightSide ? 'auto' : `${positionPercent}%`,
              right: isRightSide ? `${100 - positionPercent}%` : 'auto',
              transform: isRightSide ? 'translateX(50%)' : 'translateX(-50%)',
              maxWidth: '90%'
            }}
          >
            <BoxPlotTooltip 
              active={true} 
              payload={[{ payload: visibleData.find(d => d.year === hoveredYear) }]} 
            />
          </div>
        );
      })()}
    </div>
  );
};

export default BoxPlotChart;
