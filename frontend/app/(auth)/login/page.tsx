'use client';

import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

/**
 * The CONSUMER door: students only. Public sign-in with a link to self-register.
 * A staff/owner/admin who tries here is refused by the backend (audience check).
 */
export default function LoginPage() {
  return (
    <LoginForm
      audience="student"
      heading={
        <>
          Welcome <em className="not-italic text-accent">back</em>
        </>
      }
      subtitle="Sign in to order from your campus canteens."
      defaultRedirect="/"
      footer={
        <>
          <p>
            New to Campus Food?{' '}
            <Link href="/register" className="font-medium text-accent hover:text-accent-hover">
              Create an account
            </Link>
          </p>
          <p className="mt-2">
            Run a campus canteen?{' '}
            <Link href="/partner" className="font-medium text-accent hover:text-accent-hover">
              Partner sign-in
            </Link>
          </p>
        </>
      }
    />
  );
}
