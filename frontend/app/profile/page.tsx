'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { useRequireAuth } from '@/lib/use-require-auth';
import { useLogout } from '@/lib/use-logout';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';
import { SiteHeader } from '@/components/site-header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { formatDateTime } from '@/lib/utils';

export default function ProfilePage() {
  const ready = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const handleLogout = useLogout();

  // Personal / Delivery details form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hostelBlock, setHostelBlock] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security / Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Email resend state
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setHostelBlock(user.hostelBlock || '');
      setRoomNumber(user.roomNumber || '');
    }
  }, [user]);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await authApi.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        hostelBlock: hostelBlock.trim(),
        roomNumber: roomNumber.trim(),
      });
      setUser(updated);
      toast.success('Profile and delivery address updated!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to change password'));
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleResendVerification() {
    setResending(true);
    try {
      await authApi.resendVerification();
      toast.success('Verification link sent! Check your inbox.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not resend verification email'));
    } finally {
      setResending(false);
    }
  }

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-6 py-8">
          <div className="h-6 w-32 animate-pulse bg-line rounded" />
          <div className="card mt-6 h-48 animate-pulse bg-accent-tint/30" />
        </main>
      </div>
    );
  }

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'My Profile' },
          ]}
        />

        {/* Profile Header Card */}
        <div className="card mt-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white shadow-sm">
                {initial}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                    {user.name}
                  </h1>
                  <span className="badge badge-accent uppercase text-[10px] tracking-wider">
                    {user.role}
                  </span>
                </div>
                <p className="text-sm text-muted">{user.email}</p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  {user.isVerified ? (
                    <span className="text-accent font-medium flex items-center gap-1">
                      <span>✓</span> Verified Student
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-amber-700 font-medium">⚠️ Email Unverified</span>
                      <button
                        onClick={handleResendVerification}
                        disabled={resending}
                        className="text-accent underline hover:opacity-80 disabled:opacity-50 cursor-pointer"
                      >
                        {resending ? 'Sending…' : 'Resend link'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              <span className="text-xs text-muted">
                Member since {user.createdAt ? formatDateTime(user.createdAt).split(',')[0] : 'Campus Student'}
              </span>
              <button
                onClick={() => handleLogout()}
                className="text-xs font-medium text-danger hover:underline cursor-pointer"
              >
                Sign out of account
              </button>
            </div>
          </div>
        </div>

        {/* Personal Details & Hostel Delivery Address Form */}
        <form onSubmit={handleUpdateProfile} className="card mt-6 p-6">
          <div className="border-b border-line pb-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              Personal & Delivery Details
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Keep your contact and hostel room updated for seamless deliveries.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-ink">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input mt-1 text-sm"
                placeholder="Your full name"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-ink">
                  Email Address (Login)
                </label>
                <input
                  id="email"
                  type="email"
                  disabled
                  value={user.email}
                  className="input mt-1 text-sm bg-line/20 text-muted cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-ink">
                  10-Digit Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input mt-1 text-sm"
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>

            {/* Hostel Delivery Info */}
            <div className="rounded-xl border border-accent/20 bg-accent-tint/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Default Hostel Delivery Address
              </p>
              <p className="mt-0.5 text-xs text-muted">
                These details automatically pre-fill your checkout room so you never retype them.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="hostelBlock" className="block text-xs font-medium text-ink">
                    Hostel Block / Name
                  </label>
                  <input
                    id="hostelBlock"
                    type="text"
                    value={hostelBlock}
                    onChange={(e) => setHostelBlock(e.target.value)}
                    className="input mt-1 text-sm bg-white"
                    placeholder="e.g. Block A, Aryabhatta"
                  />
                </div>

                <div>
                  <label htmlFor="roomNumber" className="block text-xs font-medium text-ink">
                    Room Number
                  </label>
                  <input
                    id="roomNumber"
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="input mt-1 text-sm bg-white"
                    placeholder="e.g. 304, 102-B"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="btn btn-primary px-5 py-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {savingProfile ? 'Saving…' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="card mt-6 p-6">
          <div className="border-b border-line pb-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              Account Security & Password
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Update your account password with your current credentials.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-xs font-medium text-ink">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input mt-1 text-sm"
                placeholder="Enter current password"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="newPassword" className="block text-xs font-medium text-ink">
                  New Password (min 6 characters)
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input mt-1 text-sm"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-ink">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input mt-1 text-sm"
                  placeholder="Re-type new password"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="btn btn-secondary px-5 py-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {savingPassword ? 'Updating…' : 'Change Password'}
            </button>
          </div>
        </form>

        {/* Quick Shortcuts */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/orders" className="btn btn-secondary flex-1 text-center text-xs">
            📦 My Past Orders
          </Link>
          <Link href="/canteens" className="btn btn-secondary flex-1 text-center text-xs">
            🍽️ Browse Canteens
          </Link>
        </div>
      </main>
    </div>
  );
}
