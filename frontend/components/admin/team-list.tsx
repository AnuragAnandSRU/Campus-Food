'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api-client';
import { InviteLinkCard } from '@/components/admin/invite-link-card';
import type { ProvisionedUser } from '../../../shared/src/types/user.types';

function TeamRow({ user }: { user: ProvisionedUser }) {
  const [link, setLink] = useState<string | null>(null);

  const resend = useMutation({
    mutationFn: () => adminApi.resendInvite(user._id),
    onSuccess: (res) => {
      setLink(res.inviteLink);
      toast.success('Fresh invitation link generated.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not resend the invitation.')),
  });

  return (
    <li className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{user.name}</p>
          <p className="truncate text-sm text-muted">{user.email}</p>
          <p className="mt-1 text-sm text-muted">
            <span className="capitalize">{user.role}</span>
            {user.canteen ? <> · {user.canteen.name}</> : <> · <span className="text-danger">no canteen</span></>}
          </p>
          {user.role === 'staff' && user.staffDuties && user.staffDuties.length > 0 && (
            <p className="mt-1 text-xs capitalize text-muted">
              Duties: {user.staffDuties.join(' + ')}
              {user.permissions && user.permissions.length > 0 && (
                <span className="normal-case">
                  {' '}
                  · Powers: {user.permissions.map((p) => p.replace('_', ' ')).join(', ')}
                </span>
              )}
            </p>
          )}
        </div>
        <span
          className={
            user.isActive
              ? 'badge badge-accent shrink-0'
              : 'badge shrink-0 bg-highlight-tint text-ink'
          }
        >
          {user.isActive ? 'Active' : 'Invited'}
        </span>
      </div>

      {!user.isActive && (
        <div className="mt-3">
          {link ? (
            <InviteLinkCard name={user.name} link={link} />
          ) : (
            <button
              type="button"
              onClick={() => resend.mutate()}
              disabled={resend.isPending}
              className="btn btn-secondary px-4 py-2 text-sm disabled:opacity-60"
            >
              {resend.isPending ? 'Generating…' : 'Resend invite'}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/** Admin list of provisioned staff/owner accounts with activation status. */
export function TeamList({ users }: { users: ProvisionedUser[] }) {
  if (users.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
        No staff or owners yet. Invite someone to get started.
      </p>
    );
  }

  return (
    <ul className="card divide-y divide-line overflow-hidden">
      {users.map((u) => (
        <TeamRow key={u._id} user={u} />
      ))}
    </ul>
  );
}
