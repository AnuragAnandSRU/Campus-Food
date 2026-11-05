'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api-client';
import { Field } from '@/components/auth/field';
import { InviteLinkCard } from '@/components/admin/invite-link-card';
import type { AdminCanteen } from '../../../shared/src/types/canteen.types';
import type { ProvisionResult } from '../../../shared/src/types/user.types';

const INITIAL = { name: '', email: '', phone: '', canteenId: '' };
type FormErrors = Partial<Record<keyof typeof INITIAL, string>>;

/**
 * Superadmin form to provision a Canteen Owner account.
 * Note: Staff members (cooks, kitchen, delivery) are strictly invited and managed
 * by the Canteen Owner from their merchant dashboard (/dashboard/team).
 */
export function ProvisionOwnerForm({
  canteens,
  defaultCanteenId,
  onDone,
}: {
  canteens: AdminCanteen[];
  defaultCanteenId?: string;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    ...INITIAL,
    canteenId: defaultCanteenId || canteens[0]?._id || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<ProvisionResult | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.provisionUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: 'owner',
        canteenId: form.canteenId,
        staffDuties: [],
        permissions: [],
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-canteens'] });
      toast.success('Canteen Owner invitation created.');
      setResult(res);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Could not create the owner invitation.')),
  });

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!/^\d{10}$/.test(form.phone.trim())) next.phone = 'Enter a 10-digit phone number.';
    if (!form.canteenId) next.canteenId = 'Choose a canteen to assign.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  }

  // Once provisioned, display copyable link card
  if (result) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-accent/20 bg-accent-tint/15 p-4 text-xs text-accent">
          <p className="font-semibold">✓ Canteen Owner Account Provisioned</p>
          <p className="mt-1 text-muted">
            An email with the activation link has been sent to{' '}
            <strong className="text-ink">{result.user.email}</strong>. Once they set their
            password, they will have full owner access to manage their menu and onboard their staff.
          </p>
        </div>

        <InviteLinkCard
          name={result.user.name}
          link={result.inviteLink}
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setForm({
                ...INITIAL,
                canteenId: defaultCanteenId || canteens[0]?._id || '',
              });
            }}
            className="btn btn-secondary text-xs"
          >
            Provision Another Owner
          </button>
          <button type="button" onClick={onDone} className="btn btn-primary text-xs">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="canteenId" className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Assign to Canteen
        </label>
        <select
          id="canteenId"
          name="canteenId"
          value={form.canteenId}
          onChange={update}
          className="input mt-1.5 text-sm bg-white"
        >
          {canteens.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} ({c.location}) {c.ownerId ? `— Current Owner: ${c.ownerId.name}` : '— No Owner'}
            </option>
          ))}
        </select>
        {errors.canteenId && <p className="mt-1 text-xs text-danger">{errors.canteenId}</p>}
      </div>

      <Field
        label="Owner Full Name"
        name="name"
        value={form.name}
        onChange={update}
        placeholder="e.g. Ramesh Kumar"
        error={errors.name}
        autoComplete="name"
      />

      <Field
        label="Owner Email Address"
        name="email"
        type="email"
        value={form.email}
        onChange={update}
        placeholder="e.g. ramesh.canteen@gmail.com"
        error={errors.email}
        autoComplete="email"
      />

      <Field
        label="10-Digit Mobile Number"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={update}
        placeholder="e.g. 9876543210"
        error={errors.phone}
        autoComplete="tel"
      />

      <div className="rounded-xl border border-line bg-surface/50 p-3 text-xs text-muted font-light">
        ℹ️ <strong>Role Boundary:</strong> The Canteen Owner will have full authority to manage their
        canteen menu, view sales analytics, and invite their own kitchen & delivery staff.
      </div>

      <div className="flex justify-end gap-2 pt-3">
        <button
          type="button"
          onClick={onDone}
          className="btn btn-secondary text-xs"
          disabled={mutation.isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary text-xs cursor-pointer"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Provisioning…' : 'Send Owner Invitation'}
        </button>
      </div>
    </form>
  );
}
