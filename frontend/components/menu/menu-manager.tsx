'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { menuApi } from '@/lib/api/menu';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { MenuItemForm } from '@/components/menu/menu-item-form';
import type { MenuCategory, MenuItem } from '../../../shared/src/types/menu.types';

const CATEGORY_ORDER: MenuCategory[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Beverages',
  'Desserts',
];

interface MenuManagerProps {
  canteenId: string;
  /** Owner or staff-with-manage_menu: may add / edit / delete. */
  canManage: boolean;
}

/**
 * Self-contained menu manager: the item list, the add/edit form, the
 * availability switch and delete all live here, so the page around it is a thin
 * wrapper. Availability is shown to everyone who can reach the screen (any
 * owner/staff of the canteen may flip stock); add/edit/delete render only when
 * `canManage` is true. The server enforces all of this regardless.
 */
export function MenuManager({ canteenId, canManage }: MenuManagerProps) {
  const [editing, setEditing] = useState<MenuItem | 'new' | null>(null);
  const [search, setSearch] = useState('');

  const menuQuery = useQuery({
    queryKey: ['menu', canteenId],
    queryFn: () => menuApi.getByCanteen(canteenId),
  });

  const items = menuQuery.data ?? [];
  const q = search.trim().toLowerCase();
  const filteredItems = q
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      )
    : items;

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: filteredItems.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-light text-muted">
          {items.length} {items.length === 1 ? 'item' : 'items'} on the menu
        </p>
        {canManage && !editing && (
          <button onClick={() => setEditing('new')} className="btn btn-primary">
            Add item
          </button>
        )}
      </div>

      {editing && (
        <MenuItemForm
          canteenId={canteenId}
          item={editing === 'new' ? null : editing}
          onDone={() => setEditing(null)}
        />
      )}

      {items.length > 0 && !editing && (
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes by name or category (e.g. Chai, Samosa, Lunch)..."
            className="input w-full pl-9 pr-16 text-sm"
          />
          <span className="absolute left-3 top-2.5 text-xs text-muted" aria-hidden>
            🔍
          </span>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2 text-xs text-muted hover:text-ink cursor-pointer bg-line/30 rounded px-1.5 py-0.5"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {q && grouped.length === 0 && !editing && !menuQuery.isLoading && (
        <div className="card p-8 text-center">
          <p className="font-display text-ink">No dishes match &ldquo;{search}&rdquo;</p>
          <button onClick={() => setSearch('')} className="btn btn-secondary mt-3 text-xs">
            Clear search
          </button>
        </div>
      )}

      {menuQuery.isLoading && <ListSkeleton />}

      {menuQuery.isError && (
        <div className="card p-10 text-center">
          <p className="font-display text-lg text-ink">Couldn&apos;t load the menu</p>
          <button onClick={() => menuQuery.refetch()} className="btn btn-secondary mt-4">
            Try again
          </button>
        </div>
      )}

      {!menuQuery.isLoading && !menuQuery.isError && items.length === 0 && !editing && (
        <div className="card p-10 text-center">
          <p className="font-display text-lg text-ink">No menu items yet</p>
          <p className="mt-1 font-light text-muted">
            {canManage
              ? 'Add your first dish to start taking orders.'
              : 'The owner hasn&apos;t added any items yet.'}
          </p>
        </div>
      )}

      {grouped.map((group) => (
        <section key={group.cat} className="space-y-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
            {group.cat}
          </h2>
          <div className="space-y-3">
            {group.items.map((item) => (
              <MenuRow
                key={item._id}
                item={item}
                canteenId={canteenId}
                canManage={canManage}
                onEdit={() => setEditing(item)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface MenuRowProps {
  item: MenuItem;
  canteenId: string;
  canManage: boolean;
  onEdit: () => void;
}

function MenuRow({ item, canteenId, canManage, onEdit }: MenuRowProps) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['menu', canteenId] });

  const toggle = useMutation({
    mutationFn: () => menuApi.setAvailability(item._id, !item.isAvailable),
    onSuccess: (updated) => {
      invalidate();
      toast.success(updated.isAvailable ? 'Marked in stock' : 'Marked out of stock');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not update stock')),
  });

  const remove = useMutation({
    mutationFn: () => menuApi.remove(item._id),
    onSuccess: () => {
      invalidate();
      toast.success('Item deleted');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not delete item')),
  });

  const handleDelete = () => {
    if (window.confirm(`Delete “${item.name}”? This can't be undone.`)) remove.mutate();
  };

  return (
    <div
      className={`card flex flex-wrap items-center gap-4 p-4 ${
        item.isAvailable ? '' : 'opacity-60'
      }`}
    >
      <VegBadge isVeg={item.isVeg} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{item.name}</p>
        <p className="truncate text-sm font-light text-muted">{item.description}</p>
      </div>

      <div className="text-right">
        <p className="font-medium text-ink">{formatCurrency(item.price)}</p>
        <p className="text-xs text-muted">{item.preparationTime} min</p>
      </div>

      <button
        onClick={() => toggle.mutate()}
        disabled={toggle.isPending}
        className={`badge ${item.isAvailable ? 'badge-accent' : ''} disabled:opacity-50`}
        title="Tap to toggle stock"
      >
        {item.isAvailable ? 'In stock' : 'Out of stock'}
      </button>

      {canManage && (
        <div className="flex gap-2">
          <button onClick={onEdit} className="btn btn-secondary px-3 py-1.5 text-sm">
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={remove.isPending}
            className="px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/** Green square = veg, red square = non-veg (standard Indian menu convention). */
function VegBadge({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
        isVeg ? 'border-accent' : 'border-danger'
      }`}
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span className={`h-2 w-2 rounded-full ${isVeg ? 'bg-accent' : 'bg-danger'}`} />
    </span>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card h-20 animate-pulse bg-accent-tint/40" />
      ))}
    </div>
  );
}
