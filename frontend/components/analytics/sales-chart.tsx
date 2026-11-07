'use client';

import { useState } from 'react';
import type { SalesData } from '../../../shared/src/types/analytics.types';
import { formatCurrency } from '@/lib/utils';

export function SalesChart({ data }: { data: SalesData[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        No sales data available for this period.
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.totalRevenue), 100);
  const maxOrders = Math.max(...data.map((d) => d.totalOrders), 1);

  // SVG dimensions & padding
  const width = 600;
  const height = 220;
  const padX = 40;
  const padY = 30;
  const chartWidth = width - padX * 2;
  const chartHeight = height - padY * 2;

  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y = padY + chartHeight - (d.totalRevenue / maxRevenue) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padY + chartHeight} L ${points[0].x} ${padY + chartHeight} Z`;

  const totalPeriodRevenue = data.reduce((acc, d) => acc + d.totalRevenue, 0);
  const totalPeriodOrders = data.reduce((acc, d) => acc + d.totalOrders, 0);
  const avgOrderValue =
    totalPeriodOrders > 0 ? Math.round(totalPeriodRevenue / totalPeriodOrders) : 0;

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <div className="space-y-4">
      {/* Dynamic Summary Highlight */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted font-medium">
            {hoveredIndex !== null ? `Date: ${activePoint.date}` : 'Selected Period Total'}
          </span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold tracking-tight text-ink">
              {formatCurrency(hoveredIndex !== null ? activePoint.totalRevenue : totalPeriodRevenue)}
            </span>
            <span className="text-sm font-medium text-accent">
              {hoveredIndex !== null ? `${activePoint.totalOrders} orders` : `${totalPeriodOrders} total orders`}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-muted">Avg. Order Value</span>
          <p className="font-display text-lg font-semibold text-ink">
            {formatCurrency(
              hoveredIndex !== null ? activePoint.averageOrderValue : avgOrderValue
            )}
          </p>
        </div>
      </div>

      {totalPeriodRevenue === 0 && (
        <div className="rounded-lg bg-accent-tint/20 border border-line px-3 py-2 text-xs text-muted text-center">
          No completed sales recorded in this window yet. Live orders will populate this trend automatically.
        </div>
      )}

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1b7a45" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1b7a45" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = padY + chartHeight * (1 - pct);
            return (
              <g key={idx}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="4 4"
                />
                <text
                  x={padX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted text-[10px] font-mono"
                >
                  {Math.round(maxRevenue * pct)}
                </text>
              </g>
            );
          })}

          {/* Shaded Area */}
          <path d={areaD} fill="url(#revenueGradient)" />

          {/* Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#1b7a45"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Points */}
          {points.map((pt, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? 6 : 3.5}
                className={`transition-all duration-150 ${
                  hoveredIndex === i
                    ? 'fill-accent stroke-white stroke-2'
                    : 'fill-white stroke-accent stroke-[1.5]'
                }`}
              />
              {/* Invisible larger hover hit area */}
              <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
            </g>
          ))}

          {/* X Axis Labels */}
          {points.map((pt, i) => {
            // Show all labels if <= 7 days, or every other day if more
            if (data.length > 10 && i % 2 !== 0 && i !== data.length - 1) return null;
            const shortDate = pt.date.slice(5); // MM-DD
            return (
              <text
                key={i}
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                className="fill-muted text-[11px] font-light"
              >
                {shortDate}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
