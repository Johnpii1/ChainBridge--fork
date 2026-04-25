"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { CHART_PALETTE } from "./chartTheme";
import { ChartNoData } from "./ChartNoData";

export interface DonutSlice {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  /** Optional center label */
  centerLabel?: string;
  /** Optional center sub-label */
  centerSub?: string;
  className?: string;
  noDataMessage?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export function DonutChart({
  slices,
  size = 180,
  thickness = 36,
  centerLabel,
  centerSub,
  className,
  noDataMessage,
}: DonutChartProps) {
  const hasData = slices.some((s) => s.value > 0);

  const arcs = useMemo(() => {
    if (!hasData) return [];
    const total = slices.reduce((s, d) => s + d.value, 0) || 1;
    let cursor = 0;
    return slices.map((s, i) => {
      const deg = (s.value / total) * 360;
      const start = cursor;
      cursor += deg;
      return {
        path: arcPath(size / 2, size / 2, size / 2 - thickness / 2, start, cursor - 0.3),
        color: s.color ?? CHART_PALETTE[i % CHART_PALETTE.length],
        label: s.label,
        pct: ((s.value / total) * 100).toFixed(1),
      };
    });
  }, [slices, size, thickness, hasData]);

  if (!hasData) {
    return <ChartNoData message={noDataMessage} height={size} className={className} />;
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label="Donut chart"
        role="img"
      >
        {arcs.map((a, i) => (
          <path
            key={i}
            d={a.path}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeLinecap="butt"
            opacity={0.85}
          >
            <title>
              {a.label}: {a.pct}%
            </title>
          </path>
        ))}

        {/* Center text */}
        {centerLabel && (
          <text
            x={size / 2}
            y={size / 2 - (centerSub ? 6 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={16}
            fontWeight={700}
            className="fill-text-primary"
          >
            {centerLabel}
          </text>
        )}
        {centerSub && (
          <text
            x={size / 2}
            y={size / 2 + 16}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            className="fill-text-muted"
          >
            {centerSub}
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {arcs.map((a, i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: a.color }}
              aria-hidden="true"
            />
            {slices[i].label}
            <span className="text-text-muted">({a.pct}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}
