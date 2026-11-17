'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Star } from 'lucide-react';
import type { Canteen } from '../../../shared/src/types/canteen.types';
import { isCanteenOpen } from '@/lib/utils';

export function CanteenCard({ canteen }: { canteen: Canteen }) {
  const [imgError, setImgError] = useState(false);
  const open = isCanteenOpen(canteen.openingHours);

  return (
    <Link
      href={`/canteens/${canteen._id}`}
      className="card-interactive group block overflow-hidden"
    >
      <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-accent-tint via-surface to-highlight-tint overflow-hidden">
        {canteen.image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={canteen.image}
            alt={canteen.name}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <span className="font-display text-5xl font-semibold text-accent/70 transition-transform duration-300 group-hover:scale-110">
            {canteen.name.charAt(0)}
          </span>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        <span
          className={`badge absolute right-3 top-3 text-xs shadow-sm font-semibold ${
            !canteen.isActive
              ? 'bg-red-700 text-white'
              : open
              ? 'bg-accent text-white'
              : 'bg-ink/80 text-white'
          }`}
        >
          {open && canteen.isActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          )}
          {!canteen.isActive ? 'Offline' : open ? 'Open now' : 'Closed'}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-ink group-hover:text-accent transition-colors">
            {canteen.name}
          </h3>
          {canteen.rating > 0 ? (
            <span className="badge badge-accent shrink-0 text-xs font-semibold">
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span>{canteen.rating.toFixed(1)}</span>
              {canteen.totalRatings ? (
                <span className="text-muted/80 font-normal">({canteen.totalRatings})</span>
              ) : null}
            </span>
          ) : (
            <span className="badge shrink-0 bg-highlight-tint text-xs text-ink font-medium">New</span>
          )}
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-accent/80" />
          <span className="truncate">{canteen.location}</span>
        </p>

        {canteen.description && (
          <p className="mt-2.5 line-clamp-2 text-xs sm:text-sm font-light text-muted leading-relaxed">
            {canteen.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3 text-xs sm:text-sm">
          <span className="flex items-center gap-1 text-muted">
            <Clock className="h-3 w-3 text-muted/70" />
            <span>
              {canteen.openingHours.open}–{canteen.openingHours.close}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-accent transition-transform duration-200 group-hover:translate-x-0.5">
            <span>View menu</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
