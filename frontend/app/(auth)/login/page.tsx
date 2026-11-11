'use client';

import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

const STUDENT_DEMO_ACCOUNTS = [
  {
    label: '🎓 Demo Student',
    email: 'demo.student@college.edu',
    password: 'testpass123',
    toastMessage: 'Filled Student demo credentials',
    badgeClass:
      'bg-accent-tint text-accent hover:bg-accent/15 border border-accent/20',
  },
];

export default function LoginPage() {
  return (
    <LoginForm
      audience="student"
      heading={
        <>
          Welcome back, <em className="not-italic text-accent">Student</em>
        </>
      }
      subtitle="Sign in to order hot meals delivered right to your hostel room."
      defaultRedirect="/canteens"
      emailLabel="College Email"
      emailPlaceholder="demo.student@college.edu"
      submitLabel="Sign in as Student →"
      forgotDoor="student"
      showForgot={true}
      demoAccounts={STUDENT_DEMO_ACCOUNTS}
      footer={
        <div className="space-y-3 border-t border-line/60 pt-5">
          <p>
            New to Campus Food?{' '}
            <Link
              href="/register"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Create an account
            </Link>
          </p>
          <p className="text-xs text-muted">
            Canteen owner or staff?{' '}
            <Link href="/partner" className="font-medium text-accent hover:underline">
              Sign in at Partner Portal →
            </Link>
          </p>
        </div>
      }
    />
  );
}
