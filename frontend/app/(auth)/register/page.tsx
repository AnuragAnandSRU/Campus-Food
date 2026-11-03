'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useRedirectIfAuthenticated } from '@/lib/use-redirect-if-authenticated';
import { Field } from '@/components/auth/field';
import { SubmitButton } from '@/components/auth/submit-button';

const INITIAL = {
  name: '',
  email: '',
  phone: '',
  hostelBlock: '',
  roomNumber: '',
  password: '',
  confirmPassword: '',
};

type FormErrors = Partial<Record<keyof typeof INITIAL, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { isAuthenticated } = useRedirectIfAuthenticated();

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);

  function update(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.phone.trim()) next.phone = 'Phone number is required.';
    else if (!/^\d{10}$/.test(form.phone)) next.phone = 'Enter a 10-digit phone number.';
    if (!form.hostelBlock.trim()) next.hostelBlock = 'Required.';
    if (!form.roomNumber.trim()) next.roomNumber = 'Required.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6) next.password = 'Use at least 6 characters.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setPending(true);
    try {
      const { confirmPassword: _confirm, ...rest } = form;
      const { user, token } = await authApi.register({ ...rest, role: 'student' });
      const prevUser = useAuthStore.getState().user;
      if (prevUser && prevUser._id !== user._id) {
        useCartStore.getState().clearCart();
      }
      setAuth(user, token);
      toast.success('Account created! Check your email to verify.');
      router.replace('/verify-email');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create your account.'));
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
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Create your <em className="not-italic text-accent">account</em>
      </h1>
      <p className="mt-3 font-light text-muted">
        Order in a few taps — delivered to your hostel room.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <Field
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Ananya Sharma"
          value={form.name}
          onChange={update}
          error={errors.name}
        />

        <Field
          label="College email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ananya@college.edu"
          value={form.email}
          onChange={update}
          error={errors.email}
        />

        <Field
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="9876543210"
          value={form.phone}
          onChange={update}
          error={errors.phone}
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Hostel block"
            name="hostelBlock"
            placeholder="Block A"
            value={form.hostelBlock}
            onChange={update}
            error={errors.hostelBlock}
          />
          <Field
            label="Room number"
            name="roomNumber"
            placeholder="204"
            value={form.roomNumber}
            onChange={update}
            error={errors.roomNumber}
          />
        </div>

        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={update}
          error={errors.password}
        />

        <Field
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat password"
          value={form.confirmPassword}
          onChange={update}
          error={errors.confirmPassword}
        />

        <SubmitButton pending={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </SubmitButton>
      </form>

      <div className="mt-8 text-sm text-muted">
        <p>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
