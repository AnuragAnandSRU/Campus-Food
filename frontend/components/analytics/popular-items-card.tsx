'use client';

import type { PopularItem } from '../../../shared/src/types/analytics.types';
import { formatCurrency } from '@/lib/utils';

const MEDALS = ['🥇', '🥈', '🥉', '4', '5'];

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
        const medal = MEDALS[index] || `${index + 1}`;
        const pct = Math.round((item.totalOrders / topSold) * 100);

        return (
          <div
            key={item.menuItemId}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-accent/30"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-sm font-semibold text-ink">
              {medal}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium text-ink text-sm">{item.name}</p>
                <span className="font-display text-sm font-semibold text-ink shrink-0">
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
                <span className="text-xs text-muted shrink-0">
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
