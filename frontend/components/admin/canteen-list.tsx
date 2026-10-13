'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api-client';
import type { AdminCanteen } from '../../../shared/src/types/canteen.types';

function CanteenRow({ canteen }: { canteen: AdminCanteen }) {
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: () => adminApi.updateCanteen(canteen._id, { isActive: !canteen.isActive }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-canteens'] });
      toast.success(updated.isActive ? 'Canteen is now visible.' : 'Canteen hidden from students.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not update the canteen.')),
  });

  return (
    <li className="flex items-start justify-between gap-3 p-4 sm:p-5">
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{canteen.name}</p>
        <p className="truncate text-sm text-muted">{canteen.location}</p>
        <p className="mt-1 text-sm text-muted">
          {canteen.ownerId ? (
            <>Owner: {canteen.ownerId.name}</>
          ) : (
            <span className="text-danger">No owner assigned</span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={
            canteen.isActive
              ? 'badge badge-accent'
              : 'badge bg-line text-muted'
          }
        >
          {canteen.isActive ? 'Visible' : 'Hidden'}
        </span>
        <button
          type="button"
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
          className="text-sm font-medium text-accent transition-colors hover:text-accent-hover disabled:opacity-60"
        >
          {canteen.isActive ? 'Hide' : 'Make visible'}
        </button>
      </div>
    </li>
  );
}

/** Admin overview of all canteens (including hidden and owner-less ones). */
export function CanteenList({ canteens }: { canteens: AdminCanteen[] }) {
  if (canteens.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
        No canteens yet. Add your first canteen to get started.
      </p>
    );
  }

  return (
    <ul className="card divide-y divide-line overflow-hidden">
      {canteens.map((c) => (
        <CanteenRow key={c._id} canteen={c} />
      ))}
    </ul>
  );
}
