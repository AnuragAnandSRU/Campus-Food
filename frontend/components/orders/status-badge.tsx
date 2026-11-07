import { getOrderStatusText } from '@/lib/utils';

/**
 * Fresh Emerald order status badge with distinct, cohesive tones for each stage of fulfillment.
 */
const TONE: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-300/70',
  confirmed: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300/70',
  preparing: 'bg-blue-50 text-blue-800 ring-1 ring-blue-300/70',
  ready: 'bg-amber-100 text-amber-900 ring-1 ring-amber-300/80 font-medium',
  out_for_delivery: 'bg-accent text-white ring-1 ring-accent font-semibold shadow-xs',
  delivered: 'bg-emerald-100/70 text-emerald-900 ring-1 ring-emerald-300/80',
  cancelled: 'bg-danger/10 text-danger ring-1 ring-danger/30',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge text-xs px-2.5 py-0.5 rounded-full ${TONE[status] ?? 'bg-line text-muted'}`}>
      {getOrderStatusText(status)}
    </span>
  );
}
