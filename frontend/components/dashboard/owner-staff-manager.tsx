'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api-client';
import { Field } from '@/components/auth/field';
import { InviteLinkCard } from '@/components/admin/invite-link-card';
import type {
  ProvisionedUser,
  ProvisionResult,
  StaffDuty,
  StaffPermission,
} from '../../../shared/src/types/user.types';

const DUTY_OPTIONS: { value: StaffDuty; label: string }[] = [
  { value: 'kitchen', label: 'Kitchen — prepares orders' },
  { value: 'delivery', label: 'Delivery — takes orders to rooms' },
];
const PERMISSION_OPTIONS: { value: StaffPermission; label: string }[] = [
  { value: 'manage_menu', label: 'Manage menu — add & edit items' },
  { value: 'view_analytics', label: 'View analytics — see sales numbers' },
];

/**
 * Self-contained team manager for a canteen owner: lists the canteen's staff,
 * invites new staff (invite-link flow), and removes them. Everything is scoped
 * to the owner's own canteen by the backend; `canteenId` is passed to the
 * invite so new staff land on the right canteen.
 */
export function OwnerStaffManager({ canteenId }: { canteenId: string }) {
  const [inviting, setInviting] = useState(false);

  const staffQuery = useQuery({
    queryKey: ['owner-staff'],
    queryFn: adminApi.listUsers,
  });

  const staff = staffQuery.data ?? [];

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-light text-muted">
          {staff.length} {staff.length === 1 ? 'person' : 'people'} on your team
        </p>
        {!inviting && (
          <button onClick={() => setInviting(true)} className="btn btn-primary">
            Invite staff
          </button>
        )}
      </div>

      {inviting && (
        <div className="card p-5">
          <InviteStaffForm canteenId={canteenId} onDone={() => setInviting(false)} />
        </div>
      )}

      {staffQuery.isLoading && <ListSkeleton />}

      {staffQuery.isError && (
        <div className="card p-10 text-center">
          <p className="font-display text-lg text-ink">Couldn&apos;t load your team</p>
          <button onClick={() => staffQuery.refetch()} className="btn btn-secondary mt-4">
            Try again
          </button>
        </div>
      )}

      {!staffQuery.isLoading && !staffQuery.isError && staff.length === 0 && !inviting && (
        <div className="card p-10 text-center">
          <p className="font-display text-lg text-ink">No staff yet</p>
          <p className="mt-1 font-light text-muted">
            Invite your first team member to help run the canteen.
          </p>
        </div>
      )}

      {staff.length > 0 && (
        <ul className="card divide-y divide-line overflow-hidden">
          {staff.map((u) => (
            <StaffRow key={u._id} user={u} />
          ))}
        </ul>
      )}
    </div>
  );
}

function StaffRow({ user }: { user: ProvisionedUser }) {
  const queryClient = useQueryClient();
  const [link, setLink] = useState<string | null>(null);

  const resend = useMutation({
    mutationFn: () => adminApi.resendInvite(user._id),
    onSuccess: (res) => {
      setLink(res.inviteLink);
      toast.success('Fresh invitation link generated.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not resend the invitation.')),
  });

  const remove = useMutation({
    mutationFn: () => adminApi.removeUser(user._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-staff'] });
      toast.success(`Removed ${user.name}`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not remove this staff member.')),
  });

  const handleRemove = () => {
    if (window.confirm(`Remove ${user.name} from your team? This can’t be undone.`)) remove.mutate();
  };

  return (
    <li className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{user.name}</p>
          <p className="truncate text-sm text-muted">{user.email}</p>
          {user.staffDuties && user.staffDuties.length > 0 && (
            <p className="mt-1 text-xs capitalize text-muted">
              Duties: {user.staffDuties.join(' + ')}
              {user.permissions && user.permissions.length > 0 && (
                <span className="normal-case">
                  {' '}
                  · Powers: {user.permissions.map((p) => p.replace('_', ' ')).join(', ')}
                </span>
              )}
            </p>
          )}
        </div>
        <span
          className={
            user.isActive ? 'badge badge-accent shrink-0' : 'badge shrink-0 bg-highlight-tint text-ink'
          }
        >
          {user.isActive ? 'Active' : 'Invited'}
        </span>
      </div>

      {!user.isActive && link && (
        <div className="mt-3">
          <InviteLinkCard name={user.name} link={link} />
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {!user.isActive && !link && (
          <button
            type="button"
            onClick={() => resend.mutate()}
            disabled={resend.isPending}
            className="btn btn-secondary px-4 py-2 text-sm disabled:opacity-60"
          >
            {resend.isPending ? 'Generating…' : 'Resend invite'}
          </button>
        )}
        <button
          type="button"
          onClick={handleRemove}
          disabled={remove.isPending}
          className="px-3 py-2 text-sm font-medium text-danger transition-colors hover:underline disabled:opacity-50"
        >
          {remove.isPending ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </li>
  );
}

type InviteErrors = Partial<Record<'name' | 'email' | 'phone' | 'duties', string>>;

function InviteStaffForm({ canteenId, onDone }: { canteenId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [duties, setDuties] = useState<StaffDuty[]>([]);
  const [permissions, setPermissions] = useState<StaffPermission[]>([]);
  const [errors, setErrors] = useState<InviteErrors>({});
  const [result, setResult] = useState<ProvisionResult | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.provisionUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: 'staff',
        canteenId,
        staffDuties: duties,
        permissions,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['owner-staff'] });
      toast.success('Invitation created.');
      setResult(res);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not create the invitation.')),
  });

  function update(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleDuty(value: StaffDuty) {
    setDuties((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  }

  function togglePermission(value: StaffPermission) {
    setPermissions((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  }

  function validate() {
    const next: InviteErrors = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!/^\d{10}$/.test(form.phone.trim())) next.phone = 'Enter a 10-digit phone number.';
    if (duties.length === 0) next.duties = 'Assign at least one duty.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) mutation.mutate();
  }

  function inviteAnother() {
    setResult(null);
    setForm({ name: '', email: '', phone: '' });
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

      <div className="space-y-5 rounded-xl bg-surface/60 p-4 ring-1 ring-line">
        <fieldset>
          <legend className="text-sm font-medium text-ink">Duties</legend>
          <p className="mt-0.5 text-xs text-muted">What this staff member does. Pick at least one.</p>
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

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card h-24 animate-pulse bg-accent-tint/40" />
      ))}
    </div>
  );
}
