'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api-client';
import { Field } from '@/components/auth/field';

const INITIAL = {
  name: '',
  description: '',
  location: '',
  image: '',
  open: '08:00',
  close: '22:00',
};

type FormErrors = Partial<Record<keyof typeof INITIAL, string>>;
const TIME = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

/** Admin form to create a new (unassigned) canteen. */
export function CreateCanteenForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.createCanteen({
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        image: form.image.trim() || undefined,
        openingHours: { open: form.open, close: form.close },
      }),
    onSuccess: (canteen) => {
      queryClient.invalidateQueries({ queryKey: ['admin-canteens'] });
      toast.success(`“${canteen.name}” created.`);
      setForm(INITIAL);
      onDone();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not create the canteen.')),
  });

  function update(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const next: FormErrors = {};
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
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field
        label="Canteen name"
        name="name"
        placeholder="e.g. Southern Bites"
        value={form.name}
        onChange={update}
        error={errors.name}
      />
      <Field
        label="Description"
        name="description"
        placeholder="e.g. South Indian meals, dosas & filter coffee"
        value={form.description}
        onChange={update}
        error={errors.description}
      />
      <Field
        label="Location"
        name="location"
        placeholder="e.g. Ground floor, Food Court"
        value={form.location}
        onChange={update}
        error={errors.location}
      />
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
        <Field
          label="Opens at"
          name="open"
          type="time"
          value={form.open}
          onChange={update}
          error={errors.open}
        />
        <Field
          label="Closes at"
          name="close"
          type="time"
          value={form.close}
          onChange={update}
          error={errors.close}
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={mutation.isPending} className="btn btn-primary disabled:opacity-60">
          {mutation.isPending ? 'Creating…' : 'Create canteen'}
        </button>
        <button type="button" onClick={onDone} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
