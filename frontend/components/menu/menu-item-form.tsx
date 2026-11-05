'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Field } from '@/components/auth/field';
import { SubmitButton } from '@/components/auth/submit-button';
import { ImageUploadField } from '@/components/ui/image-upload-field';
import { menuApi } from '@/lib/api/menu';
import { getApiErrorMessage } from '@/lib/api-client';
import type { MenuCategory, MenuItem } from '../../../shared/src/types/menu.types';

const CATEGORIES: MenuCategory[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Beverages',
  'Desserts',
];

interface MenuItemFormProps {
  canteenId: string;
  /** The item being edited, or null/undefined to create a new one. */
  item?: MenuItem | null;
  /** Called after a successful save, or when the user cancels. */
  onDone: () => void;
}

/**
 * Add / edit form for a single menu item. Client-side validation mirrors the
 * backend validator so users get instant feedback; the server stays the source
 * of truth. canteenId is only used on create — the server ignores it anyway and
 * always files items under the actor's own canteen.
 */
export function MenuItemForm({ canteenId, item, onDone }: MenuItemFormProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(item);

  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item?.price != null ? String(item.price) : '',
    category: (item?.category ?? 'Snacks') as MenuCategory,
    isVeg: item ? (item.isVeg ? 'veg' : 'nonveg') : 'veg',
    preparationTime: item?.preparationTime != null ? String(item.preparationTime) : '15',
    image: item?.image ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        isVeg: form.isVeg === 'veg',
        preparationTime: Number(form.preparationTime),
        image: form.image.trim() || undefined,
      };
      return item
        ? menuApi.update(item._id, payload)
        : menuApi.create({ canteenId, ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', canteenId] });
      toast.success(isEdit ? 'Item updated' : 'Item added');
      onDone();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save item')),
  });

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Item name is required';
    if (!form.description.trim()) next.description = 'Description is required';
    const price = Number(form.price);
    if (form.price === '' || Number.isNaN(price) || price < 0)
      next.price = 'Price must be zero or more';
    const prep = Number(form.preparationTime);
    if (!Number.isInteger(prep) || prep < 1)
      next.preparationTime = 'Preparation time must be at least 1 minute';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">
          {isEdit ? 'Edit item' : 'New item'}
        </h3>
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-muted transition-colors hover:text-ink"
        >
          Cancel
        </button>
      </div>

      <Field
        label="Name"
        name="name"
        value={form.name}
        onChange={(e) => set('name')(e.target.value)}
        error={errors.name}
        placeholder="Paneer Butter Masala"
      />

      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-ink">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          value={form.description}
          onChange={(e) => set('description')(e.target.value)}
          className="input"
          placeholder="Creamy tomato gravy with soft paneer cubes."
        />
        {errors.description && <p className="text-sm text-danger">{errors.description}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Price (₹)"
          name="price"
          type="number"
          min={0}
          step="1"
          value={form.price}
          onChange={(e) => set('price')(e.target.value)}
          error={errors.price}
          placeholder="120"
        />
        <Field
          label="Prep time (min)"
          name="preparationTime"
          type="number"
          min={1}
          step="1"
          value={form.preparationTime}
          onChange={(e) => set('preparationTime')(e.target.value)}
          error={errors.preparationTime}
          placeholder="15"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="category" className="block text-sm font-medium text-ink">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={(e) => set('category')(e.target.value)}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="isVeg" className="block text-sm font-medium text-ink">
            Food type
          </label>
          <select
            id="isVeg"
            name="isVeg"
            value={form.isVeg}
            onChange={(e) => set('isVeg')(e.target.value)}
            className="input"
          >
            <option value="veg">Veg</option>
            <option value="nonveg">Non-veg</option>
          </select>
        </div>
      </div>

      <ImageUploadField
        label="Dish Photo"
        value={form.image}
        onChange={(url) => set('image')(url)}
        folder="dishes"
        hint="Upload a photo from your device or paste a link."
      />

      <div className="flex gap-3 pt-1">
        <SubmitButton pending={mutation.isPending}>
          {isEdit ? 'Save changes' : 'Add item'}
        </SubmitButton>
      </div>
    </form>
  );
}
