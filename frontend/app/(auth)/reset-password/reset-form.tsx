'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';
import { getRoleLoginPath } from '@/lib/role-routing';
import { Field } from '@/components/auth/field';
import { SubmitButton } from '@/components/auth/submit-button';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

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
      const res = await authApi.resetPassword(token, form.password);
      toast.success('Password updated. Please sign in with your new credentials.');
      router.replace(getRoleLoginPath(res.role));
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, 'This link may have expired. Request a new one.')
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      <Field
        label="New password"
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
        placeholder="Re-enter your new password"
        value={form.confirmPassword}
        onChange={update}
        error={errors.confirmPassword}
      />
      <SubmitButton pending={pending}>
        {pending ? 'Updating…' : 'Update password'}
      </SubmitButton>
    </form>
  );
}
