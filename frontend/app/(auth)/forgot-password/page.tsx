'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';
import type { PortalDoor } from '@/lib/role-routing';
import { useClientSearchParam } from '@/lib/use-client-state';
import { Field } from '@/components/auth/field';
import { SubmitButton } from '@/components/auth/submit-button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const doorParam = useClientSearchParam('door');
  const door: PortalDoor =
    doorParam === 'admin' || doorParam === 'partner' ? doorParam : 'student';

  const backLink =
    door === 'admin' ? '/admin/login' : door === 'partner' ? '/partner' : '/login';
  const backLabel =
    door === 'admin'
      ? 'Back to Admin sign in'
      : door === 'partner'
        ? 'Back to Partner sign in'
        : 'Back to sign in';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(undefined);

    setPending(true);
    try {
      await authApi.forgotPassword(email);
      // Backend returns a generic success regardless, to avoid leaking which
      // emails are registered — mirror that here.
      setSent(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not send the reset link.'));
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <>
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-accent-tint text-accent">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
          Check your <em className="not-italic text-accent">inbox</em>
        </h1>
        <p className="mt-3 font-light text-muted">
          If an account exists for <span className="font-medium text-ink">{email}</span>,
          we&apos;ve sent a link to reset your password. It may take a minute to arrive.
        </p>
        <Link
          href={backLink}
          className="btn btn-secondary mt-8 inline-flex"
        >
          {backLabel}
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Forgot your <em className="not-italic text-accent">password</em>?
      </h1>
      <p className="mt-3 font-light text-muted">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={
            door === 'admin'
              ? 'admin@sru.edu.in'
              : door === 'partner'
                ? 'owner.spice@campusfood.local'
                : 'you@college.edu'
          }
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />
        <SubmitButton pending={pending}>
          {pending ? 'Sending…' : 'Send reset link'}
        </SubmitButton>
      </form>

      <p className="mt-8 text-sm text-muted">
        Remembered it?{' '}
        <Link href={backLink} className="font-medium text-accent hover:text-accent-hover">
          {backLabel}
        </Link>
      </p>
    </>
  );
}
