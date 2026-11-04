'use client';

import type { MenuItem } from '../../../shared/src/types/menu.types';
import { VegIndicator } from './veg-indicator';
import { AddToCart } from './add-to-cart';
import { formatCurrency } from '@/lib/utils';
import { useFavorites } from '@/lib/use-favorites';

/**
 * A single dish row on a canteen's menu, with its add-to-cart control and 1-tap favorites heart.
 */
export function MenuItemCard({ item, canteenName }: { item: MenuItem; canteenName: string }) {
  const { isFavorite, toggle } = useFavorites();
  const favorite = isFavorite(item._id);

  return (
    <div
      className={`card flex items-start justify-between gap-4 p-4 transition-all hover:shadow-sm ${
        item.isAvailable ? '' : 'opacity-60'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <VegIndicator isVeg={item.isVeg} />
          <h4 className="font-display font-semibold text-ink">{item.name}</h4>
          <button
            type="button"
            onClick={() => toggle(item._id, item.name)}
            title={favorite ? 'Remove from favorites' : 'Save to favorites'}
            aria-label={favorite ? 'Remove from favorites' : 'Save to favorites'}
            className="text-base transition-transform hover:scale-125 focus:outline-none cursor-pointer p-0.5 ml-1"
          >
            <span>{favorite ? '❤️' : '🤍'}</span>
          </button>
        </div>

        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm font-light text-muted">{item.description}</p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-muted">
          {item.preparationTime > 0 && <span>⏱ {item.preparationTime} min</span>}
          {!item.isAvailable && <span className="font-medium text-danger">Unavailable</span>}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="font-display text-lg font-semibold text-ink">
          {formatCurrency(item.price)}
        </span>
        <AddToCart item={item} canteenName={canteenName} />
      </div>
    </div>
  );
}
