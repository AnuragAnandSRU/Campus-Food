'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Order, OrderStatus } from '../../../shared/src/types/order.types';
import { orderApi } from '@/lib/api/order';
import { getApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { StatusBadge } from './status-badge';
import { formatCurrency, formatTime } from '@/lib/utils';

// The next forward step for each status, with the button label staff see.
// Mirrors the backend state machine (order.controller FORWARD_TRANSITIONS).
const NEXT: Record<string, { status: OrderStatus; label: string }> = {
  pending: { status: 'confirmed', label: 'Accept order' },
  confirmed: { status: 'preparing', label: 'Start preparing' },
  preparing: { status: 'ready', label: 'Mark ready' },
  ready: { status: 'out_for_delivery', label: 'Send for delivery' },
  out_for_delivery: { status: 'delivered', label: 'Handover & Deliver' },
};

const CANCELLABLE = ['pending', 'confirmed', 'preparing', 'ready'];

/**
 * A single order in the canteen dashboard, with the actions staff can take on
 * it. Requires a 4-digit student delivery PIN to complete handover when
 * 'out_for_delivery' -> 'delivered'.
 */
export function StaffOrderCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pin, setPin] = useState('');

  const user = useAuthStore((s) => s.user);
  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';

  const next = NEXT[order.status];
  const canCancel = CANCELLABLE.includes(order.status);
  const isDeliveryHandover = order.status === 'out_for_delivery';

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

  async function handleVerifyHandover() {
    if (pin.length !== 4) {
      toast.error('Please enter the 4-digit handover PIN');
      return;
    }
    setBusy(true);
    try {
      await orderApi.updateStatus(order._id, {
        status: 'delivered',
        deliveryPin: pin,
      });
      toast.success('Handover confirmed! Order delivered.');
      setShowPinPrompt(false);
      setPin('');
      onChanged();
    } catch (e) {
      toast.error(
        getApiErrorMessage(e, 'Invalid delivery PIN. Please ask the student for their 4-digit code.')
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleOwnerOverride() {
    if (!confirm('Override PIN verification? Use only if the student is unreachable.')) return;
    setBusy(true);
    try {
      await orderApi.updateStatus(order._id, {
        status: 'delivered',
        overridePin: true,
      });
      toast.success('Delivered with owner override');
      setShowPinPrompt(false);
      onChanged();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not override delivery status.'));
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
    <div className="card p-4 transition-all">
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

      {/* Owner-only PIN hint if available */}
      {isOwnerOrAdmin && order.deliveryPin && order.status !== 'delivered' && (
        <div className="mt-2 flex items-center justify-between rounded-md bg-surface/70 px-2.5 py-1 text-xs text-muted border border-line">
          <span>Student PIN:</span>
          <span className="font-mono font-bold text-accent">{order.deliveryPin}</span>
        </div>
      )}

      {/* Interactive PIN verification box when completing delivery */}
      {showPinPrompt ? (
        <div className="mt-3 rounded-xl border border-accent/40 bg-accent/5 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <span>🔐</span>
              <span>Enter Student PIN</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setShowPinPrompt(false);
                setPin('');
              }}
              className="text-xs text-muted hover:text-ink cursor-pointer"
            >
              ✕ Cancel
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit PIN"
              className="input font-mono text-center tracking-widest text-lg font-bold py-1.5 flex-1"
              autoFocus
            />
            <button
              type="button"
              onClick={handleVerifyHandover}
              disabled={busy || pin.length !== 4}
              className="btn btn-primary py-1.5 px-4 text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Verifying…' : 'Verify'}
            </button>
          </div>

          {isOwnerOrAdmin && (
            <div className="pt-1.5 flex items-center justify-between border-t border-line/60 text-[11px]">
              <span className="text-muted">Student phone off?</span>
              <button
                type="button"
                onClick={handleOwnerOverride}
                disabled={busy}
                className="text-amber-700 hover:underline font-medium cursor-pointer"
              >
                Owner Override
              </button>
            </div>
          )}
        </div>
      ) : (
        (next || canCancel) && (
          <div className="mt-3 flex gap-2">
            {next && (
              <button
                onClick={() => {
                  if (isDeliveryHandover) {
                    setShowPinPrompt(true);
                  } else {
                    advance();
                  }
                }}
                disabled={busy}
                className="btn btn-primary flex-1 py-2 text-sm disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeliveryHandover && <span>🔐</span>}
                <span>{next.label}</span>
              </button>
            )}
            {canCancel && (
              <button
                onClick={cancel}
                disabled={busy}
                className="btn btn-secondary py-2 text-sm text-danger disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
