'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

type Status = 'verifying' | 'success' | 'error' | 'info';

export function VerifyEmailClient({ token }: { token?: string }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setAuth = useAuthStore((s) => s.setAuth);

  // No token → the user landed here right after registering. Show an
  // "check your inbox" prompt rather than trying to verify.
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'info');
  const [message, setMessage] = useState('');

  // React 19 runs effects twice in dev; guard so we only hit the API once.
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const res = await authApi.verifyEmail(token);
        if (res.user && res.token) {
          setAuth(res.user, res.token);
        } else {
          // Refresh the stored user so `isVerified` is up to date everywhere.
          try {
            const fresh = await authApi.getMe();
            setUser(fresh);
          } catch {
            // Not signed in on this device — verification still succeeded.
          }
        }
        setStatus('success');
      } catch (err) {
        setMessage(
          getApiErrorMessage(err, 'This verification link is invalid or has expired.')
        );
        setStatus('error');
      }
    })();
  }, [token, setUser]);

  if (status === 'verifying') {
    return (
      <div className="text-center">
        <span
          className="mx-auto mb-6 block h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent"
          aria-hidden
        />
        <h1 className="font-display text-3xl tracking-tight text-ink">
          Verifying your <em className="not-italic text-accent">email</em>…
        </h1>
        <p className="mt-3 font-light text-muted">This will only take a moment.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <>
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-accent-tint text-2xl">
          ✅
        </div>
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
          You&apos;re all <em className="not-italic text-accent">set</em>
        </h1>
        <p className="mt-3 font-light text-muted">
          Your email is verified. You can now place orders and have them delivered
          to your room.
        </p>
        <Link href="/" className="btn btn-primary mt-8 inline-flex">
          Start ordering
        </Link>
      </>
    );
  }

  if (status === 'error') {
    return (
      <>
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-2xl">
          ⚠️
        </div>
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
          Verification <em className="not-italic text-accent">failed</em>
        </h1>
        <p className="mt-3 font-light text-muted">{message}</p>
        <Link href="/login" className="btn btn-secondary mt-8 inline-flex">
          Back to sign in
        </Link>
      </>
    );
  }

  // info — just registered, waiting on the email
  return (
    <>
      <div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-accent-tint text-2xl">
        ✉️
      </div>
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Verify your <em className="not-italic text-accent">email</em>
      </h1>
      <p className="mt-3 font-light text-muted">
        {user?.email ? (
          <>
            We&apos;ve sent a verification link to{' '}
            <span className="font-medium text-ink">{user.email}</span>. Open it
            to activate your account.
          </>
        ) : (
          <>We&apos;ve sent you a verification link. Open it to activate your account.</>
        )}
      </p>
      <Link href="/" className="btn btn-secondary mt-8 inline-flex">
        Go to home
      </Link>
    </>
  );
}
