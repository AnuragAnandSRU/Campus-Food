'use client';

import { useState, useEffect } from 'react';
import {
  Bike,
  Check,
  ChefHat,
  Clock,
  PackageCheck,
  PartyPopper,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import type { OrderStatus } from '../../../shared/src/types/order.types';

interface OrderStatusTrackerProps {
  status: OrderStatus;
  canteenName?: string;
  cancelReason?: string;
  estimatedDeliveryTime?: Date | string;
}

const STEPS = [
  { key: 'placed', label: 'Placed', icon: Check, match: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'] },
  { key: 'cooking', label: 'Cooking', icon: ChefHat, match: ['preparing', 'ready', 'out_for_delivery', 'delivered'] },
  { key: 'ready', label: 'Ready', icon: PackageCheck, match: ['ready', 'out_for_delivery', 'delivered'] },
  { key: 'delivery', label: 'On Way', icon: Bike, match: ['out_for_delivery', 'delivered'] },
  { key: 'delivered', label: 'Delivered', icon: PartyPopper, match: ['delivered'] },
];

export function OrderStatusTracker({
  status,
  canteenName,
  cancelReason,
  estimatedDeliveryTime,
}: OrderStatusTrackerProps) {
  const [now, setNow] = useState(() => Date.now());

  // Gentle 30-second live countdown ticker so minutes update while student watches
  useEffect(() => {
    if (!estimatedDeliveryTime || status === 'delivered') return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, [estimatedDeliveryTime, status]);

  if (status === 'cancelled') {
    return (
      <div className="mt-4 flex flex-col items-center text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger border border-danger/20 shadow-sm">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
          Order cancelled
        </h1>
        <p className="mt-1 font-light text-muted max-w-md text-sm">
          {cancelReason?.trim() ? cancelReason : 'This order has been cancelled.'}
        </p>
      </div>
    );
  }

  // Active or completed banner details
  const details = (() => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          title: 'Order Placed',
          subtitle: `Waiting for ${canteenName ?? 'the canteen'} to confirm your order.`,
        };
      case 'confirmed':
        return {
          icon: ThumbsUp,
          title: 'Order Confirmed',
          subtitle: `${canteenName ?? 'The kitchen'} accepted your order and will start cooking shortly.`,
        };
      case 'preparing':
        return {
          icon: ChefHat,
          title: 'Cooking in Progress',
          subtitle: 'The chef is actively preparing your fresh meal.',
        };
      case 'ready':
        return {
          icon: PackageCheck,
          title: 'Ready & Packed',
          subtitle: 'Your food is packed and ready for handover to delivery.',
        };
      case 'out_for_delivery':
        return {
          icon: Bike,
          title: 'Out for Delivery',
          subtitle: 'On the way to your hostel block and room number!',
        };
      case 'delivered':
        return {
          icon: PartyPopper,
          title: 'Delivered',
          subtitle: `Order completed! Thank you for ordering from ${canteenName ?? 'Campus Food'}.`,
        };
      default:
        return {
          icon: Check,
          title: 'Order Processing',
          subtitle: 'Your order is being handled.',
        };
    }
  })();

  const etaText = (() => {
    if (!estimatedDeliveryTime || status === 'delivered') return null;
    const diffMs = new Date(estimatedDeliveryTime).getTime() - now;
    const diffMins = Math.round(diffMs / (60 * 1000));
    const timeFormatted = new Date(estimatedDeliveryTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    if (diffMins <= 0) {
      return `Arriving shortly (around ${timeFormatted})`;
    }
    return `Estimated arrival: ~${diffMins} mins (by ${timeFormatted})`;
  })();

  const currentStepIndex = (() => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 0;
      case 'preparing':
        return 1;
      case 'ready':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  })();

  const IconComponent = details.icon;

  return (
    <div className="mt-4 flex flex-col items-center text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-tint text-accent shadow-sm border border-accent/20">
        <IconComponent className="h-8 w-8" />
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
        {details.title}
      </h1>
      <p className="mt-1 font-light text-muted max-w-md text-sm">
        {details.subtitle}
      </p>

      {/* Dynamic Estimated Arrival Badge */}
      {etaText && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-tint/70 px-3.5 py-1 text-xs font-semibold text-accent ring-1 ring-accent/30 animate-pulse">
          <Clock className="h-3.5 w-3.5" />
          <span>{etaText}</span>
        </div>
      )}

      {/* Progress Stepper */}
      <div className="w-full max-w-md mt-6 pt-4 border-t border-line/60">
        <div className="grid grid-cols-5 gap-1 relative">
          {STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const StepIcon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center gap-1.5 text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-accent text-white ring-4 ring-accent/20 shadow-sm scale-110'
                      : isCompleted
                      ? 'bg-accent text-white'
                      : 'bg-surface border border-line text-muted'
                  }`}
                >
                  <StepIcon className="h-4 w-4" />
                </div>
                <span
                  className={`text-[11px] leading-tight ${
                    isCurrent
                      ? 'font-semibold text-accent'
                      : isCompleted
                      ? 'font-medium text-ink'
                      : 'text-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
