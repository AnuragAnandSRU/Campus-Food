'use client';

import { Award } from 'lucide-react';
import type { PopularItem } from '../../../shared/src/types/analytics.types';
import { formatCurrency } from '@/lib/utils';

export function PopularItemsCard({ items }: { items: PopularItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted">
        No sales recorded yet. Top dishes will appear here.
      </div>
    );
  }

  const topSold = items[0]?.totalOrders || 1;

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const pct = Math.round((item.totalOrders / topSold) * 100);

        const rankBadge =
          index === 0 ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 font-bold text-xs border border-amber-500/25">
              <Award className="h-4 w-4" />
            </div>
          ) : index === 1 ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200/80 text-zinc-700 font-bold text-xs border border-zinc-300">
              <Award className="h-4 w-4" />
            </div>
          ) : index === 2 ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-700/10 text-amber-900 font-bold text-xs border border-amber-700/20">
              <Award className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-xs font-semibold text-muted">
              #{index + 1}
            </div>
          );

        return (
          <div
            key={item.menuItemId}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition-all hover:border-accent/40 hover:shadow-xs"
          >
            {rankBadge}

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium text-ink text-sm">{item.name}</p>
                <span className="font-display text-sm font-bold text-ink shrink-0 tabular-nums">
                  {formatCurrency(item.totalRevenue)}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="h-1.5 w-full max-w-[140px] rounded-full bg-line overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full rounded-full bg-accent transition-all duration-300"
                  />
                </div>
                <span className="text-xs text-muted shrink-0 tabular-nums">
                  {item.totalOrders} {item.totalOrders === 1 ? 'order' : 'orders'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
