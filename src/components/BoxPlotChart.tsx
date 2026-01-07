/**
 * Box & Whisker Chart Component
 * 
 * Renders a custom SVG-based box and whisker plot using Recharts containers.
 * Supports multiple years of data with tooltips showing full statistics.
 */

import React, { useState } from "react";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
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
          {data.outliers.length > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>Outliers:</span>
              <span>{data.outliers.length} ({data.outliers.slice(0, 3).join(", ")}{data.outliers.length > 3 ? "..." : ""})</span>
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
  isHovered 
}: { 
  x: number; 
  y: number; 
  width: number; 
  data: BoxPlotStats; 
  yScale: (value: number) => number;
  showMean: boolean;
  isHovered: boolean;
}) => {
  const boxWidth = Math.min(width * 0.6, 50);
  const boxX = x + (width - boxWidth) / 2;
  
  const whiskerTop = yScale(data.whiskerHigh);
  const q3Y = yScale(data.q3);
  const medianY = yScale(data.median);
  const q1Y = yScale(data.q1);
  const whiskerBottom = yScale(data.whiskerLow);
  const meanY = showMean ? yScale(data.mean) : 0;
  
  const boxHeight = q1Y - q3Y;
  const whiskerWidth = boxWidth * 0.3;
  
  const isLowSample = data.n > 0 && data.n < 5;
  
  // Colors - using hsl values that work with the design system
  const boxFill = isLowSample ? "hsl(45, 93%, 47%)" : "hsl(158, 64%, 52%)"; // amber or emerald
  const boxStroke = isLowSample ? "hsl(45, 93%, 37%)" : "hsl(158, 64%, 42%)";
  const medianColor = "hsl(158, 64%, 32%)";
  const whiskerColor = "hsl(215, 16%, 47%)";
  const meanColor = "hsl(199, 89%, 48%)";
  const outlierColor = "hsl(0, 84%, 60%)";
  
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
      
      {/* Box (Q1 to Q3) */}
      <rect
        x={boxX}
        y={q3Y}
        width={boxWidth}
        height={Math.max(boxHeight, 2)}
        fill={boxFill}
        fillOpacity={0.6}
        stroke={boxStroke}
        strokeWidth={2}
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
      
      {/* Outliers */}
      {data.outliers.map((outlier, idx) => (
        <circle
          key={idx}
          cx={boxX + boxWidth / 2}
          cy={yScale(outlier)}
          r={4}
          fill={outlierColor}
          stroke="white"
          strokeWidth={1}
        />
      ))}
      
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
  
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <svg
          viewBox={`0 0 ${data.length * 80 + 60} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(tick => {
            const y = height - 40 - ((tick - minY) / (maxY - minY)) * (height - 60);
            return (
              <g key={tick}>
                <line
                  x1={45}
                  y1={y}
                  x2={data.length * 80 + 50}
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
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 12, ${height / 2})`}
            fontSize={11}
            fill="hsl(var(--muted-foreground))"
            fontWeight={500}
          >
            Score
          </text>
          
          {/* Box plots */}
          {data.map((d, idx) => {
            const x = 50 + idx * 80;
            const boxWidth = 60;
            
            // Y scale function
            const yScale = (value: number) => 
              height - 40 - ((value - minY) / (maxY - minY)) * (height - 60);
            
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
                  height={height - 30}
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
                />
                
                {/* Year label */}
                <text
                  x={x + boxWidth / 2}
                  y={height - 15}
                  textAnchor="middle"
                  fontSize={11}
                  fill="hsl(var(--foreground))"
                  fontWeight={500}
                >
                  {d.year}
                </text>
                
                {/* Sample size */}
                <text
                  x={x + boxWidth / 2}
                  y={height - 3}
                  textAnchor="middle"
                  fontSize={9}
                  fill="hsl(var(--muted-foreground))"
                >
                  n={d.n}
                </text>
              </g>
            );
          })}
          
          {/* Legend */}
          <g transform={`translate(${data.length * 80 - 30}, 15)`}>
            {/* Median */}
            <line x1={0} y1={0} x2={15} y2={0} stroke="hsl(158, 64%, 32%)" strokeWidth={3} />
            <text x={20} y={4} fontSize={9} fill="hsl(var(--muted-foreground))">Median</text>
            
            {/* Mean */}
            {showMean && (
              <>
                <polygon
                  points="7,15 12,20 7,25 2,20"
                  fill="hsl(199, 89%, 48%)"
                />
                <text x={20} y={24} fontSize={9} fill="hsl(var(--muted-foreground))">Mean</text>
              </>
            )}
            
            {/* Outlier */}
            <circle cx={7} cy={40} r={4} fill="hsl(0, 84%, 60%)" />
            <text x={20} y={44} fontSize={9} fill="hsl(var(--muted-foreground))">Outlier</text>
          </g>
        </svg>
      </ResponsiveContainer>
      
      {/* Custom tooltip overlay */}
      {hoveredYear && (
        <div className="pointer-events-none absolute z-10" style={{ 
          top: '20%', 
          left: `${(data.findIndex(d => d.year === hoveredYear) + 0.5) * (100 / data.length)}%`,
          transform: 'translateX(-50%)'
        }}>
          <BoxPlotTooltip 
            active={true} 
            payload={[{ payload: data.find(d => d.year === hoveredYear) }]} 
          />
        </div>
      )}
    </div>
  );
};

export default BoxPlotChart;
