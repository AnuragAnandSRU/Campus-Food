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
 * 'out_for_delivery' -> 'delivered'. Displays student name and phone for campus runners.
 */
export function StaffOrderCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReasonChoice, setCancelReasonChoice] = useState('Item out of stock');
  const [customReason, setCustomReason] = useState('');
  const [pin, setPin] = useState('');

  const user = useAuthStore((s) => s.user);
  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';

  const next = NEXT[order.status];
  const canCancel = CANCELLABLE.includes(order.status);
  const isDeliveryHandover = order.status === 'out_for_delivery';
  const isActive = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(
    order.status
  );

  const student =
    typeof order.studentId === 'object' && order.studentId !== null
      ? (order.studentId as { name?: string; phone?: string; email?: string })
      : null;

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

  async function handleBumpEta(minutesToAdd: number) {
    setBusy(true);
    try {
      const baseTime = order.estimatedDeliveryTime
        ? new Date(order.estimatedDeliveryTime).getTime()
        : Date.now();
      const updatedTime = new Date(baseTime + minutesToAdd * 60 * 1000);
      await orderApi.updateStatus(order._id, {
        status: order.status,
        estimatedDeliveryTime: updatedTime,
      });
      toast.success(`Target time adjusted (+${minutesToAdd}m)`);
      onChanged();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not update delivery time.'));
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

  async function handleConfirmCancel() {
    const finalReason =
      cancelReasonChoice === 'Other'
        ? customReason.trim() || 'Cancelled by canteen'
        : cancelReasonChoice;

    setBusy(true);
    try {
      await orderApi.cancel(order._id, { cancelReason: finalReason });
      toast.success('Order cancelled');
      setShowCancelPrompt(false);
      onChanged();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not cancel the order.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4 transition-all">
      {/* Header: Order ID + Time + Status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-muted">{order.orderId}</p>
          <p className="text-xs text-muted">{formatTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Items List */}
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

      {/* Delivery Room & Total Amount */}
      <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-sm">
        <span className="text-muted">
          {order.deliveryAddress.hostelBlock}, Room {order.deliveryAddress.roomNumber}
        </span>
        <span className="font-display font-semibold text-ink">
          {formatCurrency(order.totalAmount)}
        </span>
      </div>

      {/* Student Contact Info for Runners */}
      {student && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-surface/80 px-2.5 py-1.5 text-xs border border-line/70">
          <span className="text-ink font-medium flex items-center gap-1.5">
            <span>👤</span>
            <span>{student.name || 'Student'}</span>
          </span>
          {student.phone ? (
            <a
              href={`tel:${student.phone}`}
              className="text-accent font-semibold hover:underline flex items-center gap-1"
              title="Call student"
            >
              <span>📞</span>
              <span>{student.phone}</span>
            </a>
          ) : (
            <span className="text-muted text-[11px]">No phone</span>
          )}
        </div>
      )}

      {/* Special Kitchen Notes */}
      {order.specialInstructions && (
        <p className="mt-2 rounded-lg bg-highlight-tint px-3 py-2 text-xs text-ink">
          Note: {order.specialInstructions}
        </p>
      )}

      {/* Target ETA & Quick Bump Chips for Active Orders */}
      {isActive && order.estimatedDeliveryTime && (
        <div className="mt-2 flex items-center justify-between rounded-md bg-surface/50 px-2.5 py-1.5 text-xs text-muted border border-line/50">
          <div className="flex items-center gap-1">
            <span>🕒 Target:</span>
            <span className="font-semibold text-ink">
              {formatTime(order.estimatedDeliveryTime)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleBumpEta(10)}
              className="rounded bg-line/60 px-1.5 py-0.5 text-[10px] font-medium text-ink hover:bg-line cursor-pointer disabled:opacity-50"
              title="Add 10 minutes to ETA"
            >
              +10m
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleBumpEta(20)}
              className="rounded bg-line/60 px-1.5 py-0.5 text-[10px] font-medium text-ink hover:bg-line cursor-pointer disabled:opacity-50"
              title="Add 20 minutes to ETA"
            >
              +20m
            </button>
          </div>
        </div>
      )}

      {/* Owner-only PIN hint if available */}
      {isOwnerOrAdmin && order.deliveryPin && order.status !== 'delivered' && (
        <div className="mt-2 flex items-center justify-between rounded-md bg-surface/70 px-2.5 py-1 text-xs text-muted border border-line">
          <span>Student PIN:</span>
          <span className="font-mono font-bold text-accent">{order.deliveryPin}</span>
        </div>
      )}

      {/* Safe Cancel Prompt with Reason Dropdown */}
      {showCancelPrompt ? (
        <div className="mt-3 rounded-xl border border-danger/30 bg-danger/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-danger flex items-center gap-1">
              <span>⚠️</span>
              <span>Cancel Order #{order.orderId.slice(-6)}?</span>
            </span>
            <button
              type="button"
              onClick={() => setShowCancelPrompt(false)}
              className="text-xs text-muted hover:text-ink cursor-pointer"
            >
              ✕ Back
            </button>
          </div>

          <select
            value={cancelReasonChoice}
            onChange={(e) => setCancelReasonChoice(e.target.value)}
            className="input text-xs py-1"
          >
            <option value="Item out of stock">Item out of stock</option>
            <option value="Kitchen closing early">Kitchen closing early</option>
            <option value="Student requested cancellation">Student requested cancellation</option>
            <option value="Kitchen overwhelmed with rush">Kitchen overwhelmed with rush</option>
            <option value="Other">Other reason…</option>
          </select>

          {cancelReasonChoice === 'Other' && (
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter cancellation reason…"
              maxLength={100}
              className="input text-xs py-1"
            />
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCancelPrompt(false)}
              className="btn btn-secondary flex-1 py-1.5 text-xs cursor-pointer"
            >
              Keep Order
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={busy}
              className="btn bg-danger hover:bg-danger/90 text-white flex-1 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {busy ? 'Cancelling…' : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      ) : showPinPrompt ? (
        /* Interactive PIN verification box when completing delivery */
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
        /* Action Buttons */
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
                onClick={() => setShowCancelPrompt(true)}
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
