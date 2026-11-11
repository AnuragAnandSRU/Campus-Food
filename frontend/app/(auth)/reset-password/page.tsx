import Link from 'next/link';
import { ResetPasswordForm } from './reset-form';

// Server component: the reset token arrives as a query param. In Next 16
// `searchParams` is a Promise, so we await it and hand the token to the
// client form — no `useSearchParams`/Suspense boundary needed.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; door?: string }>;
}) {
  const { token, door } = await searchParams;
  const forgotHref =
    door === 'admin' || door === 'partner'
      ? `/forgot-password?door=${door}`
      : '/forgot-password';

  if (!token) {
    return (
      <>
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-accent-tint text-2xl">
          🔗
        </div>
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
          Invalid <em className="not-italic text-accent">link</em>
        </h1>
        <p className="mt-3 font-light text-muted">
          This password reset link is missing or malformed. Please request a new
          one — links expire for your security.
        </p>
        <Link href={forgotHref} className="btn btn-primary mt-8 inline-flex">
          Request a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Set a new <em className="not-italic text-accent">password</em>
      </h1>
      <p className="mt-3 font-light text-muted">
        Choose a strong password you don&apos;t use anywhere else.
      </p>
      <ResetPasswordForm token={token} />
    </>
  );
}
