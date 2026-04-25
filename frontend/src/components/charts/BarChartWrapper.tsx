"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { CHART_PAD, CHART_PALETTE, CHART_DEFAULT_HEIGHT } from "./chartTheme";
import { ChartNoData } from "./ChartNoData";

export interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartWrapperProps {
  data: BarDataPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
  noDataMessage?: string;
  /** Horizontal layout (default: vertical) */
  horizontal?: boolean;
}

const SVG_W = 600;

export function BarChartWrapper({
  data,
  height = CHART_DEFAULT_HEIGHT,
  formatValue,
  className,
  noDataMessage,
}: BarChartWrapperProps) {
  const { bars, yTicks, xLabels } = useMemo(() => {
    if (!data.length) return { bars: [], yTicks: [], xLabels: [] };

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const inner = {
      w: SVG_W - CHART_PAD.left - CHART_PAD.right,
      h: height - CHART_PAD.top - CHART_PAD.bottom,
    };
    const barW = Math.max(2, inner.w / data.length - 3);

    const bars = data.map((d, i) => {
      const barH = (d.value / maxVal) * inner.h;
      return {
        x: CHART_PAD.left + i * (inner.w / data.length),
        y: CHART_PAD.top + inner.h - barH,
        w: barW,
        h: Math.max(barH, 1),
        color: d.color ?? CHART_PALETTE[i % CHART_PALETTE.length],
        label: d.label,
        value: d.value,
      };
    });

    const steps = 4;
    const yTicks = Array.from({ length: steps + 1 }, (_, i) => ({
      value: (maxVal / steps) * i,
      y: CHART_PAD.top + inner.h - (inner.h / steps) * i,
    }));

    const stride = Math.max(1, Math.floor(data.length / 8));
    const xLabels = data
      .filter((_, i) => i % stride === 0)
      .map((d, idx) => ({
        x: CHART_PAD.left + idx * stride * (inner.w / data.length) + barW / 2,
        label: d.label,
      }));

    return { bars, yTicks, xLabels };
  }, [data, height]);

  if (!data.length) {
    return <ChartNoData message={noDataMessage} height={height} className={className} />;
  }

  const fmt = formatValue ?? ((v: number) => v.toLocaleString());

  return (
    <div
      className={cn("w-full overflow-hidden rounded-xl border border-border bg-surface", className)}
    >
      <svg
        viewBox={`0 0 ${SVG_W} ${height}`}
        className="w-full"
        style={{ height }}
        aria-label="Bar chart"
        role="img"
      >
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={CHART_PAD.left}
              y1={t.y}
              x2={SVG_W - CHART_PAD.right}
              y2={t.y}
              stroke="currentColor"
              strokeOpacity={0.06}
              strokeWidth={1}
            />
            <text
              x={CHART_PAD.left - 6}
              y={t.y + 4}
              textAnchor="end"
              fontSize={9}
              className="fill-text-muted"
            >
              {t.value >= 1_000_000
                ? `${(t.value / 1_000_000).toFixed(1)}M`
                : t.value >= 1_000
                  ? `${(t.value / 1_000).toFixed(0)}K`
                  : String(Math.round(t.value))}
            </text>
          </g>
        ))}

        {bars.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={2}
            fill={b.color}
            opacity={0.8}
          >
            <title>
              {b.label}: {fmt(b.value)}
            </title>
          </rect>
        ))}

        {xLabels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={height - 6}
            textAnchor="middle"
            fontSize={9}
            className="fill-text-muted"
          >
            {l.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
