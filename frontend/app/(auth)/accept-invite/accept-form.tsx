'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Field } from '@/components/auth/field';
import { SubmitButton } from '@/components/auth/submit-button';

/**
 * Invitee sets their password using the one-time token from their invitation
 * link. On success the account is activated and signed in, then routed to the
 * area for their role (staff/owner → dashboard).
 */
export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [pending, setPending] = useState(false);

  function update(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const next: typeof errors = {};
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6) next.password = 'Use at least 6 characters.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setPending(true);
    try {
      const { user, token: authToken } = await authApi.acceptInvite(token, form.password);
      setAuth(user, authToken);
      toast.success(`Welcome to Campus Food, ${user.name.split(' ')[0]}!`);
      const home =
        user.role === 'admin'
          ? '/admin'
          : user.role === 'staff' || user.role === 'owner'
            ? '/dashboard'
            : '/';
      router.replace(home);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, 'This invitation may have expired. Ask your admin to resend it.')
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      <Field
        label="Create a password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 6 characters"
        value={form.password}
        onChange={update}
        error={errors.password}
      />
      <Field
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        value={form.confirmPassword}
        onChange={update}
        error={errors.confirmPassword}
      />
      <SubmitButton pending={pending}>
        {pending ? 'Activating…' : 'Activate account'}
      </SubmitButton>
    </form>
  );
}
