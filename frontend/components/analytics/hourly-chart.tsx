'use client';

import { useState } from 'react';
import type { OrderTimeline } from '../../../shared/src/types/analytics.types';

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

export function HourlyChart({ data }: { data: OrderTimeline[] }) {
  const [hoveredHour, setHoveredHour] = useState<OrderTimeline | null>(null);

  const maxOrders = Math.max(...data.map((d) => d.orderCount), 1);
  const totalOrders = data.reduce((acc, d) => acc + d.orderCount, 0);

  // Find peak hour
  const peak = data.reduce(
    (max, curr) => (curr.orderCount > max.orderCount ? curr : max),
    data[0] || { hour: 0, orderCount: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted font-medium">
            Peak Kitchen Hours
          </span>
          <p className="font-display text-lg font-semibold text-ink mt-0.5">
            {peak.orderCount > 0 ? (
              <>
                Busiest at <span className="text-accent">{formatHour(peak.hour)}</span> ({peak.orderCount} orders)
              </>
            ) : (
              'No orders recorded yet'
            )}
          </p>
        </div>
        {hoveredHour && (
          <div className="rounded-lg bg-accent-tint/60 px-3 py-1 text-xs text-accent font-medium border border-accent/20">
            {formatHour(hoveredHour.hour)}: {hoveredHour.orderCount} {hoveredHour.orderCount === 1 ? 'order' : 'orders'}
          </div>
        )}
      </div>

      {/* 24-hour bar columns */}
      <div className="grid grid-cols-24 gap-1 items-end h-40 pt-4 pb-2 px-1">
        {data.map((item) => {
          const heightPct = (item.orderCount / maxOrders) * 100;
          const isPeak = item.hour === peak.hour && peak.orderCount > 0;
          const isHovered = hoveredHour?.hour === item.hour;

          return (
            <div
              key={item.hour}
              className="group relative flex flex-col items-center h-full justify-end cursor-pointer"
              onMouseEnter={() => setHoveredHour(item)}
              onMouseLeave={() => setHoveredHour(null)}
            >
              <div
                style={{ height: `${Math.max(heightPct, 4)}%` }}
                className={`w-full rounded-t transition-all duration-200 ${
                  isHovered
                    ? 'bg-accent shadow-md scale-105'
                    : isPeak
                    ? 'bg-accent/90'
                    : item.orderCount > 0
                    ? 'bg-accent/40 hover:bg-accent/70'
                    : 'bg-line/60'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Hour axis labels (every 4 hours: 12 AM, 4 AM, 8 AM, 12 PM, 4 PM, 8 PM) */}
      <div className="flex justify-between text-[11px] font-mono text-muted px-1">
        <span>12 AM</span>
        <span>4 AM</span>
        <span>8 AM</span>
        <span>12 PM</span>
        <span>4 PM</span>
        <span>8 PM</span>
        <span>11 PM</span>
      </div>
    </div>
  );
}
