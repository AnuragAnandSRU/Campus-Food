import { useAuthStore, type User } from '@/store/auth-store';

export type PortalDoor = 'student' | 'partner' | 'admin';

export function isPartnerRole(role?: string | null): boolean {
  return role === 'owner' || role === 'staff';
}

/** Canonical workspace landing route for each authenticated role. */
export function getRoleHomePath(role?: string | null): string {
  if (role === 'admin') return '/admin';
  if (isPartnerRole(role)) return '/dashboard';
  if (role === 'student') return '/canteens';
  return '/';
}

/** Dedicated sign-in door belonging to a role. */
export function getRoleLoginPath(role?: string | null): string {
  if (role === 'admin') return '/admin/login';
  if (isPartnerRole(role)) return '/partner';
  return '/login';
}

/** Resolves the portal door corresponding to a role for recovery flows. */
export function getRoleDoor(role?: string | null): PortalDoor {
  if (role === 'admin') return 'admin';
  if (isPartnerRole(role)) return 'partner';
  return 'student';
}

/** Pathname-based door fallback when no authenticated user record is available. */
export function inferDoorFromPath(pathname: string): PortalDoor {
  if (pathname.startsWith('/admin')) return 'admin';
  if (
    pathname.startsWith('/partner') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/accept-invite')
  ) {
    return 'partner';
  }
  return 'student';
}

export function getLoginPathForPathname(pathname: string): string {
  const door = inferDoorFromPath(pathname);
  if (door === 'admin') return '/admin/login';
  if (door === 'partner') return '/partner';
  return '/login';
}

/**
 * Validates that an internal path belongs to the given role so `?redirect=`
 * params never cause open redirects or cross-role ping-pong loops.
 */
export function isPathAllowedForRole(
  targetPath: string,
  role?: string | null
): boolean {
  if (!role || !targetPath.startsWith('/') || targetPath.startsWith('//')) {
    return false;
  }

  const pathname = targetPath.split('?')[0].split('#')[0];

  if (pathname === '/profile') {
    return true;
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (pathname === '/admin/login') return false;
    return role === 'admin';
  }

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (role === 'owner') return true;
    if (role === 'staff') {
      return (
        pathname === '/dashboard' ||
        pathname === '/dashboard/menu' ||
        pathname === '/dashboard/analytics'
      );
    }
    return false;
  }

  if (
    pathname === '/' ||
    pathname === '/canteens' ||
    pathname.startsWith('/canteens/') ||
    pathname === '/cart' ||
    pathname === '/checkout' ||
    pathname === '/orders' ||
    pathname.startsWith('/orders/') ||
    pathname === '/favorites'
  ) {
    return role === 'student';
  }

  return false;
}

/** Returns `rawRedirect` if safe and permitted for `role`, otherwise role home. */
export function getSafeRedirectForRole(
  rawRedirect: string | null | undefined,
  role?: string | null
): string {
  if (rawRedirect && isPathAllowedForRole(rawRedirect, role)) {
    return rawRedirect;
  }
  return getRoleHomePath(role);
}

/** Reads auth state from Zustand with localStorage fallback before hydration. */
export function readStoredAuth(): { isAuthed: boolean; user: User | null } {
  const state = useAuthStore.getState();
  let currentUser = state.user;

  if (typeof window === 'undefined') {
    return {
      isAuthed: state.isAuthenticated && Boolean(state.token),
      user: currentUser,
    };
  }

  if (!currentUser) {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser) as User;
      } catch {
        currentUser = null;
      }
    }
  }

  const hasToken = Boolean(localStorage.getItem('token'));
  const isAuthed =
    (state.isAuthenticated && Boolean(state.token)) || hasToken;

  return { isAuthed, user: currentUser };
}

