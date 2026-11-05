'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { useRequireRole } from '@/lib/use-require-role';
import { SiteHeader } from '@/components/site-header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CanteenManagementCard } from '@/components/admin/canteen-management-card';
import { CreateCanteenForm } from '@/components/admin/create-canteen-form';
import { ProvisionUserForm } from '@/components/admin/provision-user-form';
import { InviteLinkCard } from '@/components/admin/invite-link-card';

export default function AdminPage() {
  const ready = useRequireRole(['admin'], '/admin/login');

  // Modal / Drawer state
  const [showCanteenModal, setShowCanteenModal] = useState(false);
  const [inviteModalState, setInviteModalState] = useState<{ open: boolean; canteenId?: string }>({
    open: false,
  });

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'hidden'>('all');

  const canteensQuery = useQuery({
    queryKey: ['admin-canteens'],
    queryFn: () => adminApi.listCanteens(),
    enabled: ready,
  });

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.listUsers(),
    enabled: ready,
  });

  const canteens = canteensQuery.data ?? [];
  const users = usersQuery.data ?? [];

  // Filter canteens based on search keyword and live/hidden filter
  const filteredCanteens = useMemo(() => {
    return canteens.filter((c) => {
      if (filter === 'live' && !c.isActive) return false;
      if (filter === 'hidden' && c.isActive) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesLoc = c.location.toLowerCase().includes(q);
        const matchesOwner = c.ownerId?.name.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesLoc && !matchesOwner) return false;
      }
      return true;
    });
  }, [canteens, filter, search]);

  // Unassigned or legacy team members not bound to any existing canteen
  const unassignedTeam = useMemo(() => {
    return users.filter(
      (u) => u.role !== 'admin' && (!u.canteen || !canteens.some((c) => c._id === u.canteen?._id))
    );
  }, [users, canteens]);

  const liveCount = canteens.filter((c) => c.isActive).length;
  const hiddenCount = canteens.length - liveCount;

  return (
    <div className="min-h-screen bg-background pb-16">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Breadcrumbs items={[{ label: 'Admin Console' }]} />

        {/* Top Header Bar */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
              Admin Console
            </h1>
            <p className="mt-1 text-sm font-light text-muted">
              Campus Food infrastructure: provision canteens and manage staff teams.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowCanteenModal(true)}
              className="btn btn-primary px-4 py-2 text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>+</span>
              <span>Add Canteen</span>
            </button>

            <button
              type="button"
              onClick={() => setInviteModalState({ open: true })}
              disabled={canteens.length === 0}
              className="btn btn-secondary px-4 py-2 text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>👥</span>
              <span>Invite Staff / Owner</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-muted pointer-events-none text-sm">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by canteen, location, or owner…"
              className="input pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-surface p-1 border border-line">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              All ({canteens.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('live')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'live'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Live ({liveCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('hidden')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'hidden'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Hidden ({hiddenCount})
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {(!ready || canteensQuery.isLoading) && (
          <div className="mt-6 space-y-4">
            <div className="card h-32 animate-pulse bg-accent-tint/30" />
            <div className="card h-32 animate-pulse bg-accent-tint/30" />
          </div>
        )}

        {canteensQuery.isError && (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">Could not load canteens</p>
            <p className="mt-1 text-xs text-muted">Please check your network connection and retry.</p>
            <button
              onClick={() => canteensQuery.refetch()}
              className="btn btn-secondary mt-4 text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {ready && !canteensQuery.isLoading && !canteensQuery.isError && canteens.length === 0 && (
          <div className="card mt-6 p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-tint/60 text-2xl text-accent mb-3">
              🏢
            </div>
            <h3 className="font-display text-xl font-bold text-ink">No Canteens Created Yet</h3>
            <p className="mt-1 text-sm text-muted max-w-sm mx-auto font-light">
              Add your first university canteen or food stall to begin onboarding managers and menu items.
            </p>
            <button
              onClick={() => setShowCanteenModal(true)}
              className="btn btn-primary mt-5 text-sm"
            >
              + Create First Canteen
            </button>
          </div>
        )}

        {/* Canteens List */}
        {ready && !canteensQuery.isLoading && filteredCanteens.length > 0 && (
          <div className="mt-6 space-y-4">
            {filteredCanteens.map((canteen) => {
              // Group staff specifically for this canteen
              const canteenStaff = users.filter((u) => u.canteen?._id === canteen._id);

              return (
                <CanteenManagementCard
                  key={canteen._id}
                  canteen={canteen}
                  team={canteenStaff}
                  onInviteToCanteen={(id) => setInviteModalState({ open: true, canteenId: id })}
                />
              );
            })}
          </div>
        )}

        {/* Search Yielded Zero Results */}
        {ready &&
          !canteensQuery.isLoading &&
          canteens.length > 0 &&
          filteredCanteens.length === 0 && (
            <div className="card mt-6 p-10 text-center text-muted">
              <p className="text-base font-semibold text-ink">No canteens match your search</p>
              <p className="text-xs mt-1">Try clearing your search query or changing the filter.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setFilter('all');
                }}
                className="btn btn-secondary mt-4 text-xs"
              >
                Reset Filters
              </button>
            </div>
          )}

        {/* Unassigned / Pending Invites Section (only if unassigned users exist) */}
        {unassignedTeam.length > 0 && (
          <div className="mt-12 rounded-2xl border border-line bg-surface/50 p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Unassigned Team Members ({unassignedTeam.length})
                </h3>
                <p className="text-xs text-muted font-light">
                  Invited staff or owners without an active canteen assigned.
                </p>
              </div>
            </div>

            <div className="divide-y divide-line rounded-xl border border-line bg-surface overflow-hidden">
              {unassignedTeam.map((member) => (
                <div key={member._id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{member.name}</span>
                      <span className="badge text-[10px] uppercase font-bold bg-line/60">
                        {member.role}
                      </span>
                      <span className="badge text-[10px] bg-highlight-tint text-ink">
                        {member.isActive ? 'Active' : 'Invited'}
                      </span>
                    </div>
                    <p className="text-xs text-muted">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Add Canteen */}
        {showCanteenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs animate-fade-in">
            <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
                <h3 className="font-display text-lg font-bold text-ink">Add New Canteen</h3>
                <button
                  type="button"
                  onClick={() => setShowCanteenModal(false)}
                  className="rounded-lg p-1 text-muted hover:text-ink cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <CreateCanteenForm onDone={() => setShowCanteenModal(false)} />
            </div>
          </div>
        )}

        {/* Modal: Invite Staff / Owner */}
        {inviteModalState.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs animate-fade-in">
            <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
                <h3 className="font-display text-lg font-bold text-ink">
                  Invite Canteen Staff / Owner
                </h3>
                <button
                  type="button"
                  onClick={() => setInviteModalState({ open: false })}
                  className="rounded-lg p-1 text-muted hover:text-ink cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <ProvisionUserForm
                canteens={canteens}
                defaultCanteenId={inviteModalState.canteenId}
                onDone={() => setInviteModalState({ open: false })}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
