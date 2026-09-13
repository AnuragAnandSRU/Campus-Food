import { getOrderStatusText } from '@/lib/utils';

/**
 * Emerald-palette order status pill. Uses the design tokens rather than the
 * generic tailwind colours in utils.getOrderStatusColor.
 */
const TONE: Record<string, string> = {
  pending: 'bg-highlight-tint text-ink',
  confirmed: 'bg-accent-tint text-accent',
  preparing: 'bg-accent-tint text-accent',
  ready: 'bg-accent text-white',
  out_for_delivery: 'bg-accent text-white',
  delivered: 'bg-accent text-white',
  cancelled: 'bg-danger/10 text-danger',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge text-xs ${TONE[status] ?? 'bg-line text-muted'}`}>
      {getOrderStatusText(status)}
    </span>
  );
}
