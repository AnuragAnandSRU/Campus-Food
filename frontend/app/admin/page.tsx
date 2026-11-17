'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle2,
  Plus,
  Search,
  Star,
  Users,
  X,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { useRequireRole } from '@/lib/use-require-role';
import { SiteHeader } from '@/components/site-header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CanteenManagementCard } from '@/components/admin/canteen-management-card';
import { OnboardCanteenForm } from '@/components/admin/onboard-canteen-form';
import { ProvisionOwnerForm } from '@/components/admin/provision-owner-form';

export default function AdminPage() {
  const ready = useRequireRole(['admin'], '/admin/login');

  // Modal states
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [reassignModalState, setReassignModalState] = useState<{ open: boolean; canteenId?: string }>({
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

  const liveCount = canteens.filter((c) => c.isActive).length;
  const hiddenCount = canteens.length - liveCount;
  const partnerAccountsCount = users.filter(
    (u) => u.role === 'owner' || u.role === 'staff'
  ).length;

  const ratedCanteens = canteens.filter((c) => c.rating > 0);
  const avgRating =
    ratedCanteens.length > 0
      ? (
          ratedCanteens.reduce((sum, c) => sum + c.rating, 0) / ratedCanteens.length
        ).toFixed(1)
      : '—';

  return (
    <div className="min-h-screen bg-background pb-16">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: 'Admin Console' }]} />

        {/* Top Header Bar */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/80 pb-6">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
              Admin Console
            </h1>
            <p className="mt-1 text-sm font-light text-muted">
              Campus Food infrastructure: provision canteens and partner accounts.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowOnboardModal(true)}
              className="btn btn-primary px-4 py-2 text-sm flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Onboard Canteen</span>
            </button>
          </div>
        </div>

        {/* 4-Card Platform Overview Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs uppercase tracking-wider font-semibold">Total Canteens</span>
              <Building2 className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink tabular-nums">
              {canteens.length}
            </p>
            <p className="mt-1 text-xs text-muted">
              {liveCount} live · {hiddenCount} hidden
            </p>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs uppercase tracking-wider font-semibold">Live Ordering</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-accent tabular-nums">
              {liveCount}
            </p>
            <p className="mt-1 text-xs text-muted">Open to campus students</p>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs uppercase tracking-wider font-semibold">Partner Accounts</span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink tabular-nums">
              {partnerAccountsCount}
            </p>
            <p className="mt-1 text-xs text-muted">Owners & kitchen staff</p>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs uppercase tracking-wider font-semibold">Campus Rating</span>
              <Star className="h-4 w-4 text-highlight fill-highlight" />
            </div>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink tabular-nums">
              {avgRating} {avgRating !== '—' && <span className="text-sm font-normal text-muted">/ 5</span>}
            </p>
            <p className="mt-1 text-xs text-muted">Across rated canteens</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by canteen, location, or owner…"
              className="input pl-10 pr-10 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-ink cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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
            <div className="card h-32 skeleton-shimmer" />
            <div className="card h-32 skeleton-shimmer" />
          </div>
        )}

        {canteensQuery.isError && (
          <div className="card mt-6 p-10 text-center max-w-md mx-auto">
            <p className="font-display text-lg text-ink font-semibold">Could not load canteens</p>
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
          <div className="card mt-6 p-12 text-center max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-tint text-accent mb-3">
              <Building2 className="h-7 w-7" />
            </div>
            <h3 className="font-display text-xl font-bold text-ink">No Canteens Created Yet</h3>
            <p className="mt-1 text-sm text-muted max-w-sm mx-auto font-light">
              Onboard your first university canteen and its partner to begin operations.
            </p>
            <button
              onClick={() => setShowOnboardModal(true)}
              className="btn btn-primary mt-5 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Onboard First Canteen</span>
            </button>
          </div>
        )}

        {/* Canteens List */}
        {ready && !canteensQuery.isLoading && filteredCanteens.length > 0 && (
          <div className="mt-6 space-y-4">
            {filteredCanteens.map((canteen) => {
              // Group team members specifically for this canteen
              const canteenTeam = users.filter((u) => u.canteen?._id === canteen._id);

              return (
                <CanteenManagementCard
                  key={canteen._id}
                  canteen={canteen}
                  team={canteenTeam}
                  onAssignOwner={(id) => setReassignModalState({ open: true, canteenId: id })}
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
            <div className="card mt-6 p-10 text-center text-muted max-w-md mx-auto">
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

        {/* Modal: Onboard Canteen & Partner */}
        {showOnboardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs animate-fade-in">
            <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">Onboard University Canteen</h3>
                  <p className="text-xs text-muted font-light">Set up canteen stall and provision its primary owner account.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-line/40 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <OnboardCanteenForm onDone={() => setShowOnboardModal(false)} />
            </div>
          </div>
        )}

        {/* Modal: Assign / Reassign Owner */}
        {reassignModalState.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs animate-fade-in">
            <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">Assign / Reassign Owner</h3>
                  <p className="text-xs text-muted font-light">Provision a new owner for an existing canteen.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReassignModalState({ open: false })}
                  className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-line/40 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ProvisionOwnerForm
                canteens={canteens}
                defaultCanteenId={reassignModalState.canteenId}
                onDone={() => setReassignModalState({ open: false })}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
