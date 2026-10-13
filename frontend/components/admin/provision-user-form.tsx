'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api-client';
import { Field } from '@/components/auth/field';
import { InviteLinkCard } from '@/components/admin/invite-link-card';
import type { AdminCanteen } from '../../../shared/src/types/canteen.types';
import type {
  ProvisionResult,
  StaffDuty,
  StaffPermission,
} from '../../../shared/src/types/user.types';

const INITIAL = { name: '', email: '', phone: '', role: 'staff' as 'staff' | 'owner', canteenId: '' };
type FormErrors = Partial<Record<keyof typeof INITIAL | 'duties', string>>;

const DUTY_OPTIONS: { value: StaffDuty; label: string }[] = [
  { value: 'kitchen', label: 'Kitchen — prepares orders' },
  { value: 'delivery', label: 'Delivery — takes orders to rooms' },
];
const PERMISSION_OPTIONS: { value: StaffPermission; label: string }[] = [
  { value: 'manage_menu', label: 'Manage menu — add & edit items' },
  { value: 'view_analytics', label: 'View analytics — see sales numbers' },
];

/**
 * Admin form to provision a staff or owner account. On success it surfaces the
 * invitation link (copy fallback) and lets the admin invite another person.
 */
export function ProvisionUserForm({
  canteens,
  onDone,
}: {
  canteens: AdminCanteen[];
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(INITIAL);
  const [duties, setDuties] = useState<StaffDuty[]>([]);
  const [permissions, setPermissions] = useState<StaffPermission[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<ProvisionResult | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.provisionUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        canteenId: form.canteenId,
        // Duties/powers only apply to staff; an owner runs the whole canteen.
        staffDuties: form.role === 'staff' ? duties : [],
        permissions: form.role === 'staff' ? permissions : [],
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-canteens'] });
      toast.success('Invitation created.');
      setResult(res);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not create the invitation.')),
  });

  function update(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleDuty(value: StaffDuty) {
    setDuties((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  }

  function togglePermission(value: StaffPermission) {
    setPermissions((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  }

  function validate() {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!/^\d{10}$/.test(form.phone.trim())) next.phone = 'Enter a 10-digit phone number.';
    if (!form.canteenId) next.canteenId = 'Choose a canteen.';
    if (form.role === 'staff' && duties.length === 0)
      next.duties = 'Assign at least one duty.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) mutation.mutate();
  }

  function inviteAnother() {
    setResult(null);
    setForm(INITIAL);
    setDuties([]);
    setPermissions([]);
    setErrors({});
  }

  if (result) {
    return (
      <div className="space-y-4">
        <InviteLinkCard name={result.user.name} link={result.inviteLink} />
        <div className="flex gap-3">
          <button type="button" onClick={inviteAnother} className="btn btn-secondary">
            Invite another
          </button>
          <button type="button" onClick={onDone} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field
        label="Full name"
        name="name"
        placeholder="e.g. Priya Sharma"
        value={form.name}
        onChange={update}
        error={errors.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        placeholder="their@email.com"
        value={form.email}
        onChange={update}
        error={errors.email}
      />
      <Field
        label="Phone number"
        name="phone"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="10-digit mobile number"
        value={form.phone}
        onChange={update}
        error={errors.phone}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="role" className="block text-sm font-medium text-ink">
            Role
          </label>
          <select id="role" name="role" value={form.role} onChange={update} className="input">
            <option value="staff">Staff — manages &amp; delivers orders</option>
            <option value="owner">Owner — runs the canteen</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="canteenId" className="block text-sm font-medium text-ink">
            Canteen
          </label>
          <select
            id="canteenId"
            name="canteenId"
            value={form.canteenId}
            onChange={update}
            className="input"
            aria-invalid={errors.canteenId ? true : undefined}
          >
            <option value="">Select a canteen…</option>
            {canteens.map((c) => {
              const ownerTaken = form.role === 'owner' && !!c.ownerId;
              return (
                <option key={c._id} value={c._id} disabled={ownerTaken}>
                  {c.name}
                  {ownerTaken ? ' (owner assigned)' : ''}
                </option>
              );
            })}
          </select>
          {errors.canteenId && <p className="text-sm text-danger">{errors.canteenId}</p>}
        </div>
      </div>

      {form.role === 'staff' && (
        <div className="space-y-5 rounded-xl bg-surface/60 p-4 ring-1 ring-line">
          <fieldset>
            <legend className="text-sm font-medium text-ink">Duties</legend>
            <p className="mt-0.5 text-xs text-muted">
              What this staff member does. Pick at least one.
            </p>
            <div className="mt-2 space-y-2">
              {DUTY_OPTIONS.map((d) => (
                <label key={d.value} className="flex items-center gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={duties.includes(d.value)}
                    onChange={() => toggleDuty(d.value)}
                    className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
                  />
                  {d.label}
                </label>
              ))}
            </div>
            {errors.duties && <p className="mt-1.5 text-sm text-danger">{errors.duties}</p>}
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-ink">
              Extra powers <span className="font-normal text-muted">(optional)</span>
            </legend>
            <p className="mt-0.5 text-xs text-muted">Grant only what you trust them with.</p>
            <div className="mt-2 space-y-2">
              {PERMISSION_OPTIONS.map((p) => (
                <label key={p.value} className="flex items-center gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={permissions.includes(p.value)}
                    onChange={() => togglePermission(p.value)}
                    className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={mutation.isPending} className="btn btn-primary disabled:opacity-60">
          {mutation.isPending ? 'Creating…' : 'Create invitation'}
        </button>
        <button type="button" onClick={onDone} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
