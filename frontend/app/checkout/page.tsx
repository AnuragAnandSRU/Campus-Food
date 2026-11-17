'use client';

import Link from 'next/link';
import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { useRequireStudent } from '@/lib/use-require-student';
import { orderApi } from '@/lib/api/order';
import { canteenApi } from '@/lib/api/canteen';
import { menuApi } from '@/lib/api/menu';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';
import { SiteHeader } from '@/components/site-header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { formatCurrency, isCanteenOpen } from '@/lib/utils';

export default function CheckoutPage() {
  const ready = useRequireStudent();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const items = useCartStore((s) => s.items);
  const canteenId = useCartStore((s) => s.canteenId);
  const total = useCartStore((s) => s.getTotal());
  const clearCart = useCartStore((s) => s.clearCart);

  // Live canteen status validation (operating hours & active status)
  const canteenQuery = useQuery({
    queryKey: ['canteen-checkout', canteenId],
    queryFn: () => canteenApi.getById(canteenId!),
    enabled: Boolean(canteenId),
  });

  // Live menu validation (catches sold-out items if arriving directly or via reorder)
  const menuQuery = useQuery({
    queryKey: ['canteen-menu-checkout', canteenId],
    queryFn: () => menuApi.getByCanteen(canteenId!),
    enabled: Boolean(canteenId),
    staleTime: 10000,
  });

  const canteen = canteenQuery.data;
  const isHoursOpen = canteen ? isCanteenOpen(canteen.openingHours) : true;
  const isCanteenActive = canteen ? canteen.isActive : true;
  const isOrderingAllowed = Boolean(isCanteenActive && isHoursOpen);

  const liveMenu = useMemo(() => menuQuery.data ?? [], [menuQuery.data]);
  const liveMenuMap = useMemo(() => new Map(liveMenu.map((m) => [m._id, m])), [liveMenu]);

  const unavailableItemIds = useMemo(() => {
    if (!menuQuery.isSuccess) return new Set<string>();
    return new Set(
      items
        .filter((item) => {
          const live = liveMenuMap.get(item.menuItemId);
          return !live || !live.isAvailable;
        })
        .map((i) => i.menuItemId)
    );
  }, [menuQuery.isSuccess, items, liveMenuMap]);

  const hasUnavailableItems = unavailableItemIds.size > 0;

  const [hostelBlock, setHostelBlock] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ hostelBlock?: string; roomNumber?: string }>({});
  const [placing, setPlacing] = useState(false);
  const [resending, setResending] = useState(false);
  const placingRef = useRef(false);

  // Prefill the delivery address from the student's saved profile without cascading effects.
  const [syncedUserKey, setSyncedUserKey] = useState('');
  const currentUserKey = user ? `${user._id}:${user.hostelBlock ?? ''}:${user.roomNumber ?? ''}` : '';
  if (user && syncedUserKey !== currentUserKey) {
    setSyncedUserKey(currentUserKey);
    setHostelBlock(user.hostelBlock ?? '');
    setRoomNumber(user.roomNumber ?? '');
  }

  async function handleResendVerification() {
    setResending(true);
    try {
      await authApi.resendVerification();
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not resend email.'));
    } finally {
      setResending(false);
    }
  }

  function validate() {
    const next: typeof errors = {};
    if (!hostelBlock.trim()) next.hostelBlock = 'Hostel block is required.';
    if (!roomNumber.trim()) next.roomNumber = 'Room number is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (placingRef.current || placing) return;
    if (user && !user.isVerified) {
      toast.error('Please verify your email address before placing an order.');
      return;
    }
    if (!validate()) {
      toast.error('Please add your hostel block and room number.');
      return;
    }
    if (!isOrderingAllowed) {
      toast.error('This canteen is currently closed or offline.');
      return;
    }
    if (hasUnavailableItems) {
      toast.error('Please remove sold out items from your cart before placing an order.');
      return;
    }
    if (!canteenId || items.length === 0) return;

    placingRef.current = true;
    setPlacing(true);
    try {
      const order = await orderApi.create({
        canteenId,
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        deliveryAddress: { hostelBlock: hostelBlock.trim(), roomNumber: roomNumber.trim() },
        paymentMethod: 'cash_on_delivery',
        specialInstructions: notes.trim() || undefined,
      });

      // Automatically sync updated delivery address to profile if checked
      if (saveToProfile && user) {
        try {
          const updated = await authApi.updateProfile({
            hostelBlock: hostelBlock.trim(),
            roomNumber: roomNumber.trim(),
          });
          setUser(updated);
        } catch {
          // Non-blocking: order was already created successfully
        }
      }

      clearCart();
      toast.success('Order placed successfully!');
      router.replace(`/orders/${order._id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not place your order. Please try again.'));
    } finally {
      placingRef.current = false;
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Cart', href: '/cart' },
            { label: 'Checkout' },
          ]}
        />

        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Checkout</h1>

        {user && !user.isVerified && (
          <div className="card mt-4 border-amber-300 bg-amber-50/70 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <Mail className="h-6 w-6 text-amber-700 shrink-0" />
                <div>
                  <h2 className="font-display text-sm font-semibold text-ink">
                    Email verification required
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    We sent a verification link to <strong className="text-ink">{user.email}</strong>. 
                    Please confirm your email before placing an order.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="btn btn-secondary text-xs px-3.5 py-1.5 shrink-0 disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend link'}
              </button>
            </div>
          </div>
        )}

        {/* Canteen Temporarily Offline Alert */}
        {canteen && !canteen.isActive && (
          <div className="card mt-4 border-red-300 bg-red-50/80 p-4 text-xs sm:text-sm text-red-900 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
            <div>
              <p className="font-semibold">This canteen is temporarily offline</p>
              <p className="text-xs text-red-700 mt-0.5">
                The kitchen is currently paused and cannot accept new orders right now.
              </p>
            </div>
          </div>
        )}

        {/* Canteen Closed Hours Alert */}
        {canteen && canteen.isActive && !isHoursOpen && (
          <div className="card mt-4 border-amber-300 bg-amber-50/80 p-4 text-xs sm:text-sm text-amber-900 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-700 shrink-0" />
            <div>
              <p className="font-semibold">Canteen is currently closed</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Operating hours are {canteen.openingHours?.open} to {canteen.openingHours?.close}. Ordering is paused until opening time.
              </p>
            </div>
          </div>
        )}

        {/* Sold-out Items Warning Alert */}
        {hasUnavailableItems && (
          <div className="card mt-4 border-red-300 bg-red-50/80 p-4 text-xs sm:text-sm text-red-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
              <div>
                <p className="font-semibold">Some dishes in your order are sold out</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Please return to your cart and remove sold-out dishes before placing this order.
                </p>
              </div>
            </div>
            <Link href="/cart" className="btn btn-secondary text-xs px-3 py-1.5 shrink-0">
              Edit cart
            </Link>
          </div>
        )}

        {!ready ? (
          <p className="mt-6 text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">Nothing to check out</p>
            <p className="mt-1 font-light text-muted">Your cart is empty.</p>
            <Link href="/canteens" className="btn btn-primary mt-5 inline-flex">
              Browse canteens
            </Link>
          </div>
        ) : (
          <form onSubmit={placeOrder} className="mt-6 space-y-6">
            {/* Order summary */}
            <section className="card p-5">
              <h2 className="font-display font-semibold text-ink">
                Order from {canteen?.name || items[0]?.canteenName || 'Canteen'}
              </h2>
              <div className="mt-3 space-y-2 text-sm">
                {items.map((i) => {
                  const isSoldOut = unavailableItemIds.has(i.menuItemId);
                  return (
                    <div key={i.menuItemId} className="flex justify-between items-center">
                      <span
                        className={`text-muted flex items-center gap-1.5 ${
                          isSoldOut ? 'line-through text-red-600' : ''
                        }`}
                      >
                        <span>
                          {i.quantity} × {i.name}
                        </span>
                        {isSoldOut && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 not-italic no-underline">
                            Sold out
                          </span>
                        )}
                      </span>
                      <span className="text-ink">{formatCurrency(i.price * i.quantity)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-between border-t border-line pt-3">
                <span className="font-medium text-ink">Total</span>
                <span className="font-display text-lg font-semibold text-ink">
                  {formatCurrency(total)}
                </span>
              </div>
            </section>

            {/* Delivery address */}
            <section className="card p-5">
              <h2 className="font-display font-semibold text-ink">Deliver to</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-muted">Hostel block</span>
                  <input
                    className={`input mt-1 ${errors.hostelBlock ? 'border-danger focus:border-danger' : ''}`}
                    value={hostelBlock}
                    maxLength={50}
                    onChange={(e) => {
                      setHostelBlock(e.target.value);
                      if (errors.hostelBlock) setErrors((prev) => ({ ...prev, hostelBlock: undefined }));
                    }}
                    placeholder="e.g. Block C"
                  />
                  {errors.hostelBlock && (
                    <span className="mt-1 block text-xs text-danger">{errors.hostelBlock}</span>
                  )}
                </label>
                <label className="block">
                  <span className="text-sm text-muted">Room number</span>
                  <input
                    className={`input mt-1 ${errors.roomNumber ? 'border-danger focus:border-danger' : ''}`}
                    value={roomNumber}
                    maxLength={50}
                    onChange={(e) => {
                      setRoomNumber(e.target.value);
                      if (errors.roomNumber) setErrors((prev) => ({ ...prev, roomNumber: undefined }));
                    }}
                    placeholder="e.g. C-214"
                  />
                  {errors.roomNumber && (
                    <span className="mt-1 block text-xs text-danger">{errors.roomNumber}</span>
                  )}
                </label>
              </div>

              <label className="mt-3 flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToProfile}
                  onChange={(e) => setSaveToProfile(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-accent focus:ring-accent accent-accent"
                />
                <span className="text-xs text-muted">
                  Save this room address as my default delivery address in profile
                </span>
              </label>

              {user?.phone && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-surface p-3 text-xs border border-line text-muted">
                  <span className="flex items-center gap-1.5 text-ink font-medium">
                    <Phone className="h-3.5 w-3.5 text-accent" />
                    <span>{user.phone}</span>
                    <span className="text-muted font-normal">· Runner will call on arrival</span>
                  </span>
                  <Link href="/profile" className="text-accent hover:underline font-semibold ml-2">
                    Edit
                  </Link>
                </div>
              )}

              <label className="mt-3 block">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>Notes for the kitchen (optional)</span>
                  <span className="text-xs">{notes.length}/500</span>
                </div>
                <textarea
                  className="input mt-1 resize-none"
                  rows={2}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Less spicy, call on arrival"
                />
              </label>
            </section>

            {/* Payment method */}
            <section className="card p-5">
              <h2 className="font-display font-semibold text-ink">Payment</h2>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-accent bg-accent-tint/50 px-4 py-3">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border-[5px] border-accent" />
                  <span className="font-medium text-ink">Cash on delivery</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 opacity-60">
                  <span className="h-4 w-4 rounded-full border-2 border-line" />
                  <span className="text-muted">Pay online</span>
                  <span className="badge ml-auto bg-highlight-tint text-xs text-ink">
                    Coming soon
                  </span>
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={
                placing ||
                Boolean(user && !user.isVerified) ||
                !isOrderingAllowed ||
                hasUnavailableItems
              }
              className="btn btn-primary w-full disabled:opacity-60 cursor-pointer"
            >
              {placing
                ? 'Placing order…'
                : user && !user.isVerified
                ? 'Verify your email to place order'
                : canteen && !canteen.isActive
                ? 'Canteen is temporarily offline'
                : canteen && !isHoursOpen
                ? 'Canteen is currently closed'
                : hasUnavailableItems
                ? 'Remove sold out items to place order'
                : `Place order · ${formatCurrency(total)}`}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
