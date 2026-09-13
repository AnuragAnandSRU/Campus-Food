'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Order, OrderStatus } from '../../../shared/src/types/order.types';
import { orderApi } from '@/lib/api/order';
import { getApiErrorMessage } from '@/lib/api-client';
import { StatusBadge } from './status-badge';
import { formatCurrency, formatTime } from '@/lib/utils';

// The next forward step for each status, with the button label staff see.
// Mirrors the backend state machine (order.controller FORWARD_TRANSITIONS).
const NEXT: Record<string, { status: OrderStatus; label: string }> = {
  pending: { status: 'confirmed', label: 'Accept order' },
  confirmed: { status: 'preparing', label: 'Start preparing' },
  preparing: { status: 'ready', label: 'Mark ready' },
  ready: { status: 'out_for_delivery', label: 'Send for delivery' },
  out_for_delivery: { status: 'delivered', label: 'Mark delivered' },
};

const CANCELLABLE = ['pending', 'confirmed', 'preparing', 'ready'];

/**
 * A single order in the canteen dashboard, with the actions staff can take on
 * it. `onChanged` is called after a successful mutation so the parent can
 * refresh (the live socket also refreshes, but this keeps the acting screen
 * snappy without waiting for the round-trip).
 */
export function StaffOrderCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const next = NEXT[order.status];
  const canCancel = CANCELLABLE.includes(order.status);

  async function advance() {
    if (!next) return;
    setBusy(true);
    try {
      await orderApi.updateStatus(order._id, { status: next.status });
      onChanged();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not update the order.'));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      await orderApi.cancel(order._id, { cancelReason: 'Cancelled by canteen' });
      toast.success('Order cancelled');
      onChanged();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not cancel the order.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-muted">{order.orderId}</p>
          <p className="text-xs text-muted">{formatTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-3 space-y-1 text-sm">
        {order.items.map((i) => (
          <div key={i.menuItemId} className="flex justify-between gap-3">
            <span className="text-ink">
              {i.quantity} × {i.name}
            </span>
            <span className="shrink-0 text-muted">{formatCurrency(i.price * i.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-sm">
        <span className="text-muted">
          {order.deliveryAddress.hostelBlock}, Room {order.deliveryAddress.roomNumber}
        </span>
        <span className="font-display font-semibold text-ink">
          {formatCurrency(order.totalAmount)}
        </span>
      </div>

      {order.specialInstructions && (
        <p className="mt-2 rounded-lg bg-highlight-tint px-3 py-2 text-xs text-ink">
          Note: {order.specialInstructions}
        </p>
      )}

      {(next || canCancel) && (
        <div className="mt-3 flex gap-2">
          {next && (
            <button
              onClick={advance}
              disabled={busy}
              className="btn btn-primary flex-1 py-2 text-sm disabled:opacity-60"
            >
              {next.label}
            </button>
          )}
          {canCancel && (
            <button
              onClick={cancel}
              disabled={busy}
              className="btn btn-secondary py-2 text-sm text-danger disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
