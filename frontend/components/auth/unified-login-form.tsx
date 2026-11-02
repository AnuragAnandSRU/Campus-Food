'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useRedirectIfAuthenticated } from '@/lib/use-redirect-if-authenticated';
import { Field } from '@/components/auth/field';
import { SubmitButton } from '@/components/auth/submit-button';

type RoleTab = 'student' | 'partner';

interface UnifiedLoginFormProps {
  initialRole?: RoleTab;
}

export function UnifiedLoginForm({ initialRole = 'student' }: UnifiedLoginFormProps) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { isAuthenticated } = useRedirectIfAuthenticated();

  const [role, setRole] = useState<RoleTab>(initialRole);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [pending, setPending] = useState(false);

  function handleRoleChange(newRole: RoleTab) {
    setRole(newRole);
    setErrors({});
  }

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
    const audience = role === 'student' ? 'student' : 'business';
    const defaultRedirect = role === 'student' ? '/canteens' : '/dashboard';

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

  function fillDemo(type: 'student' | 'owner_spice' | 'owner_green') {
    if (type === 'student') {
      setRole('student');
      setForm({ email: 'demo.student@college.edu', password: 'testpass123' });
      toast.success('Filled Student demo credentials');
    } else if (type === 'owner_spice') {
      setRole('partner');
      setForm({ email: 'owner.spice@campusfood.local', password: 'demo12345' });
      toast.success('Filled Spice Junction Owner credentials');
    } else {
      setRole('partner');
      setForm({ email: 'owner.green@campusfood.local', password: 'demo12345' });
      toast.success('Filled Green Bowl Owner credentials');
    }
    setErrors({});
  }

  if (isAuthenticated) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const isStudent = role === 'student';

  return (
    <div className="w-full">
      {/* Role Switcher Pill Control */}
      <div className="mb-8 p-1.5 bg-ink/5 rounded-2xl flex border border-line">
        <button
          type="button"
          onClick={() => handleRoleChange('student')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isStudent
              ? 'bg-surface text-ink shadow-sm ring-1 ring-line font-semibold'
              : 'text-muted hover:text-ink'
          }`}
        >
          <span>🎓</span>
          <span>Student</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('partner')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            !isStudent
              ? 'bg-surface text-ink shadow-sm ring-1 ring-line font-semibold'
              : 'text-muted hover:text-ink'
          }`}
        >
          <span>👨‍🍳</span>
          <span>Canteen Partner</span>
        </button>
      </div>

      {/* Dynamic Header */}
      <div className="text-center sm:text-left mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
          {isStudent ? (
            <>
              Welcome back, <em className="not-italic text-accent">Student</em>
            </>
          ) : (
            <>
              Canteen <em className="not-italic text-accent">Partner Portal</em>
            </>
          )}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {isStudent
            ? 'Sign in to order hot meals delivered right to your hostel room.'
            : 'Sign in to manage live orders, menu availability, and kitchen staff.'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          label={isStudent ? 'College Email' : 'Partner Account Email'}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={isStudent ? 'demo.student@college.edu' : 'owner.spice@campusfood.local'}
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
            placeholder="Enter your password"
            value={form.password}
            onChange={update}
            error={errors.password}
          />
          {isStudent && (
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-accent hover:text-accent-hover"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </div>

        <SubmitButton pending={pending} className="mt-2">
          {pending
            ? 'Signing in…'
            : isStudent
            ? 'Sign in as Student →'
            : 'Access Canteen Dashboard →'}
        </SubmitButton>
      </form>

      {/* Footer Navigation */}
      <div className="mt-6 text-center sm:text-left text-sm text-muted border-t border-line/60 pt-4">
        {isStudent ? (
          <p>
            New to Campus Food?{' '}
            <Link href="/register" className="font-medium text-accent hover:text-accent-hover">
              Create an account
            </Link>
          </p>
        ) : (
          <p className="text-xs text-muted leading-relaxed">
            Staff and owner accounts are created by invitation. Use your emailed link to activate your account.
          </p>
        )}
      </div>

      {/* One-Tap Demo Bar (For Evaluators and Quick Testing) */}
      <div className="mt-6 rounded-xl border border-line bg-surface/60 p-3.5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <span>⚡</span> Quick Demo Logins
          </span>
          <span className="text-[11px] text-muted">Click to auto-fill</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fillDemo('student')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-tint text-accent hover:bg-accent/15 transition-colors border border-accent/20 cursor-pointer"
          >
            🎓 Demo Student
          </button>
          <button
            type="button"
            onClick={() => fillDemo('owner_spice')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors border border-amber-200 cursor-pointer"
          >
            🌶️ Spice Junction Owner
          </button>
          <button
            type="button"
            onClick={() => fillDemo('owner_green')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer"
          >
            🥗 Green Bowl Owner
          </button>
        </div>
      </div>
    </div>
  );
}
