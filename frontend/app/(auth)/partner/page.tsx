'use client';

import { LoginForm } from '@/components/auth/login-form';

const PARTNER_DEMO_ACCOUNTS = [
  {
    label: '🏪 Spice Owner',
    email: 'owner.spice@campusfood.local',
    password: 'demo12345',
    toastMessage: 'Filled Spice Junction Owner credentials',
    badgeClass:
      'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200',
  },
  {
    label: '🍳 Kitchen Staff',
    email: 'kitchen.spice@campusfood.local',
    password: 'demo12345',
    toastMessage: 'Filled Spice Kitchen Staff credentials',
    badgeClass:
      'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200',
  },
  {
    label: '🛵 Delivery Runner',
    email: 'delivery.spice@campusfood.local',
    password: 'demo12345',
    toastMessage: 'Filled Spice Delivery Runner credentials',
    badgeClass:
      'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200',
  },
];

export default function PartnerLoginPage() {
  return (
    <LoginForm
      audience="business"
      heading={
        <>
          Canteen <em className="not-italic text-accent">Partner Portal</em>
        </>
      }
      subtitle="Sign in to manage live orders, menu availability, and kitchen staff."
      defaultRedirect="/dashboard"
      emailLabel="Partner Account Email"
      emailPlaceholder="owner.spice@campusfood.local"
      submitLabel="Access Canteen Dashboard →"
      forgotDoor="partner"
      showForgot={true}
      demoAccounts={PARTNER_DEMO_ACCOUNTS}
      footer={
        <p className="border-t border-line/60 pt-5 text-xs text-muted leading-relaxed">
          Staff and owner accounts are created by invitation. Use your emailed link
          to activate your account.
        </p>
      }
    />
  );
}
