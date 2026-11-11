import Link from 'next/link';
import { AcceptInviteForm } from './accept-form';

// Server component: the invitation token arrives as a query param. In Next 16
// `searchParams` is a Promise, so we await it and hand the token to the client
// form (mirrors the reset-password flow).
export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <>
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-accent-tint text-2xl">
          🔗
        </div>
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
          Invalid <em className="not-italic text-accent">invitation</em>
        </h1>
        <p className="mt-3 font-light text-muted">
          This invitation link is missing or malformed. Ask your administrator to
          resend your invite — links expire for security.
        </p>
        <Link href="/partner" className="btn btn-primary mt-8 inline-flex">
          Go to Partner sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Activate your <em className="not-italic text-accent">account</em>
      </h1>
      <p className="mt-3 font-light text-muted">
        You&apos;ve been invited to Campus Food. Set a password to finish setting
        up your account.
      </p>
      <AcceptInviteForm token={token} />
    </>
  );
}
