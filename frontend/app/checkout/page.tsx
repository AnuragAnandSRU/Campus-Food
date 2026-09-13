'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { useRequireAuth } from '@/lib/use-require-auth';
import { orderApi } from '@/lib/api/order';
import { getApiErrorMessage } from '@/lib/api-client';
import { SiteHeader } from '@/components/site-header';
import { formatCurrency } from '@/lib/utils';

export default function CheckoutPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const items = useCartStore((s) => s.items);
  const canteenId = useCartStore((s) => s.canteenId);
  const total = useCartStore((s) => s.getTotal());
  const clearCart = useCartStore((s) => s.clearCart);

  const [hostelBlock, setHostelBlock] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  // Prefill the delivery address from the student's saved profile.
  useEffect(() => {
    if (user) {
      setHostelBlock(user.hostelBlock ?? '');
      setRoomNumber(user.roomNumber ?? '');
    }
  }, [user]);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!hostelBlock.trim() || !roomNumber.trim()) {
      toast.error('Please add your hostel block and room number.');
      return;
    }
    if (!canteenId || items.length === 0) return;

    setPlacing(true);
    try {
      const order = await orderApi.create({
        canteenId,
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        deliveryAddress: { hostelBlock: hostelBlock.trim(), roomNumber: roomNumber.trim() },
        paymentMethod: 'cash_on_delivery',
        specialInstructions: notes.trim() || undefined,
      });
      clearCart();
      toast.success('Order placed! 🎉');
      router.push(`/orders/${order._id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not place your order. Please try again.'));
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Checkout</h1>

        {!ready ? (
          <p className="mt-6 text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">Nothing to check out</p>
            <p className="mt-1 font-light text-muted">Your cart is empty.</p>
            <Link href="/canteens" className="btn btn-primary mt-5">
              Browse canteens
            </Link>
          </div>
        ) : (
          <form onSubmit={placeOrder} className="mt-6 space-y-6">
            {/* Order summary */}
            <section className="card p-5">
              <h2 className="font-display font-semibold text-ink">
                Order from {items[0]?.canteenName}
              </h2>
              <div className="mt-3 space-y-2 text-sm">
                {items.map((i) => (
                  <div key={i.menuItemId} className="flex justify-between">
                    <span className="text-muted">
                      {i.quantity} × {i.name}
                    </span>
                    <span className="text-ink">{formatCurrency(i.price * i.quantity)}</span>
                  </div>
                ))}
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
                    className="input mt-1"
                    value={hostelBlock}
                    onChange={(e) => setHostelBlock(e.target.value)}
                    placeholder="e.g. Block C"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-muted">Room number</span>
                  <input
                    className="input mt-1"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. C-214"
                  />
                </label>
              </div>
              <label className="mt-3 block">
                <span className="text-sm text-muted">Notes for the kitchen (optional)</span>
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

            <button type="submit" disabled={placing} className="btn btn-primary w-full disabled:opacity-60">
              {placing ? 'Placing order…' : `Place order · ${formatCurrency(total)}`}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
