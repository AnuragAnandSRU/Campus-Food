import { VerifyEmailClient } from './verify-client';

// Server component: the verification token arrives as a query param. Next 16
// exposes `searchParams` as a Promise; we await it and pass the token (which
// may be undefined for someone who just registered) to the client.
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <VerifyEmailClient token={token} />;
}
