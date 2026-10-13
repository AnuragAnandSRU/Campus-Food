'use client';

import { useState } from 'react';

/**
 * Displays a provisioned account's invitation link with a one-tap copy button.
 * This is the "copy fallback": even if email delivery is unavailable, the admin
 * can hand this link to the invitee directly. The link expires in 7 days.
 */
export function InviteLinkCard({ name, link }: { name?: string; link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-accent-tint/60 p-4">
      <p className="text-sm text-ink">
        {name ? (
          <>
            Invitation ready for <span className="font-medium">{name}</span>.
          </>
        ) : (
          'Invitation link ready.'
        )}{' '}
        <span className="text-muted">
          Share this link so they can set a password — it expires in 7 days.
        </span>
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="input flex-1 bg-white text-sm"
          aria-label="Invitation link"
        />
        <button
          type="button"
          onClick={copy}
          className="btn btn-primary px-5 py-3 text-sm whitespace-nowrap"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
