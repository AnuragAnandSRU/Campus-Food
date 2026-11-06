'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { LoginAudience } from '../../../shared/src/types/user.types';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useRedirectIfAuthenticated } from '@/lib/use-redirect-if-authenticated';
import { Field } from '@/components/auth/field';
import { SubmitButton } from '@/components/auth/submit-button';

interface LoginFormProps {
  /** Which door this form belongs to. Sent to the backend to refuse wrong roles. */
  audience: LoginAudience;
  heading: React.ReactNode;
  subtitle: string;
  /** Where to go after a successful sign-in (a `?redirect=` param wins over this). */
  defaultRedirect: string;
  showForgot?: boolean;
  /** Optional links shown under the form (e.g. "Create an account"). */
  footer?: React.ReactNode;
}

/**
 * The shared sign-in form behind all three entrances (student, partner, admin).
 * The only thing that changes per door is the `audience` it submits and the
 * copy around it — the backend is what actually enforces the separation.
 */
export function LoginForm({
  audience,
  heading,
  subtitle,
  defaultRedirect,
  showForgot = true,
  footer,
}: LoginFormProps) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { isAuthenticated } = useRedirectIfAuthenticated();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [pending, setPending] = useState(false);

  function update(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const next: typeof errors = {};
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setPending(true);
    try {
      const { user, token } = await authApi.login({ ...form, audience });
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      router.replace(redirect || defaultRedirect);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not sign you in. Check your details.'));
    } finally {
      setPending(false);
    }
  }

  if (isAuthenticated) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">{heading}</h1>
      <p className="mt-3 font-light text-muted">{subtitle}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@college.edu"
          value={form.email}
          onChange={update}
          error={errors.email}
        />

        <div>
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={form.password}
            onChange={update}
            error={errors.password}
          />
          {showForgot && (
            <div className="mt-2 text-right">
              <Link
                href={audience === 'admin' ? '/forgot-password?door=admin' : '/forgot-password'}
                className="text-sm font-medium text-accent hover:text-accent-hover"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </div>

        <SubmitButton pending={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </SubmitButton>
      </form>

      {footer && <div className="mt-8 text-sm text-muted">{footer}</div>}
    </>
  );
}
