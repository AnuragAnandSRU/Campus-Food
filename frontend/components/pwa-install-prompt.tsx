'use client';

import { PwaLifecycle } from './pwa-lifecycle';

/**
 * Re-exports PwaLifecycle for backwards compatibility.
 * Replaces the old floating bottom prompt banner with a headless lifecycle manager.
 */
export function PwaInstallPrompt() {
  return <PwaLifecycle />;
}
