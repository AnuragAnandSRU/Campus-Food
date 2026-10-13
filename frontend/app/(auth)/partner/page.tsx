'use client';

import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

/**
 * The PARTNER door: canteen owners and staff. Invite-only (no self-register) —
 * accounts are provisioned and activated through an emailed invitation link.
 * Students and admins are refused here by the backend (audience check).
 */
export default function PartnerLoginPage() {
  return (
    <LoginForm
      audience="business"
      heading={
        <>
          Partner <em className="not-italic text-accent">portal</em>
        </>
      }
      subtitle="Sign in to manage your canteen — orders, menu, and staff."
      defaultRedirect="/dashboard"
      footer={
        <>
          <p>
            Staff and owner accounts are created by invitation. Use the link you
            were emailed to set your password, then sign in here.
          </p>
          <p className="mt-2">
            Here to order food?{' '}
            <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
              Student sign-in
            </Link>
          </p>
        </>
      }
    />
  );
}
