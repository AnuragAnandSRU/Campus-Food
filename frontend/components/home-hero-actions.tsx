'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';

export function HomeHeroActions() {
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      <Link href="/canteens" className="btn btn-primary text-lg px-8">
        Browse Canteens
      </Link>

      {!mounted ? (
        <div className="h-12 w-32" aria-hidden="true" />
      ) : user ? (
        user.role === 'admin' ? (
          <Link
            href="/admin"
            className="btn btn-secondary text-lg px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            Admin Console
          </Link>
        ) : user.role === 'staff' || user.role === 'owner' ? (
          <Link
            href="/dashboard"
            className="btn btn-secondary text-lg px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/orders"
            className="btn btn-secondary text-lg px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            My Orders
          </Link>
        )
      ) : (
        <Link
          href="/login"
          className="btn btn-secondary text-lg px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
        >
          Sign In
        </Link>
      )}
    </div>
  );
}

