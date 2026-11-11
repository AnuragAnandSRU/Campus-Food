'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useIsClient } from '@/lib/use-client-state';

export function HomeHeroActions() {
  const mounted = useIsClient();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      <Link href="/canteens" className="btn btn-primary text-lg px-8">
        Browse Canteens
      </Link>

      {!mounted ? (
        <div className="h-12 w-32" aria-hidden="true" />
      ) : user?.role === 'student' ? (
        <Link
          href="/orders"
          className="btn btn-secondary text-lg px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
        >
          My Orders
        </Link>
      ) : !user ? (
        <Link
          href="/login"
          className="btn btn-secondary text-lg px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
        >
          Sign In
        </Link>
      ) : null}
    </div>
  );
}
