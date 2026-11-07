'use client';

import { create } from 'zustand';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  canInstall: boolean;
  isIos: boolean;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setIsInstalled: (val: boolean) => void;
  setIsIos: (val: boolean) => void;
  promptInstall: () => Promise<boolean>;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  deferredPrompt: null,
  isInstalled: false,
  canInstall: false,
  isIos: false,
  setDeferredPrompt: (prompt) =>
    set({
      deferredPrompt: prompt,
      canInstall: prompt !== null && !get().isInstalled,
    }),
  setIsInstalled: (val) =>
    set({
      isInstalled: val,
      canInstall: val ? false : get().deferredPrompt !== null,
    }),
  setIsIos: (val) => set({ isIos: val }),
  promptInstall: async () => {
    const prompt = get().deferredPrompt;
    if (!prompt) return false;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        set({ deferredPrompt: null, canInstall: false, isInstalled: true });
        return true;
      }
      set({ deferredPrompt: null, canInstall: false });
      return false;
    } catch (err) {
      console.warn('PWA install prompt error:', err);
      set({ deferredPrompt: null, canInstall: false });
      return false;
    }
  },
}));
