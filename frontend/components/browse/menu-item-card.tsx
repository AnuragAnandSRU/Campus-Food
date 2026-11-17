'use client';

import { useState } from 'react';
import { Clock, Heart } from 'lucide-react';
import type { MenuItem } from '../../../shared/src/types/menu.types';
import { formatCurrency } from '@/lib/utils';
import { VegIndicator } from './veg-indicator';
import { AddToCart } from './add-to-cart';
import { useFavorites } from '@/lib/use-favorites';
import { useAuthStore } from '@/store/auth-store';
import { useIsClient } from '@/lib/use-client-state';

/**
 * A single menu item row inside a canteen's menu.
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
  const [imgError, setImgError] = useState(false);
  const isClient = useIsClient();
  const { isFavorite, toggle } = useFavorites();
  const user = useAuthStore((s) => s.user);

  const favorite = isClient && isFavorite(item._id);
  const showFavorite = isClient && user?.role === 'student';

  return (
    <div className="card-interactive flex items-start justify-between gap-4 p-4 transition-all">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <VegIndicator isVeg={item.isVeg} />
          <h4 className="font-display font-semibold text-ink text-base">{item.name}</h4>
          {showFavorite && (
            <button
              type="button"
              onClick={() => toggle(item._id, item.name)}
              title={favorite ? 'Remove from favorites' : 'Save to favorites'}
              aria-label={favorite ? 'Remove from favorites' : 'Save to favorites'}
              className="text-base transition-transform hover:scale-125 focus:outline-none cursor-pointer p-0.5 ml-1"
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  favorite ? 'fill-red-500 text-red-500' : 'text-muted/60 hover:text-red-500'
                }`}
              />
            </button>
          )}
        </div>

        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs sm:text-sm font-light text-muted leading-relaxed">
            {item.description}
          </p>
        )}

        <div className="mt-2.5 flex items-center gap-3 text-xs text-muted">
          {item.preparationTime > 0 && (
            <span className="flex items-center gap-1 font-medium">
              <Clock className="h-3 w-3 text-muted/70" />
              <span>{item.preparationTime} min</span>
            </span>
          )}
          {!item.isAvailable ? (
            <span className="font-semibold text-danger">Sold out</span>
          ) : !isOrderingAllowed ? (
            <span className="font-medium text-muted">Canteen closed</span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3.5">
        {item.image && !imgError && (
          <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl border border-line bg-surface/50 shadow-xs sm:h-20 sm:w-20">
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
          <span className="font-display text-base sm:text-lg font-bold text-ink">
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
