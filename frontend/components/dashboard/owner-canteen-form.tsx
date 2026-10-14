'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api-client';
import { Field } from '@/components/auth/field';
import type { Canteen } from '../../../shared/src/types/canteen.types';

const TIME = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Lets a canteen owner edit their own canteen. Prefilled from the current
 * record; submits via PATCH /canteens/:id (adminApi.updateCanteen), which the
 * backend scopes to the owner's canteen. The "Open for orders" switch maps to
 * isActive — unchecking hides the canteen from students.
 */
export function OwnerCanteenForm({ canteen }: { canteen: Canteen }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: canteen.name,
    description: canteen.description,
    location: canteen.location,
    image: canteen.image ?? '',
    open: canteen.openingHours.open,
    close: canteen.openingHours.close,
  });
  const [isActive, setIsActive] = useState(canteen.isActive);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updateCanteen(canteen._id, {
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        image: form.image.trim() || undefined,
        openingHours: { open: form.open, close: form.close },
        isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canteen', canteen._id] });
      queryClient.invalidateQueries({ queryKey: ['canteens'] });
      toast.success('Canteen updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not update the canteen')),
  });

  function update(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const next: Partial<Record<keyof typeof form, string>> = {};
    if (!form.name.trim()) next.name = 'Canteen name is required.';
    if (!form.description.trim()) next.description = 'Add a short description.';
    if (!form.location.trim()) next.location = 'Where is it located?';
    if (!TIME.test(form.open)) next.open = 'Use HH:MM.';
    if (!TIME.test(form.close)) next.close = 'Use HH:MM.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) mutation.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
      <Field label="Canteen name" name="name" value={form.name} onChange={update} error={errors.name} />
      <Field
        label="Description"
        name="description"
        value={form.description}
        onChange={update}
        error={errors.description}
      />
      <Field label="Location" name="location" value={form.location} onChange={update} error={errors.location} />
      <Field
        label="Image URL"
        name="image"
        hint="Optional — leave blank to use a placeholder."
        placeholder="https://…"
        value={form.image}
        onChange={update}
        error={errors.image}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Opens at" name="open" type="time" value={form.open} onChange={update} error={errors.open} />
        <Field label="Closes at" name="close" type="time" value={form.close} onChange={update} error={errors.close} />
      </div>

      <label className="flex items-center gap-3 rounded-xl bg-surface/60 p-4 ring-1 ring-line">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
        />
        <span className="text-sm text-ink">
          Open for orders
          <span className="block text-xs text-muted">
            Uncheck to hide this canteen from students (e.g. when you&apos;re closed).
          </span>
        </span>
      </label>

      <button type="submit" disabled={mutation.isPending} className="btn btn-primary disabled:opacity-60">
        {mutation.isPending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
