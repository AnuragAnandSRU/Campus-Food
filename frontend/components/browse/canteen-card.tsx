import Link from 'next/link';
import type { Canteen } from '../../../shared/src/types/canteen.types';
import { isCanteenOpen } from '@/lib/utils';

function PinIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

export function CanteenCard({ canteen }: { canteen: Canteen }) {
  const open = isCanteenOpen(canteen.openingHours);

  return (
    <Link
      href={`/canteens/${canteen._id}`}
      className="card group block overflow-hidden transition-transform hover:-translate-y-1"
    >
      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-accent-tint to-highlight-tint">
        {canteen.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={canteen.image} alt={canteen.name} className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-5xl font-semibold text-accent/70">
            {canteen.name.charAt(0)}
          </span>
        )}
        <span
          className={`badge absolute right-3 top-3 text-xs ${
            open ? 'bg-accent text-white' : 'bg-ink/70 text-white'
          }`}
        >
          {open ? 'Open now' : 'Closed'}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-ink">{canteen.name}</h3>
          {canteen.rating > 0 ? (
            <span className="badge badge-accent shrink-0 text-xs">★ {canteen.rating.toFixed(1)}</span>
          ) : (
            <span className="badge shrink-0 bg-highlight-tint text-xs text-ink">New</span>
          )}
        </div>

        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          <PinIcon />
          {canteen.location}
        </p>

        <p className="mt-3 line-clamp-2 text-sm font-light text-muted">{canteen.description}</p>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">
            {canteen.openingHours.open}–{canteen.openingHours.close}
          </span>
          <span className="font-medium text-accent group-hover:underline">View menu →</span>
        </div>
      </div>
    </Link>
  );
}
