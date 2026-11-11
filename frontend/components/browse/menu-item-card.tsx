'use client';

import { useState } from 'react';
import type { MenuItem } from '../../../shared/src/types/menu.types';
import { VegIndicator } from './veg-indicator';
import { AddToCart } from './add-to-cart';
import { formatCurrency } from '@/lib/utils';
import { useFavorites } from '@/lib/use-favorites';
import { useAuthStore } from '@/store/auth-store';
import { useIsClient } from '@/lib/use-client-state';

/**
 * A single dish row on a canteen's menu, with its add-to-cart control and 1-tap favorites heart.
 */
export function MenuItemCard({
  item,
  canteenName,
  isOrderingAllowed = true,
}: {
  item: MenuItem;
  canteenName: string;
  isOrderingAllowed?: boolean;
}) {
  const { isFavorite, toggle } = useFavorites();
  const user = useAuthStore((s) => s.user);
  const mounted = useIsClient();

  const showFavorite = !mounted || !user || user.role === 'student';
  const favorite = isFavorite(item._id);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`card flex items-start justify-between gap-4 p-4 transition-all hover:shadow-sm ${item.isAvailable && isOrderingAllowed ? '' : 'opacity-60'
        }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <VegIndicator isVeg={item.isVeg} />
          <h4 className="font-display font-semibold text-ink">{item.name}</h4>
          {showFavorite && (
            <button
              type="button"
              onClick={() => toggle(item._id, item.name)}
              title={favorite ? 'Remove from favorites' : 'Save to favorites'}
              aria-label={favorite ? 'Remove from favorites' : 'Save to favorites'}
              className="text-base transition-transform hover:scale-125 focus:outline-none cursor-pointer p-0.5 ml-1"
            >
              <span>{favorite ? '❤️' : '🤍'}</span>
            </button>
          )}
        </div>

        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm font-light text-muted">{item.description}</p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-muted">
          {item.preparationTime > 0 && <span>⏱ {item.preparationTime} min</span>}
          {!item.isAvailable ? (
            <span className="font-medium text-danger">Sold out</span>
          ) : !isOrderingAllowed ? (
            <span className="font-medium text-muted">Canteen closed</span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {item.image && !imgError && (
          <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl border border-line bg-surface/40 shadow-xs sm:h-20 sm:w-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          </div>
        )}
        <div className="flex flex-col items-end gap-2">
          <span className="font-display text-lg font-semibold text-ink">
            {formatCurrency(item.price)}
          </span>
          {!item.isAvailable ? (
            <span className="rounded-full bg-line/60 px-3 py-1 text-xs font-semibold text-muted">
              Sold out
            </span>
          ) : !isOrderingAllowed ? (
            <span className="rounded-full bg-line/60 px-3 py-1 text-xs font-medium text-muted">
              Closed
            </span>
          ) : (
            <AddToCart item={item} canteenName={canteenName} />
          )}
        </div>
      </div>
    </div>
  );
}
