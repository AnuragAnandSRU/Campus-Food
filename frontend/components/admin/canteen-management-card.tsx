'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api-client';
import { InviteLinkCard } from '@/components/admin/invite-link-card';
import type { AdminCanteen } from '../../../shared/src/types/canteen.types';
import type { ProvisionedUser } from '../../../shared/src/types/user.types';

interface CanteenManagementCardProps {
  canteen: AdminCanteen;
  team: ProvisionedUser[];
  onAssignOwner: (canteenId: string) => void;
}

export function CanteenManagementCard({
  canteen,
  team,
  onAssignOwner,
}: CanteenManagementCardProps) {
  const queryClient = useQueryClient();
  const [showTeam, setShowTeam] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [activeInviteLink, setActiveInviteLink] = useState<{ id: string; link: string } | null>(
    null
  );

  const toggleVisibility = useMutation({
    mutationFn: () => adminApi.updateCanteen(canteen._id, { isActive: !canteen.isActive }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-canteens'] });
      toast.success(
        updated.isActive
          ? `“${canteen.name}” is now visible to students.`
          : `“${canteen.name}” is now hidden from students.`
      );
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not update canteen visibility.')),
  });

  const resendInvite = useMutation({
    mutationFn: (userId: string) => adminApi.resendInvite(userId),
    onSuccess: (res, userId) => {
      setActiveInviteLink({ id: userId, link: res.inviteLink });
      toast.success('Fresh invitation link generated.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not resend invitation.')),
    onSettled: () => setResendingId(null),
  });

  function handleResend(userId: string) {
    setResendingId(userId);
    resendInvite.mutate(userId);
  }

  // Count active staff vs invited
  const activeCount = team.filter((t) => t.isActive).length;

  return (
    <div className="card overflow-hidden transition-all hover:shadow-sm">
      {/* Top Banner & Metadata */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            {/* Canteen Photo / Initial */}
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-surface/50 shadow-xs">
              {canteen.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={canteen.image}
                  alt={canteen.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-accent-tint/40 font-display text-2xl font-bold text-accent">
                  {canteen.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-bold text-ink truncate">
                  {canteen.name}
                </h3>
                <span
                  className={`badge text-xs ${
                    canteen.isActive
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                      : 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200'
                  }`}
                >
                  {canteen.isActive ? '● Live' : '○ Hidden'}
                </span>
                {canteen.rating > 0 && (
                  <span className="badge badge-accent text-xs">
                    ★ {canteen.rating.toFixed(1)} ({canteen.totalRatings || 0})
                  </span>
                )}
              </div>

              <p className="text-xs text-muted flex items-center gap-1.5">
                <span>📍</span>
                <span className="truncate">{canteen.location}</span>
                <span>•</span>
                <span>🕒 {canteen.openingHours.open}–{canteen.openingHours.close}</span>
              </p>

              {canteen.description && (
                <p className="text-xs text-muted/80 line-clamp-1 font-light pt-0.5">
                  {canteen.description}
                </p>
              )}

              {/* Owner Info & Reassignment */}
              <div className="pt-1.5 text-xs">
                {canteen.ownerId ? (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-ink/80 font-medium">
                      👤 Owner: <span className="text-ink font-semibold">{canteen.ownerId.name}</span>{' '}
                      <span className="text-muted font-normal">({canteen.ownerId.email})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onAssignOwner(canteen._id)}
                      className="rounded-lg border border-line bg-surface hover:border-accent hover:text-accent hover:bg-accent-tint/20 px-2 py-0.5 text-xs font-semibold text-ink shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Reassign or replace canteen owner"
                    >
                      <span>🔄</span>
                      <span>Reassign Owner</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-danger font-medium flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>No Owner Assigned</span>
                    <button
                      type="button"
                      onClick={() => onAssignOwner(canteen._id)}
                      className="ml-2 rounded-lg border border-danger/30 bg-danger/5 hover:bg-danger/10 text-danger px-2.5 py-0.5 text-xs font-semibold cursor-pointer shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <span>+</span>
                      <span>Assign Owner</span>
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visibility Toggle & Action Buttons */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 border-line/60 pt-3 sm:pt-0">
            <button
              type="button"
              onClick={() => toggleVisibility.mutate()}
              disabled={toggleVisibility.isPending}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                canteen.isActive
                  ? 'border-line text-muted hover:border-danger hover:text-danger bg-surface'
                  : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
              } disabled:opacity-50`}
            >
              {toggleVisibility.isPending
                ? 'Updating…'
                : canteen.isActive
                ? 'Hide Canteen'
                : 'Make Live'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTeam(!showTeam)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  showTeam
                    ? 'bg-accent/10 border-accent/40 text-accent font-semibold'
                    : 'bg-surface border-line text-ink hover:border-accent/40'
                }`}
              >
                <span>👥</span>
                <span>
                  Team ({team.length})
                </span>
                <span className="text-[10px] text-muted">{showTeam ? '▲' : '▼'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Per-Canteen Team Panel (Read-only summary for Admin) */}
      {showTeam && (
        <div className="border-t border-line bg-surface/30 p-5 animate-fade-in">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                {canteen.name} Staff & Team Overview
              </h4>
              <p className="text-xs text-muted font-light">
                {activeCount} active · {team.length - activeCount} pending invite
              </p>
            </div>

            <span className="text-[11px] font-medium text-muted rounded-md bg-line/30 px-2 py-1">
              Staff hired & managed by Owner
            </span>
          </div>

          {team.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-6 text-center">
              <p className="text-xs text-muted">
                No staff members onboarded by the canteen owner yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line/60 rounded-xl border border-line bg-surface overflow-hidden">
              {team.map((member) => {
                const isPending = !member.isActive;
                const hasLink = activeInviteLink?.id === member._id;

                return (
                  <div key={member._id} className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink truncate">
                            {member.name}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              member.role === 'owner'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {member.role}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.2 text-[10px] font-medium ${
                              member.isActive
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                : 'bg-highlight-tint text-ink'
                            }`}
                          >
                            {member.isActive ? 'Active' : 'Invited'}
                          </span>
                        </div>
                        <p className="text-xs text-muted truncate">{member.email}</p>
                        {member.role === 'staff' && member.staffDuties && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                            <span>Duties:</span>
                            {member.staffDuties.map((d) => (
                              <span
                                key={d}
                                className="rounded bg-line/40 px-1.5 py-0.2 capitalize text-ink"
                              >
                                {d === 'kitchen' ? '🍳 Kitchen' : '🚴 Delivery'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {isPending && member.role === 'owner' && (
                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={() => handleResend(member._id)}
                            disabled={resendingId === member._id}
                            className="btn btn-secondary py-1 px-2.5 text-xs cursor-pointer disabled:opacity-50"
                          >
                            {resendingId === member._id ? 'Generating…' : 'Resend Invite'}
                          </button>
                        </div>
                      )}
                    </div>

                    {hasLink && (
                      <div className="pt-2">
                        <InviteLinkCard name={member.name} link={activeInviteLink.link} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
