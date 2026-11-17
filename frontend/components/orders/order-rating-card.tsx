'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderApi } from '@/lib/api/order';
import { getApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import type { Order } from '../../../shared/src/types/order.types';

interface OrderRatingCardProps {
  order: Order;
  canteenName?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Disappointing',
  2: 'Could be better',
  3: 'Good meal',
  4: 'Very tasty!',
  5: 'Exceptional!',
};

export function OrderRatingCard({ order, canteenName = 'the canteen' }: OrderRatingCardProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === 'student';

  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');

  const rateMutation = useMutation({
    mutationFn: () =>
      orderApi.rate(order._id, {
        rating: selectedRating,
        review: reviewText.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['order', order._id], updated);
      queryClient.invalidateQueries({ queryKey: ['canteen', order.canteenId] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      toast.success('Thank you for rating your food!');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to submit rating. Please try again.'));
    },
  });

  // Only delivered orders can be rated
  if (order.status !== 'delivered') return null;

  // Already rated view: visible to both student and canteen staff/owner
  if (order.rating) {
    return (
      <div className="card mt-6 p-5 border-accent/20 bg-accent-tint/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-accent">
              {isStudent ? 'Your Review' : 'Student Feedback'}
            </p>
            <p className="mt-1 font-display text-base font-semibold text-ink">
              {isStudent
                ? `You rated this order ${order.rating} / 5`
                : `Rated ${order.rating} / 5 by student`}
            </p>
          </div>
          <div className="flex text-lg text-highlight gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= order.rating!
                    ? 'fill-highlight text-highlight'
                    : 'text-line'
                }`}
              />
            ))}
          </div>
        </div>

        {order.review && (
          <p className="mt-3 text-sm italic text-ink/80 border-l-2 border-accent pl-3">
            “{order.review}”
          </p>
        )}
      </div>
    );
  }

  // If the order hasn't been rated and the viewer is NOT a student (e.g. staff/owner), hide the form
  if (!isStudent) return null;

  // Not yet rated: Interactive review submission card for students
  const activeRating = hoverRating || selectedRating;

  return (
    <div className="card mt-6 p-6 border-accent/30 bg-surface shadow-sm">
      <div className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-tint text-accent">
          <UtensilsCrossed className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">
          How was your food from {canteenName}?
        </h3>
        <p className="text-xs text-muted mt-0.5">
          Your feedback helps the kitchen cook better meals and guides other campus students.
        </p>

        {/* 5-Star Interactive Selector */}
        <div className="mt-4 flex justify-center items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setSelectedRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
              title={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  star <= activeRating
                    ? 'fill-highlight text-highlight drop-shadow-xs'
                    : 'text-line hover:text-highlight/60'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Rating description text */}
        <div className="mt-2 h-5">
          {activeRating > 0 && (
            <span className="text-xs font-semibold text-accent animate-fade-in">
              {RATING_LABELS[activeRating]}
            </span>
          )}
        </div>
      </div>

      {/* Review note input */}
      <div className="mt-4">
        <textarea
          rows={2}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="What did you like or what could be improved? (optional)"
          maxLength={500}
          className="input text-sm resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-[10px] text-muted">
            {reviewText.length > 0 ? `${reviewText.length}/500` : ''}
          </span>
        </div>
      </div>

      {/* Submit button */}
      <div className="mt-3">
        <button
          type="button"
          disabled={selectedRating === 0 || rateMutation.isPending}
          onClick={() => rateMutation.mutate()}
          className="btn btn-primary w-full text-center py-2.5 text-sm disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {rateMutation.isPending
            ? 'Submitting rating…'
            : selectedRating === 0
            ? 'Select a star rating above'
            : `Submit Rating (${selectedRating} Stars)`}
        </button>
      </div>
    </div>
  );
}
