// NetStudio Universal OS Detection & App Download Utility
// - Android users download the .apk file directly from the browser
// - iOS users are redirected to the App Store (direct download is not allowed on iOS)
// - Desktop users see both links

export const APP_STORE_CONFIG = {
  androidApkUrl: '/downloads/netstudio.apk',
  androidPlayStoreUrl: 'https://play.google.com/store/apps/details?id=com.netstudio.app',
  iosAppStoreUrl: 'https://apps.apple.com/app/id6470000000',
  androidAppId: 'com.netstudio.app',
  iosAppId: '6470000000'
};

export interface GetAppOptions {
  onDesktopFallback?: () => void;
  customAndroidUrl?: string;
  customIosUrl?: string;
}

/**
 * Universal getApp function:
 * - Android -> Direct .apk download in browser
 * - iOS -> Redirect to Apple App Store
 * - Desktop -> Shows both links
 */
export function getApp(options?: GetAppOptions): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  var userAgent = navigator.userAgent || (navigator as any).vendor || (window as any).opera || '';

  if (/android/i.test(userAgent)) {
    // Direct APK download for Android
    const apkUrl = options?.customAndroidUrl || APP_STORE_CONFIG.androidApkUrl || '/downloads/netstudio.apk';
    window.location.href = apkUrl;
  } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    // Redirect iOS users to App Store
    const iosUrl = options?.customIosUrl || APP_STORE_CONFIG.iosAppStoreUrl;
    window.location.href = iosUrl;
  } else {
    // Fallback for desktop: Show both links
    if (options?.onDesktopFallback) {
      options.onDesktopFallback();
    } else if (typeof (window as any).__triggerDesktopGetAppModal === 'function') {
      (window as any).__triggerDesktopGetAppModal();
    } else {
      alert('Please download from Google Play or App Store.');
    }
  }
}

// Expose getApp on global window object for universal HTML / button onclick compatibility
if (typeof window !== 'undefined') {
  (window as any).getApp = getApp;
}

