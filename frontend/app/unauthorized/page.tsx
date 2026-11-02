import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="card max-w-md w-full p-8 text-center border-line bg-surface/90 shadow-xl shadow-ink/5">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger text-2xl border border-danger/20">
            🛡️
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Access Restricted
          </h1>

          <p className="mt-2 text-sm text-muted leading-relaxed">
            You do not have permission to access this page. Please sign in with an account that has the required permissions.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn btn-secondary px-5 py-2 text-sm">
              Back to Home
            </Link>
            <Link href="/canteens" className="btn btn-primary px-5 py-2 text-sm">
              Browse Canteens
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

