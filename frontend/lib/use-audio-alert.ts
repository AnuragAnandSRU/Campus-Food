'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook providing audio chimes and background-tab visual alerts for incoming kitchen orders.
 * Uses the Web Audio API to synthesize a pleasant, clear two-tone chime without external audio assets.
 * Automatically unlocks the browser Web Audio Autoplay Policy upon any user interaction on desktop or touch devices.
 */
export function useAudioAlert(pageTitle = 'CampusFood') {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem('campus_food_kitchen_sound');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const originalTitleRef = useRef(pageTitle);

  // Update default page title if changed
  useEffect(() => {
    originalTitleRef.current = pageTitle;
  }, [pageTitle]);

  // Clean up title flash on focus
  useEffect(() => {
    function handleFocus() {
      if (flashTimerRef.current) {
        clearInterval(flashTimerRef.current);
        flashTimerRef.current = null;
        document.title = originalTitleRef.current;
      }
    }

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (flashTimerRef.current) clearInterval(flashTimerRef.current);
    };
  }, []);

  // Unlock browser Web Audio Autoplay Policy on first user interaction anywhere on the page (clicks, keys, touch)
  useEffect(() => {
    function unlockAudio() {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    }

    window.addEventListener('click', unlockAudio, { once: true, passive: true });
    window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
    window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Initialize or resume AudioContext
  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Plays a cheerful two-tone chime (E5 -> A5)
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Tone 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Tone 2: A5 (880 Hz) - higher, brighter bell tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn('Audio chime playback failed:', e);
    }
  }, [soundEnabled, getAudioContext]);

  // Flash tab title if window is not currently active
  const triggerTabAlert = useCallback((orderId?: string) => {
    if (typeof document === 'undefined') return;

    if (document.hidden || !document.hasFocus()) {
      if (flashTimerRef.current) clearInterval(flashTimerRef.current);

      let isAlert = true;
      const alertTitle = `🔔 (1) New Order${orderId ? ` #${orderId.slice(-4)}` : ''}!`;

      flashTimerRef.current = setInterval(() => {
        document.title = isAlert ? alertTitle : originalTitleRef.current;
        isAlert = !isAlert;
      }, 1000);
    }
  }, []);

  // Combined incoming order alert
  const notifyNewOrder = useCallback(
    (orderId?: string) => {
      playChime();
      triggerTabAlert(orderId);
    },
    [playChime, triggerTabAlert]
  );

  // Toggle sound with confirmation beep
  const toggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem('campus_food_kitchen_sound', String(next));
    } catch {}

    if (next) {
      // Test audio context and play a brief confirmation ping
      try {
        const ctx = getAudioContext();
        if (ctx) {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(880, now);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
        }
      } catch {}
    }
  }, [soundEnabled, getAudioContext]);

  return {
    soundEnabled,
    toggleSound,
    notifyNewOrder,
    playChime,
  };
}
