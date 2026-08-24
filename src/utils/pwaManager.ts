// NetStudio Intelligent PWA Installation & Capability Manager
// Automatic platform detection without querying the user

export type InstallMethod =
  | 'native-pwa'
  | 'ios-home-screen'
  | 'manual-pwa'
  | 'already-installed'
  | 'unsupported';

export interface PWAInstallState {
  method: InstallMethod;
  isStandalone: boolean;
  isInstallable: boolean;
  canPrompt: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWindows: boolean;
  isMac: boolean;
  isDesktop: boolean;
  platformName: string;
}

const DISMISSED_STORAGE_KEY = 'netstudio_install_banner_dismissed_at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Detect if running as installed standalone PWA
export const isStandalonePWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Detect iOS / iPadOS device
export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isApple = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isApple || isIPadOS;
};

// Detect Android
export const isAndroidDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
};

// Detect Windows
export const isWindowsDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Windows/i.test(navigator.userAgent || '');
};

// Detect Mac Desktop
export const isMacDesktop = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Macintosh|Mac OS X/i.test(navigator.userAgent || '') && !isIOSDevice();
};

// Check if user dismissed banner recently
export const isInstallBannerDismissed = (): boolean => {
  try {
    const timestampStr = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!timestampStr) return false;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    return Date.now() - timestamp < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
};

// Mark banner as dismissed
export const setInstallBannerDismissed = (): void => {
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, Date.now().toString());
  } catch {
    // Silent catch
  }
};

// Reset dismissal
export const clearInstallBannerDismissed = (): void => {
  try {
    localStorage.removeItem(DISMISSED_STORAGE_KEY);
  } catch {
    // Silent catch
  }
};

/**
 * App shell version — bump this whenever the player/streaming logic changes.
 * A mismatch triggers a ONE-TIME purge of every stale Service Worker and
 * cache, followed by a single automatic reload so users ALWAYS run the
 * latest player code (no more hijacked/refreshing playback sessions).
 */
export const APP_SHELL_VERSION = 'netstudio-shell-v3';
const SHELL_VERSION_KEY = 'netstudio_active_shell_version';

// Purge EVERYTHING stale (old workers + caches) when the shell version changes
const purgeStaleAppShell = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('caches' in window)) {
    return false;
  }
  let purged = false;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((reg) => reg.unregister()));
    purged = registrations.length > 0;
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    localStorage.setItem(SHELL_VERSION_KEY, APP_SHELL_VERSION);
    console.log('[NetStudio PWA] Stale app shell purged; fresh version loaded.');
  } catch {
    try {
      localStorage.setItem(SHELL_VERSION_KEY, APP_SHELL_VERSION);
    } catch { /* silent */ }
  }
  return purged;
};

// Register Service Worker in production
export const registerNetStudioServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // 1. One-time migration: wipe old workers/caches if the shell version changed
  try {
    const activeVersion = localStorage.getItem(SHELL_VERSION_KEY);
    if (activeVersion && activeVersion !== APP_SHELL_VERSION) {
      const didPurge = await purgeStaleAppShell();
      if (didPurge) {
        window.location.reload();
        return;
      }
    } else if (!activeVersion) {
      localStorage.setItem(SHELL_VERSION_KEY, APP_SHELL_VERSION);
    }
  } catch { /* silent */ }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    // Auto-activate new workers instantly (no waiting for user refresh)
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      }
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // Poll for updates every 30 minutes and on tab focus
    setInterval(() => registration.update().catch(() => {}), 30 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update().catch(() => {});
    });

    console.log('[NetStudio PWA] Service Worker registered successfully, scope:', registration.scope);
  } catch (err) {
    console.warn('[NetStudio PWA] Service Worker registration note:', err);
  }
};

// Request Push Notification Permission
export const requestPushNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('NetStudio Notifications Enabled', {
          body: 'You will receive alerts for new Agasobanuye movies, series & live TV events!',
          icon: '/icon-192.png',
          badge: '/icon-192.png'
        });
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[NetStudio Notification Error]:', err);
    return false;
  }
};
