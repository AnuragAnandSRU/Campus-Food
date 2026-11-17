'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import type { LoginAudience } from '../../../shared/src/types/user.types';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useRedirectIfAuthenticated } from '@/lib/use-redirect-if-authenticated';
import { getSafeRedirectForRole, type PortalDoor } from '@/lib/role-routing';
import { Field } from '@/components/auth/field';
import { SubmitButton } from '@/components/auth/submit-button';

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  toastMessage: string;
  badgeClass: string;
}

interface LoginFormProps {
  /** Which door this form belongs to. Sent to the backend to refuse wrong roles. */
  audience: LoginAudience;
  heading: React.ReactNode;
  subtitle: string;
  /** Where to go after a successful sign-in when no valid `?redirect=` param is present. */
  defaultRedirect: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  submitLabel?: string;
  forgotDoor?: PortalDoor;
  showForgot?: boolean;
  demoAccounts?: DemoAccount[];
  /** Optional links shown under the form (e.g. "Create an account"). */
  footer?: React.ReactNode;
}

/**
 * Shared sign-in form used by each strictly separated portal entrance
 * (`/login` for students, `/partner` for canteen owners/staff, `/admin/login`
 * for platform admins).
 */
export function LoginForm({
  audience,
  heading,
  subtitle,
  defaultRedirect,
  emailLabel = 'Email',
  emailPlaceholder = 'you@college.edu',
  submitLabel = 'Sign in',
  forgotDoor,
  showForgot = true,
  demoAccounts,
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

  function fillDemo(demo: DemoAccount) {
    setForm({ email: demo.email, password: demo.password });
    setErrors({});
    toast.success(demo.toastMessage);
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
      const target = redirect
        ? getSafeRedirectForRole(redirect, user.role)
        : defaultRedirect;
      router.replace(target);
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

  const door =
    forgotDoor ??
    (audience === 'admin' ? 'admin' : audience === 'business' ? 'partner' : 'student');
  const forgotHref =
    door === 'admin' || door === 'partner'
      ? `/forgot-password?door=${door}`
      : '/forgot-password';

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">{heading}</h1>
      <p className="mt-3 font-light text-muted">{subtitle}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <Field
          label={emailLabel}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={emailPlaceholder}
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
                href={forgotHref}
                className="text-sm font-medium text-accent hover:text-accent-hover"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </div>

        <SubmitButton pending={pending}>
          {pending ? 'Signing in…' : submitLabel}
        </SubmitButton>
      </form>

      {footer && <div className="mt-8 text-sm text-muted">{footer}</div>}

      {demoAccounts && demoAccounts.length > 0 && (
        <div className="mt-6 rounded-xl border border-line bg-surface/70 p-3.5 backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Quick Demo Logins
            </span>
            <span className="text-[11px] text-muted">Click to auto-fill</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {demoAccounts.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => fillDemo(demo)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${demo.badgeClass}`}
              >
                {demo.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
