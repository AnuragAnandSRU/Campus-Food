'use client';

import { LoginForm } from '@/components/auth/login-form';

/**
 * The ADMIN door: platform administrators only. Deliberately unlinked from the
 * rest of the app (no nav or footer points here) — you reach it by knowing the
 * URL. Non-admin accounts are refused by the backend (audience check). It sits
 * outside the (auth) route group, so it gets its own bare centered shell rather
 * than the consumer marketing panel.
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <LoginForm
          audience="admin"
          heading={
            <>
              Admin <em className="not-italic text-accent">console</em>
            </>
          }
          subtitle="Restricted access. Sign in with your administrator account."
          defaultRedirect="/admin"
          emailLabel="Admin Email"
          emailPlaceholder="admin@sru.edu.in"
          forgotDoor="admin"
          showForgot={true}
        />
      </div>
    </div>
  );
}
