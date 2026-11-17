'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useIsClient } from '@/lib/use-client-state';

export function HomeHeroActions() {
  const mounted = useIsClient();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      <Link
        href="/canteens"
        className="btn btn-primary text-base sm:text-lg px-8 py-3.5 shadow-lg shadow-accent/25 hover:shadow-xl"
      >
        <span>Browse Canteens</span>
        <ArrowRight className="h-4 w-4" />
      </Link>

      {!mounted ? (
        <div className="h-12 w-32 rounded-full bg-white/10 animate-pulse" aria-hidden="true" />
      ) : user?.role === 'student' ? (
        <Link
          href="/orders"
          className="btn btn-secondary text-base sm:text-lg px-8 py-3.5 bg-white/10 backdrop-blur-md border-white/25 text-white hover:bg-white/20 hover:border-white/40"
        >
          My Orders
        </Link>
      ) : !user ? (
        <Link
          href="/login"
          className="btn btn-secondary text-base sm:text-lg px-8 py-3.5 bg-white/10 backdrop-blur-md border-white/25 text-white hover:bg-white/20 hover:border-white/40"
        >
          Sign In
        </Link>
      ) : null}
    </div>
  );
}
