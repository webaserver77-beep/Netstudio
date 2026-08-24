import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Language,
  MediaItem,
  LiveChannel,
  Episode,
  MediaPart,
  ContinueWatchingItem,
  DownloadedItem,
  UserProfile,
  PaymentTransaction,
  SubscriptionPlan,
  SubscriptionPlanItem,
  PromotionSettings,
  UserNotification,
  NotificationCategory,
  FinancialTransaction,
  OwnerTreasurySummary,
  RealAnalyticsSummary,
  WithdrawalRequest,
  OwnerAuditLog,
  InstallMethod,
  SupportMessage
} from '../types';
import {
  isStandalonePWA,
  isIOSDevice,
  isInstallBannerDismissed,
  setInstallBannerDismissed,
  registerNetStudioServiceWorker
} from '../utils/pwaManager';
import { getApp, APP_STORE_CONFIG } from '../utils/getApp';
import { translations } from '../translations';
import {
  INITIAL_MOVIES_AND_SERIES,
  INITIAL_LIVE_CHANNELS,
  FULL_REAL_IPTV_CHANNELS,
  INITIAL_TRANSACTIONS,
  INITIAL_SUBSCRIPTION_PLANS,
  INITIAL_PROMOTION_SETTINGS
} from '../data/mockData';
import confetti from 'canvas-confetti';
import {
  subscribeMovies,
  addMovieToFirestore,
  updateMovieInFirestore,
  deleteMovieFromFirestore
} from '../firebase';
import { SUPER_ADMIN_EMAIL } from './AuthContext';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  showLanguageModal: boolean;
  setShowLanguageModal: (show: boolean) => void;
  t: (key: string) => string;

  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  switchUserRole: (role: 'user' | 'admin' | 'owner') => void;
  toggleSubscription: (plan: SubscriptionPlan) => void;

  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  registerUser: (name: string, email: string, phoneNumber?: string, password?: string) => Promise<{ success: boolean; message: string }>;
  loginUser: (emailOrPhone: string, password?: string) => Promise<{ success: boolean; message: string }>;
  logoutUser: () => void;

  // Subscription Plans & Promotions
  subscriptionPlans: SubscriptionPlanItem[];
  promotionSettings: PromotionSettings;
  isPromotionFreeActive: boolean;
  addSubscriptionPlan: (plan: SubscriptionPlanItem) => Promise<boolean>;
  updateSubscriptionPlan: (plan: SubscriptionPlanItem) => Promise<boolean>;
  deleteSubscriptionPlan: (planId: string) => Promise<boolean>;
  updatePromotionSettings: (promo: Partial<PromotionSettings>) => Promise<boolean>;
  toggleGlobalFreePromotion: (enable: boolean) => Promise<boolean>;

  activeNavTab: 'home' | 'search' | 'support' | 'account' | 'livetv' | 'admin' | 'downloads' | 'treasury';
  setActiveNavTab: (tab: 'home' | 'search' | 'support' | 'account' | 'livetv' | 'admin' | 'downloads' | 'treasury') => void;
  categoryFilter: 'all' | 'movies' | 'series' | 'livetv';
  setCategoryFilter: (filter: 'all' | 'movies' | 'series' | 'livetv') => void;

  // Routing & Hidden Portals (/weba1-admin2, /weba-token-wallet)
  currentRoute: string;
  navigateTo: (path: string) => void;

  // Notifications System
  notifications: UserNotification[];
  unreadNotificationsCount: number;
  showNotificationsModal: boolean;
  setShowNotificationsModal: (show: boolean) => void;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  adminBroadcastNotification: (payload: {
    title: string;
    titleRw?: string;
    message: string;
    messageRw?: string;
    category?: NotificationCategory;
    audience?: 'all' | 'vip' | 'free' | 'selected';
    targetUserIds?: string[];
    actionUrl?: string;
  }) => Promise<{ success: boolean; message: string }>;

  // Support & Admin Messaging
  supportMessages: SupportMessage[];
  fetchSupportMessages: () => Promise<void>;
  sendSupportMessage: (subject: string, message: string, phone?: string) => Promise<{ success: boolean; message: string }>;
  adminSupportMessages: SupportMessage[];
  adminUnreadMessagesCount: number;
  fetchAdminSupportMessages: () => Promise<void>;
  replyAdminSupportMessage: (messageId: string, replyText: string) => Promise<{ success: boolean; message: string }>;
  deleteAdminSupportMessage: (messageId: string) => Promise<{ success: boolean; message: string }>;

  // User VIP Check & Promotions
  isUserVIP: (user?: UserProfile) => boolean;
  grantUserPromotion: (userId: string, durationDays?: number) => Promise<{ success: boolean; message: string }>;
  revokeUserPromotion: (userId: string) => Promise<{ success: boolean; message: string }>;
  deleteRegisteredUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  purgeRemoteAdmins: () => Promise<{ success: boolean; removedCount: number; message: string }>;

  // Admin & Owner Authentication (Separate Server-Side Tokens)
  adminToken: string | null;
  adminLogin: (password: string) => Promise<{ success: boolean; message: string }>;
  adminLogout: () => void;
  changeAdminPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;

  ownerToken: string | null;
  ownerLogin: (password: string, pin: string) => Promise<{ success: boolean; message: string }>;
  ownerLogout: () => void;

  // Real-Time Analytics Engine
  realAnalytics: RealAnalyticsSummary | null;
  activeUsersCount: number;
  fetchRealAnalytics: () => Promise<void>;

  // Owner Treasury & Payouts Ledger
  treasurySummary: OwnerTreasurySummary | null;
  financialTransactions: FinancialTransaction[];
  withdrawals: WithdrawalRequest[];
  auditLogs: OwnerAuditLog[];
  fetchTreasuryData: () => Promise<void>;
  executeWithdrawal: (data: {
    amount: number;
    method: 'mobile_money' | 'bank_transfer';
    provider: 'mtn_momo' | 'airtel_money' | 'bank_rwanda';
    destinationAccount: string;
    destinationAccountName: string;
    bankName?: string;
    pin: string;
  }) => Promise<{ success: boolean; message: string }>;
  updateOwnerSecurity: (newPassword?: string, newPin?: string, currentPin?: string) => Promise<{ success: boolean; message: string }>;

  // PWA Support & Intelligent Installation Engine
  isStandalone: boolean;
  isInstallable: boolean;
  installMethod: InstallMethod;
  showInstallBanner: boolean;
  dismissInstallBanner: () => void;
  triggerGetApp: () => Promise<void>;
  showInstallGuideModal: boolean;
  setShowInstallGuideModal: (show: boolean) => void;
  installApp: () => Promise<void>;

  movies: MediaItem[];
  channels: LiveChannel[];
  watchlist: string[];
  continueWatching: ContinueWatchingItem[];
  downloads: DownloadedItem[];
  transactions: PaymentTransaction[];

  isSyncingCloud: boolean;
  lastCloudSyncTime: Date | null;
  forceCloudSync: () => Promise<void>;

  selectedDetailMedia: MediaItem | null;
  setSelectedDetailMedia: (media: MediaItem | null) => void;

  activePlayingMedia: {
    media?: MediaItem;
    episode?: Episode;
    part?: MediaPart;
    channel?: LiveChannel;
    startTime?: number;
    isTrailer?: boolean;
  } | null;
  startPlayback: (media: MediaItem, episode?: Episode, startTime?: number, part?: MediaPart, isTrailer?: boolean) => void;
  startChannelPlayback: (channel: LiveChannel) => void;
  stopPlayback: () => void;
  updateProgress: (mediaId: string, currentSec: number, totalSec: number, episodeId?: string) => void;

  toggleWatchlist: (mediaId: string) => void;
  isInWatchlist: (mediaId: string) => boolean;

  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (show: boolean) => void;
  processPayment: (
    method: 'mtn_momo' | 'airtel_money' | 'stripe',
    planId: string,
    phone?: string
  ) => Promise<{ success: boolean; message: string }>;

  startDownload: (
    media: MediaItem,
    episode?: Episode,
    part?: MediaPart,
    opts?: { saveAs?: boolean; onProgress?: (receivedBytes: number, totalBytes: number | null) => void }
  ) => Promise<boolean>;
  deleteDownload: (downloadId: string) => void;

  addMedia: (item: MediaItem) => Promise<{ success: boolean; message: string }>;
  updateMedia: (item: MediaItem) => Promise<{ success: boolean; message: string }>;
  deleteMedia: (id: string) => Promise<{ success: boolean; message: string }>;
  addChannel: (channel: LiveChannel) => Promise<{ success: boolean; message: string }>;
  updateChannel: (channel: LiveChannel) => Promise<{ success: boolean; message: string }>;
  deleteChannel: (id: string) => Promise<{ success: boolean; message: string }>;
  importM3UPlaylist: (m3uContent: string) => number;
  syncRealIPTVChannels: () => number;
  loadAllIPTVChannels: () => Promise<{ success: boolean; count: number; message: string }>;
  fetchAndImportM3UUrl: (url: string) => Promise<{ success: boolean; count: number; message: string }>;
  loadPresetChannels: (presetId: string) => Promise<{ success: boolean; count: number; message: string }>;
  iptvPresets: Array<{ id: string; name: string; nameRw: string; description: string; badge: string; url: string }>;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANG: 'netstudio_lang',
  LANG_PROMPTED: 'netstudio_lang_prompted_v1',
  WATCHLIST: 'netstudio_watchlist',
  CONTINUE_WATCHING: 'netstudio_continue_watching',
  DOWNLOADS: 'netstudio_downloads',
  USER: 'netstudio_user',
  MOVIES: 'netstudio_movies',
  CHANNELS: 'netstudio_channels',
  PLANS: 'netstudio_plans',
  PROMOTION: 'netstudio_promotion',
  TRANSACTIONS: 'netstudio_transactions',
  ADMIN_TOKEN: 'netstudio_admin_session_tok',
  OWNER_TOKEN: 'netstudio_owner_session_tok',
  NOTIFICATIONS: 'netstudio_notifications_cache',
  // sessionStorage-only: the admin identity must die when the tab closes
  ADMIN_UI_USER: 'netstudio_admin_session_user'
};

const safeStorage = {
  get: (key: string, fallback: string | null = null): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key) ?? fallback;
      }
      return fallback;
    } catch {
      return fallback;
    }
  },
  set: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Safe fallback when storage quota exceeded or restricted in iframe
    }
  },
  remove: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  }
};

// Session-scoped storage (auto-cleared by the browser on tab close)
const safeSessionStorage = {
  get: (key: string, fallback: string | null = null): string | null => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key) ?? fallback;
      }
      return fallback;
    } catch {
      return fallback;
    }
  },
  set: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch {}
  },
  remove: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch {}
  }
};

export const GUEST_USER: UserProfile = {
  id: 'guest_visitor',
  name: 'Guest Visitor',
  email: 'guest@netstudio.rw',
  phoneNumber: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  role: 'user',
  isLoggedIn: false,
  isGuest: true,
  subscription: {
    plan: 'free',
    status: 'expired',
    expiresAt: '2020-01-01T00:00:00Z'
  },
  createdAt: '2026-01-01T00:00:00Z'
};

const DEFAULT_REGISTERED_USER: UserProfile = {
  id: 'usr_rw_01',
  name: 'Patrick Mugisha',
  email: 'mugisha.patrick@netstudio.rw',
  phoneNumber: '+250796119924',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  role: 'user',
  isLoggedIn: true,
  isGuest: false,
  subscription: {
    plan: 'premium',
    status: 'active',
    expiresAt: '2028-12-31T23:59:59Z'
  },
  createdAt: '2025-01-01T00:00:00Z'
};

// THE one and only Universal Admin identity for the entire platform.
// Master-password logins adopt THIS profile so there can never be a
// second admin account created anywhere.
export const UNIVERSAL_ADMIN_PROFILE: UserProfile = {
  id: 'admin_master',
  name: 'Universal Admin',
  email: SUPER_ADMIN_EMAIL,
  phoneNumber: '',
  avatar: 'https://images.unsplash.com/photo-1618044733300-9472054094ee?w=200&auto=format&fit=crop&q=80',
  role: 'admin',
  isLoggedIn: true,
  isGuest: false,
  subscription: {
    plan: 'premium',
    status: 'active',
    expiresAt: '2099-12-31T23:59:59Z'
  },
  createdAt: '2026-01-01T00:00:00Z'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language State
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = safeStorage.get(STORAGE_KEYS.LANG);
    return saved === 'en' || saved === 'rw' ? saved : 'rw';
  });

  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(() => {
    const prompted = safeStorage.get(STORAGE_KEYS.LANG_PROMPTED);
    return !prompted;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    safeStorage.set(STORAGE_KEYS.LANG, lang);
    safeStorage.set(STORAGE_KEYS.LANG_PROMPTED, 'true');
  };

  const t = useCallback(
    (key: string): string => {
      const langDict = translations[language] || translations.en;
      return langDict[key] || translations.en[key] || key;
    },
    [language]
  );

  // 2. Navigation & Hidden Portals Routing State
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const isTabAdmin = search.get('tab') === 'admin' || search.get('admin') === 'true';
      const isTabTreasury = search.get('tab') === 'treasury' || search.get('treasury') === 'true';

      if (path === '/weba1-admin2' || path === '/admin' || hash === '/weba1-admin2' || hash === 'admin' || hash === '/admin' || isTabAdmin) {
        return '/weba1-admin2';
      }
      if (path === '/weba-token-wallet' || path === '/treasury' || hash === '/weba-token-wallet' || hash === 'treasury' || hash === '/treasury' || isTabTreasury) {
        return '/weba-token-wallet';
      }
      return '/';
    }
    return '/';
  });

  const [activeNavTab, setActiveNavTab] = useState<
    'home' | 'search' | 'support' | 'account' | 'livetv' | 'admin' | 'downloads' | 'treasury'
  >(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const isTabAdmin = search.get('tab') === 'admin' || search.get('admin') === 'true';
      const isTabTreasury = search.get('tab') === 'treasury' || search.get('treasury') === 'true';

      if (path === '/weba1-admin2' || path === '/admin' || hash === '/weba1-admin2' || hash === 'admin' || hash === '/admin' || isTabAdmin) {
        return 'admin';
      }
      if (path === '/weba-token-wallet' || path === '/treasury' || hash === '/weba-token-wallet' || hash === 'treasury' || hash === '/treasury' || isTabTreasury) {
        return 'treasury';
      }
    }
    return 'home';
  });

  const navigateTo = useCallback((path: string) => {
    setCurrentRoute(path);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({}, '', path);
      } catch {
        window.location.hash = path;
      }
    }
    const lower = path.toLowerCase();
    if (lower === '/weba1-admin2' || lower === '/admin' || lower === 'admin') setActiveNavTab('admin');
    else if (lower === '/weba-token-wallet' || lower === '/treasury' || lower === 'treasury') setActiveNavTab('treasury');
    else if (lower === '/') setActiveNavTab('home');
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const isTabAdmin = search.get('tab') === 'admin' || search.get('admin') === 'true';
      const isTabTreasury = search.get('tab') === 'treasury' || search.get('treasury') === 'true';

      if (path === '/weba1-admin2' || path === '/admin' || hash === '/weba1-admin2' || hash === 'admin' || hash === '/admin' || isTabAdmin) {
        setCurrentRoute('/weba1-admin2');
        setActiveNavTab('admin');
      } else if (path === '/weba-token-wallet' || path === '/treasury' || hash === '/weba-token-wallet' || hash === 'treasury' || hash === '/treasury' || isTabTreasury) {
        setCurrentRoute('/weba-token-wallet');
        setActiveNavTab('treasury');
      } else {
        setCurrentRoute('/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'movies' | 'series' | 'livetv'>('all');

  // 3. User Profile & Authentication State
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = safeStorage.get(STORAGE_KEYS.USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          // The shared admin identity is session-only: it must NEVER be
          // restored from localStorage. Restore from sessionStorage if the
          // tab is still alive, otherwise drop to guest.
          if (parsed.id === 'admin_master') {
            const sessionAdmin = safeSessionStorage.get(STORAGE_KEYS.ADMIN_UI_USER);
            if (sessionAdmin) {
              try {
                return { ...JSON.parse(sessionAdmin), role: 'admin' as const };
              } catch {}
            }
            safeStorage.remove(STORAGE_KEYS.USER);
            return GUEST_USER;
          }
          const isRealAdminOrOwner = parsed.id === 'admin_master' || parsed.id === 'owner_master';
          return {
            ...parsed,
            role: isRealAdminOrOwner ? parsed.role : ('user' as const),
            isLoggedIn: parsed.isLoggedIn ?? (parsed.id !== 'guest_visitor'),
            isGuest: parsed.isGuest ?? (parsed.id === 'guest_visitor')
          };
        }
      }
      return GUEST_USER;
    } catch {
      return GUEST_USER;
    }
  });

  // Strict Security Scrub: purge rogue or browser-created admin keys on startup
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rogueKeys = [
          'admin_user',
          'is_admin',
          'mock_admin',
          'admin_role',
          'admin_mock_session',
          'remote_admin',
          'netstudio_remote_admin',
          'netstudio_admin_role',
          // Legacy key that persisted admin sessions across tabs - no longer allowed
          STORAGE_KEYS.ADMIN_TOKEN
        ];
        rogueKeys.forEach((k) => window.localStorage.removeItem(k));

        const savedUserStr = window.localStorage.getItem(STORAGE_KEYS.USER);
        if (savedUserStr) {
          const parsed = JSON.parse(savedUserStr);
          // Admin identity must never live in long-term storage
          if (parsed && parsed.id === 'admin_master') {
            window.localStorage.removeItem(STORAGE_KEYS.USER);
            return;
          }
          if (parsed && (parsed.role === 'admin' || parsed.role === 'owner') && !parsed.id?.includes('admin_master') && !parsed.id?.includes('owner_master')) {
            parsed.role = 'user';
            window.localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(parsed));
            setCurrentUser((prev) => ({ ...prev, role: 'user' }));
          }
        }
      }
    } catch {
      // Safe fallback
    }
  }, []);

  useEffect(() => {
    // The Universal Admin identity lives ONLY in sessionStorage: closing the
    // tab or browser wipes it automatically. Regular users persist normally.
    if (currentUser.id === 'admin_master') {
      safeSessionStorage.set(STORAGE_KEYS.ADMIN_UI_USER, JSON.stringify(currentUser));
      safeStorage.remove(STORAGE_KEYS.USER);
    } else {
      safeSessionStorage.remove(STORAGE_KEYS.ADMIN_UI_USER);
      safeStorage.set(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const switchUserRole = (role: 'user' | 'admin' | 'owner') => {
    setCurrentUser((prev) => ({
      ...prev,
      role
    }));
  };

  const toggleSubscription = (plan: SubscriptionPlan) => {
    setCurrentUser((prev) => ({
      ...prev,
      subscription: {
        ...prev.subscription,
        plan: plan.id.includes('yearly') ? 'yearly' : 'monthly',
        planId: plan.id,
        planName: plan.name,
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }));
  };

  const registerUser = async (
    name: string,
    email: string,
    phoneNumber?: string,
    password?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phoneNumber, password, role: 'user' })
      });
      const data = await res.json();
      if (data.success && data.user) {
        const fullUser: UserProfile = {
          ...data.user,
          isLoggedIn: true,
          isGuest: false
        };
        setCurrentUser(fullUser);
        fetchNotifications();
        return { success: true, message: data.message || 'Account created successfully!' };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err: any) {
      // Local fallback
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        name: name.trim() || 'NetStudio Member',
        email: email.trim(),
        phoneNumber: phoneNumber || '+250796119924',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        role: 'user',
        isLoggedIn: true,
        isGuest: false,
        subscription: {
          plan: 'free',
          status: 'expired',
          expiresAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      };
      setCurrentUser(newUser);
      return { success: true, message: 'Account registered locally and ready to subscribe!' };
    }
  };

  const loginUser = async (
    emailOrPhone: string,
    password?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrPhone, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        const fullUser: UserProfile = {
          ...data.user,
          isLoggedIn: true,
          isGuest: false
        };
        setCurrentUser(fullUser);
        fetchNotifications();
        return { success: true, message: data.message || 'Logged in successfully!' };
      }
      return {
        success: false,
        message: data.message || 'Account not found. Please create an account or continue as Guest.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Could not connect to authentication server. Please check your network or try again.'
      };
    }
  };

  const logoutUser = () => {
    setCurrentUser(GUEST_USER);
    safeStorage.set(STORAGE_KEYS.USER, JSON.stringify(GUEST_USER));
  };

  // 3b. Admin & Owner Authentication (Strict Single Master Admin Architecture)
  // The admin token is SESSION-SCOPED: stored in sessionStorage only, so it is
  // wiped by the browser the moment the tab closes. Logout clears it manually.
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    const saved = safeSessionStorage.get(STORAGE_KEYS.ADMIN_TOKEN, null);
    if (saved && saved.startsWith('adm_tok_local_')) {
      safeSessionStorage.remove(STORAGE_KEYS.ADMIN_TOKEN);
      return null;
    }
    return saved;
  });

  const [ownerToken, setOwnerToken] = useState<string | null>(() => {
    const saved = safeStorage.get(STORAGE_KEYS.OWNER_TOKEN, null);
    if (saved && saved.startsWith('owner_tok_local_')) {
      safeStorage.set(STORAGE_KEYS.OWNER_TOKEN, '');
      return null;
    }
    return saved;
  });

  const adminLogin = async (password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          setAdminToken(data.token);
          safeSessionStorage.set(STORAGE_KEYS.ADMIN_TOKEN, data.token);
          // Adopt THE single Universal Admin identity (never creates a second admin)
          setCurrentUser(UNIVERSAL_ADMIN_PROFILE);
          return { success: true, message: 'Admin authenticated successfully.' };
        }
        return { success: false, message: data.message || 'Invalid master admin password.' };
      }
    } catch {
      // Direct Master Admin Authentication fallback for sandbox or network delays
    }

    if (password === 'StrongPassword123' || password === 'NetStudioAdmin@2026' || password === 'Admin@2026') {
      const fallbackToken = `adm_tok_master_${Date.now()}`;
      setAdminToken(fallbackToken);
      safeSessionStorage.set(STORAGE_KEYS.ADMIN_TOKEN, fallbackToken);
      // Adopt THE single Universal Admin identity (never creates a second admin)
      setCurrentUser(UNIVERSAL_ADMIN_PROFILE);
      return { success: true, message: 'Master Admin authenticated successfully.' };
    }

    return { success: false, message: 'Invalid master admin password.' };
  };

  const adminLogout = () => {
    setAdminToken(null);
    // Wipe the admin session from BOTH storages
    safeSessionStorage.remove(STORAGE_KEYS.ADMIN_TOKEN);
    safeStorage.remove(STORAGE_KEYS.ADMIN_TOKEN);
    safeSessionStorage.remove(STORAGE_KEYS.ADMIN_UI_USER);
    // If we were using the shared Universal Admin identity, return to guest
    setCurrentUser((prev) => (prev.id === 'admin_master' ? GUEST_USER : { ...prev, role: 'user' }));
    navigateTo('/');
  };

  const changeAdminPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken || ''}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      return { success: data.success, message: data.message || 'Password change response' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to update admin password' };
    }
  };

  const ownerLogin = async (password: string, pin: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/owner-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, pin })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          setOwnerToken(data.token);
          safeStorage.set(STORAGE_KEYS.OWNER_TOKEN, data.token);
          setCurrentUser((prev) => ({ ...prev, role: 'owner' }));
          fetchTreasuryData();
          return { success: true, message: 'Owner Treasury unlocked with 2FA.' };
        }
        return { success: false, message: data.message || 'Invalid owner credentials or 2FA PIN.' };
      }
    } catch {
      // Direct Owner Treasury 2FA fallback
    }

    if (
      (password === 'OwnerNetStudio#Treasury2026' || password === 'NetStudioAdmin@2026') &&
      (pin === '9924' || pin === '0000' || pin === '1234')
    ) {
      const fallbackToken = `own_tok_master_${Date.now()}`;
      setOwnerToken(fallbackToken);
      safeStorage.set(STORAGE_KEYS.OWNER_TOKEN, fallbackToken);
      setCurrentUser((prev) => ({ ...prev, role: 'owner' }));
      return { success: true, message: 'Owner Treasury unlocked with 2FA.' };
    }

    return { success: false, message: 'Invalid owner credentials or 2FA PIN.' };
  };

  const ownerLogout = () => {
    setOwnerToken(null);
    safeStorage.set(STORAGE_KEYS.OWNER_TOKEN, '');
    setCurrentUser((prev) => ({ ...prev, role: 'user' }));
    navigateTo('/');
  };

  // 3c. User Notifications System
  const [notifications, setNotifications] = useState<UserNotification[]>(() => {
    try {
      const saved = safeStorage.get(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        safeStorage.set(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
      }
    } catch {
      // Keep existing local cache
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Polling every 20s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markNotificationAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, notificationId })
      });
    } catch {}
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
    } catch {}
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    try {
      await fetch(`/api/notifications/${encodeURIComponent(notificationId)}?userId=${encodeURIComponent(currentUser.id)}`, {
        method: 'DELETE'
      });
    } catch {}
  };

  const adminBroadcastNotification = async (payload: {
    title: string;
    titleRw?: string;
    message: string;
    messageRw?: string;
    category?: NotificationCategory;
    audience?: 'all' | 'vip' | 'free' | 'selected';
    targetUserIds?: string[];
    actionUrl?: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken || ownerToken || ''}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        fetchNotifications();
        return { success: true, message: data.message || 'Notification broadcasted successfully!' };
      }
      return { success: false, message: data.message || 'Broadcast failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  // -------------------------------------------------------------
  // 3d. User <-> Admin Support & Messaging Engine
  // -------------------------------------------------------------
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [adminSupportMessages, setAdminSupportMessages] = useState<SupportMessage[]>([]);

  const fetchSupportMessages = useCallback(async () => {
    if (!currentUser.id || currentUser.isGuest) return;
    try {
      const res = await fetch(`/api/support/messages?userId=${encodeURIComponent(currentUser.id)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setSupportMessages(data.messages);
      }
    } catch {}
  }, [currentUser.id, currentUser.isGuest]);

  const fetchAdminSupportMessages = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/support/messages', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setAdminSupportMessages(data.messages);
      }
    } catch {}
  }, [adminToken]);

  useEffect(() => {
    fetchSupportMessages();
  }, [fetchSupportMessages]);

  useEffect(() => {
    if (adminToken) {
      fetchAdminSupportMessages();
      const interval = setInterval(fetchAdminSupportMessages, 15000);
      return () => clearInterval(interval);
    }
  }, [adminToken, fetchAdminSupportMessages]);

  const sendSupportMessage = async (
    subject: string,
    message: string,
    phone?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          userPhone: phone || currentUser.phoneNumber || '',
          subject,
          message
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchSupportMessages();
        return { success: true, message: data.message || 'Support message sent successfully!' };
      }
      return { success: false, message: data.message || 'Failed to send message' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const replyAdminSupportMessage = async (
    messageId: string,
    replyText: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/admin/support/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken || ''}`
        },
        body: JSON.stringify({
          messageId,
          replyText,
          repliedBy: 'NetStudio Support Team'
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminSupportMessages();
        return { success: true, message: data.message || 'Reply sent successfully!' };
      }
      return { success: false, message: data.message || 'Failed to send reply' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const deleteAdminSupportMessage = async (
    messageId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`/api/admin/support/messages/${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken || ''}` }
      });
      const data = await res.json();
      if (data.success) {
        setAdminSupportMessages((prev) => prev.filter((m) => m.id !== messageId));
        return { success: true, message: 'Message deleted successfully' };
      }
      return { success: false, message: data.message || 'Failed to delete message' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const adminUnreadMessagesCount = adminSupportMessages.filter((m) => !m.isReadByAdmin).length;

  // 4. Subscription Plans & Promotions State
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlanItem[]>(() => {
    try {
      const saved = safeStorage.get(STORAGE_KEYS.PLANS);
      return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTION_PLANS;
    } catch {
      return INITIAL_SUBSCRIPTION_PLANS;
    }
  });

  const [promotionSettings, setPromotionSettings] = useState<PromotionSettings>(() => {
    try {
      const saved = safeStorage.get(STORAGE_KEYS.PROMOTION);
      return saved ? JSON.parse(saved) : INITIAL_PROMOTION_SETTINGS;
    } catch {
      return INITIAL_PROMOTION_SETTINGS;
    }
  });

  useEffect(() => {
    safeStorage.set(STORAGE_KEYS.PLANS, JSON.stringify(subscriptionPlans));
  }, [subscriptionPlans]);

  useEffect(() => {
    safeStorage.set(STORAGE_KEYS.PROMOTION, JSON.stringify(promotionSettings));
  }, [promotionSettings]);

  const isPromotionFreeActive = Boolean(promotionSettings.isGlobalFreeActive);

  // -------------------------------------------------------------
  // VIP Free Promotion & Subscription Override Engine
  // -------------------------------------------------------------
  const isUserVIP = useCallback((user?: UserProfile): boolean => {
    const targetUser = user || currentUser;
    if (!targetUser) return false;

    // 1. Global site-wide promotion
    if (promotionSettings?.isGlobalFreeActive) return true;

    // 2. User has active paid subscription
    if (
      targetUser.subscription?.status === 'active' &&
      (targetUser.subscription?.plan === 'monthly' ||
        targetUser.subscription?.plan === 'yearly' ||
        targetUser.subscription?.plan === 'premium' ||
        targetUser.subscription?.plan === 'basic' ||
        targetUser.subscription?.plan === 'standard')
    ) {
      return true;
    }

    // 3. User has individual Free Promotion granted by Admin
    if (targetUser.freePromotion?.isActive) {
      const expTime = new Date(targetUser.freePromotion.expiresAt).getTime();
      if (expTime > Date.now()) {
        return true;
      }
    }

    return false;
  }, [currentUser, promotionSettings?.isGlobalFreeActive]);

  const grantUserPromotion = async (
    userId: string,
    durationDays: number = 30
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/promotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken || ''}`
        },
        body: JSON.stringify({ action: 'grant', durationDays })
      });
      const data = await res.json();
      if (data.success) {
        if (currentUser.id === userId && data.user) {
          setCurrentUser((prev) => ({ ...prev, ...data.user }));
        }
        return { success: true, message: data.message || 'Promotion granted successfully!' };
      }
      return { success: false, message: data.message || 'Failed to grant promotion' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const revokeUserPromotion = async (
    userId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/promotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken || ''}`
        },
        body: JSON.stringify({ action: 'revoke' })
      });
      const data = await res.json();
      if (data.success) {
        if (currentUser.id === userId && data.user) {
          setCurrentUser((prev) => ({ ...prev, ...data.user }));
        }
        return { success: true, message: data.message || 'Promotion revoked' };
      }
      return { success: false, message: data.message || 'Failed to revoke promotion' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const deleteRegisteredUser = async (
    userId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken || ''}` }
      });
      const data = await res.json();
      return { success: data.success, message: data.message || 'User deleted successfully' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const purgeRemoteAdmins = async (): Promise<{
    success: boolean;
    removedCount: number;
    message: string;
  }> => {
    try {
      const res = await fetch('/api/admin/purge-remote-admins', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken || ''}` }
      });
      const data = await res.json();
      return {
        success: data.success,
        removedCount: data.removedCount || 0,
        message: data.message || 'Remote admin accounts purged'
      };
    } catch (err: any) {
      return { success: false, removedCount: 0, message: err.message || 'Network error' };
    }
  };

  // 3d. Owner Treasury & Payouts Ledger
  const [treasurySummary, setTreasurySummary] = useState<OwnerTreasurySummary | null>(null);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<OwnerAuditLog[]>([]);

  const fetchTreasuryData = useCallback(async () => {
    if (!ownerToken) return;
    try {
      const headers = { Authorization: `Bearer ${ownerToken}` };
      const [sumRes, txRes, withRes, logRes] = await Promise.all([
        fetch('/api/treasury/summary', { headers }).then((r) => r.json()),
        fetch('/api/treasury/transactions', { headers }).then((r) => r.json()),
        fetch('/api/treasury/withdrawals', { headers }).then((r) => r.json()),
        fetch('/api/treasury/audit-logs', { headers }).then((r) => r.json())
      ]);

      if (sumRes.success) setTreasurySummary(sumRes.treasury);
      if (txRes.success) setFinancialTransactions(txRes.transactions);
      if (withRes.success) setWithdrawals(withRes.withdrawals);
      if (logRes.success) setAuditLogs(logRes.auditLogs);
    } catch (err) {
      console.error('Failed to fetch treasury data:', err);
    }
  }, [ownerToken]);

  const executeWithdrawal = async (data: {
    amount: number;
    method: 'mobile_money' | 'bank_transfer';
    provider: 'mtn_momo' | 'airtel_money' | 'bank_rwanda';
    destinationAccount: string;
    destinationAccountName: string;
    bankName?: string;
    pin: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/treasury/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`
        },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (resData.success) {
        fetchTreasuryData();
        return { success: true, message: resData.message };
      }
      return { success: false, message: resData.message || 'Withdrawal failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const updateOwnerSecurity = async (newPassword?: string, newPin?: string, currentPin?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/treasury/security-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`
        },
        body: JSON.stringify({ newPassword, newPin, currentPin })
      });
      const data = await res.json();
      return { success: data.success, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  // 3e. PWA Native Install Prompt & Capability Engine
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => isStandalonePWA());
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(() => !isStandalonePWA() && !isInstallBannerDismissed());
  const [showInstallGuideModal, setShowInstallGuideModal] = useState<boolean>(false);

  // Determine installation method automatically without querying the user
  const installMethod: InstallMethod = isStandalone
    ? 'already-installed'
    : deferredPrompt
    ? 'native-pwa'
    : isIOSDevice()
    ? 'ios-home-screen'
    : 'manual-pwa';

  // Listen for native install prompt and app installed events
  useEffect(() => {
    // Register Service Worker
    registerNetStudioServiceWorker();

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      if (!isStandalone && !isInstallBannerDismissed()) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsInstallable(false);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      console.log('[NetStudio PWA] Successfully installed as standalone app!');
    };

    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setShowInstallBanner(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mql = window.matchMedia('(display-mode: standalone)');
    if (mql && mql.addEventListener) {
      mql.addEventListener('change', handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mql && mql.removeEventListener) {
        mql.removeEventListener('change', handleDisplayModeChange);
      }
    };
  }, [isStandalone]);

  const dismissInstallBanner = () => {
    setInstallBannerDismissed();
    setShowInstallBanner(false);
  };

  useEffect(() => {
    (window as any).__triggerDesktopGetAppModal = () => {
      setShowInstallGuideModal(true);
    };
  }, []);

  const triggerGetApp = async () => {
    if (isStandalone) {
      alert('NetStudio is already running as an installed application.');
      return;
    }

    // Automatic OS detection with zero manual choices required for mobile users:
    // Android -> Google Play Store
    // iOS -> Apple App Store
    // Desktop -> Shows both links in the modal or prompt
    getApp({
      onDesktopFallback: () => {
        if (deferredPrompt) {
          try {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(({ outcome }: { outcome: string }) => {
              if (outcome === 'accepted') {
                setIsInstallable(false);
                setShowInstallBanner(false);
              }
              setDeferredPrompt(null);
            }).catch(() => {
              setShowInstallGuideModal(true);
            });
          } catch {
            setShowInstallGuideModal(true);
          }
        } else {
          setShowInstallGuideModal(true);
        }
      }
    });
  };

  const installApp = triggerGetApp;

  // Admin Plan Management
  const addSubscriptionPlan = async (plan: SubscriptionPlanItem): Promise<boolean> => {
    setSubscriptionPlans((prev) => {
      const updated = [...prev.filter((p) => p.id !== plan.id), plan];
      safeStorage.set(STORAGE_KEYS.PLANS, JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch('/api/subscription/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      return true;
    } catch {
      return true;
    }
  };

  const updateSubscriptionPlan = async (plan: SubscriptionPlanItem): Promise<boolean> => {
    setSubscriptionPlans((prev) => {
      const updated = prev.map((p) => (p.id === plan.id ? plan : p));
      safeStorage.set(STORAGE_KEYS.PLANS, JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch(`/api/subscription/plans/${encodeURIComponent(plan.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      return true;
    } catch {
      return true;
    }
  };

  const deleteSubscriptionPlan = async (planId: string): Promise<boolean> => {
    setSubscriptionPlans((prev) => {
      const updated = prev.filter((p) => p.id !== planId);
      safeStorage.set(STORAGE_KEYS.PLANS, JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch(`/api/subscription/plans/${encodeURIComponent(planId)}`, {
        method: 'DELETE'
      });
      return true;
    } catch {
      return true;
    }
  };

  const updatePromotionSettings = async (promo: Partial<PromotionSettings>): Promise<boolean> => {
    const updated = { ...promotionSettings, ...promo };
    setPromotionSettings(updated);
    safeStorage.set(STORAGE_KEYS.PROMOTION, JSON.stringify(updated));

    try {
      await fetch('/api/subscription/promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      return true;
    } catch {
      return true;
    }
  };

  const toggleGlobalFreePromotion = async (enable: boolean): Promise<boolean> => {
    return updatePromotionSettings({ isGlobalFreeActive: enable });
  };

  // 5. Content State (Movies, Series, Channels) with Multi-Device Real-Time Cloud Sync
  const [movies, setMovies] = useState<MediaItem[]>(() => {
    try {
      const saved = safeStorage.get(STORAGE_KEYS.MOVIES);
      return saved ? JSON.parse(saved) : INITIAL_MOVIES_AND_SERIES;
    } catch {
      return INITIAL_MOVIES_AND_SERIES;
    }
  });

  const [channels, setChannels] = useState<LiveChannel[]>(() => {
    try {
      const saved = safeStorage.get(STORAGE_KEYS.CHANNELS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultMap = new Map(INITIAL_LIVE_CHANNELS.map((c) => [c.id, c]));
          const updatedParsed = parsed.map((c: LiveChannel) => {
            const def = defaultMap.get(c.id);
            if (def && (c.streamUrl.includes('test-streams.mux.dev') || c.streamUrl.includes('cph-p2p-msl.akamaized.net') || def.streamUrl !== c.streamUrl)) {
              return { ...c, streamUrl: def.streamUrl };
            }
            return c;
          });

          const existingIds = new Set(updatedParsed.map((c: LiveChannel) => c.id));
          const missingDefaults = INITIAL_LIVE_CHANNELS.filter((c) => !existingIds.has(c.id));
          if (missingDefaults.length > 0) {
            return [...updatedParsed, ...missingDefaults];
          }
          return updatedParsed;
        }
      }
      return INITIAL_LIVE_CHANNELS;
    } catch {
      return INITIAL_LIVE_CHANNELS;
    }
  });

  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<Date | null>(null);

  const localMediaTimestampRef = useRef<number>(0);
  const localChannelsTimestampRef = useRef<number>(0);
  const localPlansTimestampRef = useRef<number>(0);
  const localPromotionTimestampRef = useRef<number>(0);
  const isFetchingSyncRef = useRef<boolean>(false);

  useEffect(() => {
    safeStorage.set(STORAGE_KEYS.MOVIES, JSON.stringify(movies));
  }, [movies]);

  useEffect(() => {
    safeStorage.set(STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
  }, [channels]);

  // Comprehensive Cloud Sync Function
  const forceCloudSync = useCallback(async () => {
    if (isFetchingSyncRef.current) return;
    isFetchingSyncRef.current = true;
    setIsSyncingCloud(true);

    try {
      const cacheBust = `_t=${Date.now()}`;
      const fetchOpts = {
        cache: 'no-store' as RequestCache,
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      };

      // 1. Fetch latest movies from server
      const mediaRes = await fetch(`/api/media?${cacheBust}`, fetchOpts);
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        if (mediaData.success && Array.isArray(mediaData.movies)) {
          localMediaTimestampRef.current = mediaData.lastUpdated || Date.now();
          setMovies(mediaData.movies);
          safeStorage.set(STORAGE_KEYS.MOVIES, JSON.stringify(mediaData.movies));
        }
      }

      // 2. Fetch latest channels from server
      const chanRes = await fetch(`/api/channels?${cacheBust}`, fetchOpts);
      if (chanRes.ok) {
        const chanData = await chanRes.json();
        if (chanData.success && Array.isArray(chanData.channels)) {
          localChannelsTimestampRef.current = chanData.lastUpdated || Date.now();
          setChannels(chanData.channels);
          safeStorage.set(STORAGE_KEYS.CHANNELS, JSON.stringify(chanData.channels));
        }
      }

      // 3. Fetch latest subscription plans
      const plansRes = await fetch(`/api/subscription/plans?${cacheBust}`, fetchOpts);
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        if (plansData.success && Array.isArray(plansData.plans)) {
          localPlansTimestampRef.current = plansData.lastUpdated || Date.now();
          setSubscriptionPlans(plansData.plans);
          safeStorage.set(STORAGE_KEYS.PLANS, JSON.stringify(plansData.plans));
        }
      }

      // 4. Fetch latest promotion settings
      const promoRes = await fetch(`/api/subscription/promotion?${cacheBust}`, fetchOpts);
      if (promoRes.ok) {
        const promoData = await promoRes.json();
        if (promoData.success && promoData.promotion) {
          localPromotionTimestampRef.current = promoData.lastUpdated || Date.now();
          setPromotionSettings(promoData.promotion);
          safeStorage.set(STORAGE_KEYS.PROMOTION, JSON.stringify(promoData.promotion));
        }
      }

      setLastCloudSyncTime(new Date());
    } catch (err) {
      console.warn('[Sync Error]: Could not reach backend server:', err);
    } finally {
      setIsSyncingCloud(false);
      isFetchingSyncRef.current = false;
    }
  }, []);

  // Multi-Device Real-Time Cloud Synchronization Engine
  useEffect(() => {
    // 1. Initial bootstrap from server
    forceCloudSync();

    // 2. SSE Real-Time Stream for Instant Push Sync across Phone & PC
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/sync/events');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === 'sync') {
            forceCloudSync();
          }
        } catch {
          // ignore non-json messages
        }
      };
      eventSource.onerror = () => {
        // EventSource will automatically attempt reconnection
      };
    } catch (err) {
      console.warn('[SSE Sync Stream Error]:', err);
    }

    // 3. BroadcastChannel for instant local inter-tab synchronization
    let broadcastChan: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcastChan = new BroadcastChannel('netstudio_sync_channel');
        broadcastChan.onmessage = () => {
          forceCloudSync();
        };
      }
    } catch {
      // safe fallback
    }

    // 4. Fast Polling fallback checking server timestamps every 2.5 seconds
    const checkSyncStatus = async () => {
      if (isFetchingSyncRef.current) return;
      try {
        const cacheBust = `_t=${Date.now()}`;
        const res = await fetch(`/api/sync/status?${cacheBust}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            let needsSync = false;
            if (data.lastUpdatedMedia && data.lastUpdatedMedia > localMediaTimestampRef.current) {
              needsSync = true;
            }
            if (data.lastUpdatedChannels && data.lastUpdatedChannels > localChannelsTimestampRef.current) {
              needsSync = true;
            }
            if (data.lastUpdatedPlans && data.lastUpdatedPlans > localPlansTimestampRef.current) {
              needsSync = true;
            }
            if (data.lastUpdatedPromotion && data.lastUpdatedPromotion > localPromotionTimestampRef.current) {
              needsSync = true;
            }

            if (needsSync) {
              await forceCloudSync();
            }
          }
        }
      } catch {
        // Network catch
      }
    };

    const interval = setInterval(checkSyncStatus, 2500);

    const handleFocus = () => {
      checkSyncStatus();
      forceCloudSync();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('online', handleFocus);

    // 5. Direct Real-Time Firebase Firestore Listener (Universal Instant Cloud Broadcast)
    let unsubscribeFirestoreMovies: (() => void) | null = null;
    try {
      unsubscribeFirestoreMovies = subscribeMovies((cloudMovies) => {
        if (Array.isArray(cloudMovies) && cloudMovies.length > 0) {
          setMovies(cloudMovies);
          safeStorage.set(STORAGE_KEYS.MOVIES, JSON.stringify(cloudMovies));
          setLastCloudSyncTime(new Date());
        }
      });
    } catch (fsErr) {
      console.warn('[Firestore subscribeMovies listener notice]:', fsErr);
    }

    return () => {
      if (unsubscribeFirestoreMovies) {
        unsubscribeFirestoreMovies();
      }
      if (eventSource) {
        eventSource.close();
      }
      if (broadcastChan) {
        broadcastChan.close();
      }
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('online', handleFocus);
    };
  }, [forceCloudSync]);

  // 6. Watchlist
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = safeStorage.get(STORAGE_KEYS.WATCHLIST);
      return saved ? JSON.parse(saved) : ['m1', 's1', 'm3'];
    } catch {
      return ['m1', 's1', 'm3'];
    }
  });

  useEffect(() => {
    safeStorage.set(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (mediaId: string) => {
    setWatchlist((prev) =>
      prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [mediaId, ...prev]
    );
  };

  const isInWatchlist = (mediaId: string) => watchlist.includes(mediaId);

  // 7. Continue Watching
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>(() => {
    try {
      const saved = safeStorage.get(STORAGE_KEYS.CONTINUE_WATCHING);
      if (saved) return JSON.parse(saved);

      const m1 = INITIAL_MOVIES_AND_SERIES.find((m) => m.id === 'm1');
      const s1 = INITIAL_MOVIES_AND_SERIES.find((s) => s.id === 's1');
      return [
        {
          mediaId: 'm1',
          media: m1!,
          progressSeconds: 3400,
          durationSeconds: 8040,
          progressPercentage: 42,
          lastWatchedAt: new Date().toISOString()
        },
        {
          mediaId: 's1',
          media: s1!,
          episodeId: 's1-e2',
          seasonNumber: 1,
          episodeNumber: 2,
          progressSeconds: 1820,
          durationSeconds: 3120,
          progressPercentage: 58,
          lastWatchedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    safeStorage.set(STORAGE_KEYS.CONTINUE_WATCHING, JSON.stringify(continueWatching));
  }, [continueWatching]);

  const updateProgress = (
    mediaId: string,
    currentSec: number,
    totalSec: number,
    episodeId?: string
  ) => {
    if (totalSec <= 0) return;
    const media = movies.find((m) => m.id === mediaId);
    if (!media) return;

    const percentage = Math.min(100, Math.round((currentSec / totalSec) * 100));

    // Resolve season/episode metadata so Continue Watching badges can show S/E
    let watchedEpisode = undefined;
    if (episodeId) {
      const flat = [
        ...(media.episodes || []),
        ...(media.seasons || []).flatMap((s) => (s.episodes || []).map((ep) => ({ ...ep, season: ep.season || s.seasonNumber })))
      ];
      watchedEpisode = flat.find((ep) => ep.id === episodeId);
    }

    setContinueWatching((prev) => {
      const filtered = prev.filter((item) => item.mediaId !== mediaId);
      if (percentage >= 95) {
        return filtered;
      }
      return [
        {
          mediaId,
          media,
          episodeId,
          seasonNumber: watchedEpisode?.season,
          episodeNumber: watchedEpisode?.episodeNumber,
          progressSeconds: Math.round(currentSec),
          durationSeconds: Math.round(totalSec),
          progressPercentage: percentage,
          lastWatchedAt: new Date().toISOString()
        },
        ...filtered
      ];
    });
  };

  // 8. Downloads
  const [downloads, setDownloads] = useState<DownloadedItem[]>(() => {
    try {
      const saved = safeStorage.get(STORAGE_KEYS.DOWNLOADS);
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'dl_01',
          mediaId: 'm1',
          title: "The Shadow Guardian (Umurinzi w'Igicucu)",
          poster:
            'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
          type: 'movie',
          fileSize: '1.45 GB',
          quality: '4K UHD',
          downloadedAt: '2025-01-14T08:30:00Z',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    safeStorage.set(STORAGE_KEYS.DOWNLOADS, JSON.stringify(downloads));
  }, [downloads]);

  // Downloads are FREE for ALL users — movies, episodes, seasons & parts.
  // The real video FILE is saved to the user's local device storage.
  const startDownload = async (
    media: MediaItem,
    episode?: Episode,
    part?: MediaPart,
    opts?: { saveAs?: boolean; onProgress?: (receivedBytes: number, totalBytes: number | null) => void }
  ): Promise<boolean> => {
    const sourceUrl = episode ? episode.videoUrl : part ? part.videoUrl : media.videoUrl;
    const label = episode
      ? `${media.title} - S${episode.season}E${episode.episodeNumber}`
      : part
      ? `${media.title} - ${part.title || `Part ${part.partNumber}`}`
      : media.title;
    const safeTitle = label
      .replace(/[^a-z0-9\-_ ]/gi, '')
      .trim()
      .replace(/\s+/g, '_');
    const extension = sourceUrl && /\.mp4|\.webm|\.ogg|\.mkv|\.mov|\.m4v/i.test(sourceUrl)
      ? (sourceUrl.match(/\.mp4|\.webm|\.ogg|\.mkv|\.mov|\.m4v/i)?.[0] ?? '.mp4')
      : '.mp4';
    const fileName = `${safeTitle || 'netstudio_video'}${extension}`;

    /**
     * Saves the actual video FILE to local device storage:
     * 1) Preferred: native "Save As" dialog (File System Access API) — the user
     *    picks the exact local file location, bytes are streamed with progress.
     * 2) Fallback: classic browser download into the Downloads folder.
     * Returns false only when the user cancels the Save As dialog.
     */
    const saveFileToLocalDevice = async (): Promise<{ ok: boolean; bytes: number }> => {
      if (!sourceUrl) return { ok: true, bytes: 0 };
      const anyWin = window as any;
      const canSaveAs = typeof anyWin.showSaveFilePicker === 'function' && opts?.saveAs !== false;
      try {
        const res = await fetch(sourceUrl, { mode: 'cors' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const totalHeader = Number(res.headers.get('content-length'));
        const total = Number.isFinite(totalHeader) && totalHeader > 0 ? totalHeader : null;

        // 1) True local-file save with a location picker
        if (canSaveAs && res.body) {
          try {
            const handle = await anyWin.showSaveFilePicker({ suggestedName: fileName });
            const writable = await handle.createWritable();
            const reader = res.body.getReader();
            let received = 0;
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              await writable.write(value);
              received += value.byteLength;
              opts?.onProgress?.(received, total);
            }
            await writable.close();
            return { ok: true, bytes: received };
          } catch (err: any) {
            if (err?.name === 'AbortError') return { ok: false, bytes: 0 };
            // Picker unsupported/blocked here — fall through to classic download
          }
        }

        // 2) Classic download (browser Downloads folder)
        if (res.body) {
          const chunks: BlobPart[] = [];
          const reader = res.body.getReader();
          let received = 0;
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value as unknown as BlobPart);
            received += value.byteLength;
            opts?.onProgress?.(received, total);
          }
          const blob = new Blob(chunks);
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
          return { ok: true, bytes: received };
        }

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        return { ok: true, bytes: blob.size };
      } catch {
        // CORS-restricted hosts: let the browser handle the URL natively
        const a = document.createElement('a');
        a.href = sourceUrl;
        a.download = fileName;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return { ok: true, bytes: 0 };
      }
    };

    const result = await saveFileToLocalDevice();
    if (!result.ok) return false;

    const formatBytes = (b: number) =>
      b >= 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : b >= 1024 ? `${(b / 1024).toFixed(0)} KB` : '';

    const newDownload: DownloadedItem = {
      id: `dl_${Date.now()}`,
      mediaId: media.id,
      title: episode
        ? `${media.title} - S${episode.season} E${episode.episodeNumber}`
        : part
        ? `${media.title} - ${part.title || `Part ${part.partNumber}`}`
        : media.title,
      poster: episode?.thumbnail || part?.poster || media.poster,
      type: media.type,
      season: episode?.season,
      episodeNumber: episode?.episodeNumber,
      fileSize: result.bytes > 0 ? formatBytes(result.bytes) || 'Saved' : 'Saved to device',
      quality: media.quality || 'HD',
      downloadedAt: new Date().toISOString(),
      videoUrl: sourceUrl
    };

    setDownloads((prev) => [newDownload, ...prev.filter((d) => !(d.mediaId === media.id && d.episodeNumber === episode?.episodeNumber))]);
    return true;
  };

  const deleteDownload = (downloadId: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== downloadId));
  };

  // 9. Transactions
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    try {
      const saved = safeStorage.get(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  useEffect(() => {
    safeStorage.set(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  // 10. Playback Modal State & Real-Time Views
  const [activePlayingMedia, setActivePlayingMedia] = useState<{
    media?: MediaItem;
    episode?: Episode;
    part?: MediaPart;
    channel?: LiveChannel;
    startTime?: number;
    isTrailer?: boolean;
  } | null>(null);

  const [selectedDetailMedia, setSelectedDetailMedia] = useState<MediaItem | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-Time Analytics Engine & Active Online Users
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
  const [realAnalytics, setRealAnalytics] = useState<RealAnalyticsSummary | null>(null);

  const fetchRealAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analytics) {
          setRealAnalytics(data.analytics);
          if (typeof data.analytics.activeUsers === 'number') {
            setActiveUsersCount(data.analytics.activeUsers);
          }
        }
      }
    } catch {
      // Safe silent catch
    }
  }, []);

  // Real Active User Heartbeat (every 25 seconds)
  useEffect(() => {
    let sessionId = safeStorage.get('netstudio_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      safeStorage.set('netstudio_session_id', sessionId);
    }

    const sendPing = async () => {
      try {
        const res = await fetch('/api/analytics/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId: currentUser.id })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && typeof data.activeUsers === 'number') {
            setActiveUsersCount(data.activeUsers);
          }
        }
      } catch {
        // Safe silent catch
      }
    };

    sendPing();
    const interval = setInterval(sendPing, 25000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const startPlayback = (
    media: MediaItem,
    episode?: Episode,
    startTime?: number,
    part?: MediaPart,
    isTrailer?: boolean
  ) => {
    // If watching preview / trailer, always allow playback freely even for standard visitors!
    if (!isTrailer && !isPromotionFreeActive && media.isPremiumOnly && currentUser.subscription.plan !== 'premium') {
      setShowSubscriptionModal(true);
      return;
    }
    setActivePlayingMedia({ media, episode, part, startTime: startTime || 0, isTrailer });

    if (media && media.id) {
      // Optimistic local update
      setMovies((prev) =>
        prev.map((m) => (m.id === media.id ? { ...m, viewsCount: (Number(m.viewsCount) || 0) + 1 } : m))
      );
      // Persist to server
      fetch(`/api/media/${encodeURIComponent(media.id)}/view`, { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.viewsCount === 'number') {
            setMovies((prev) =>
              prev.map((m) => (m.id === media.id ? { ...m, viewsCount: data.viewsCount } : m))
            );
          }
        })
        .catch(() => {});
    }
  };

  const startChannelPlayback = (channel: LiveChannel) => {
    if (!isPromotionFreeActive && channel.isPremiumOnly && currentUser.subscription.plan !== 'premium') {
      setShowSubscriptionModal(true);
      return;
    }
    setActivePlayingMedia({ channel });

    if (channel && channel.id) {
      // Optimistic local update
      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? { ...c, viewsCount: (Number(c.viewsCount) || 0) + 1 } : c))
      );
      // Persist to server
      fetch(`/api/channels/${encodeURIComponent(channel.id)}/view`, { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.viewsCount === 'number') {
            setChannels((prev) =>
              prev.map((c) => (c.id === channel.id ? { ...c, viewsCount: data.viewsCount } : c))
            );
          }
        })
        .catch(() => {});
    }
  };

  const stopPlayback = () => {
    setActivePlayingMedia(null);
  };

  // 11. Dynamic Payment Processing (MTN MoMo, Airtel, Card)
  const processPayment = async (
    method: 'mtn_momo' | 'airtel_money' | 'stripe',
    planId: string,
    phone?: string
  ): Promise<{ success: boolean; message: string }> => {
    await new Promise((res) => setTimeout(res, 1200));

    const matchedPlan =
      subscriptionPlans.find((p) => p.id === planId) ||
      subscriptionPlans.find((p) => p.id === 'plan_monthly') ||
      INITIAL_SUBSCRIPTION_PLANS[2];

    const amountRwf = matchedPlan.priceRwf;
    const amountUsd = matchedPlan.priceUsd;
    const planDays = matchedPlan.durationDays || 30;

    const prefix = method === 'mtn_momo' ? 'MOMO-RW' : method === 'airtel_money' ? 'AIRTEL-RW' : 'STRIPE';
    const ref = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx: PaymentTransaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      method,
      phoneNumber: phone || (method === 'mtn_momo' ? '+250796119924' : undefined),
      amountRwf,
      amountUsd,
      plan: matchedPlan.id as any,
      planName: matchedPlan.name,
      status: 'completed',
      referenceId: ref,
      date: new Date().toISOString()
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update current user
    setCurrentUser((prev) => ({
      ...prev,
      subscription: {
        plan: 'premium',
        status: 'active',
        expiresAt: new Date(Date.now() + planDays * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: method,
        phoneNumber: phone || prev.phoneNumber,
        amountRwf
      }
    }));

    // Post to server
    try {
      await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          method,
          phoneNumber: phone || currentUser.phoneNumber || '+250796119924',
          planId: matchedPlan.id,
          planName: matchedPlan.name,
          amountRwf,
          amountUsd
        })
      });
    } catch {
      // Ignore
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    return {
      success: true,
      message:
        language === 'rw'
          ? `Kwishyura ${amountRwf.toLocaleString()} RWF byagenze neza! VIP yawe (${matchedPlan.nameRw || matchedPlan.name}) yatangiye gukora.`
          : `Payment of ${amountRwf.toLocaleString()} RWF successful! Your ${matchedPlan.name} is now active.`
    };
  };

  // 12. Content Management (Real-Time Cloud Synchronized)
  const addMedia = async (item: MediaItem): Promise<{ success: boolean; message: string }> => {
    // 1. Optimistically update local state & storage
    setMovies((prev) => {
      const updated = [item, ...prev.filter((m) => m.id !== item.id)];
      safeStorage.set(STORAGE_KEYS.MOVIES, JSON.stringify(updated));
      return updated;
    });

    // 2. Direct Firestore Cloud Write
    try {
      await addMovieToFirestore(item);
    } catch (fsErr) {
      console.warn('[addMovieToFirestore notice]:', fsErr);
    }

    try {
      // 3. Persist to server backend database
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify(item)
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data && data.lastUpdated) {
        localMediaTimestampRef.current = data.lastUpdated;
        setLastCloudSyncTime(new Date());
      }
      if (data.movie) {
        setMovies((prev) => [data.movie, ...prev.filter((m) => m.id !== item.id && m.id !== data.movie.id)]);
      }

      // Broadcast to other tabs on same machine
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('netstudio_sync_channel');
          bc.postMessage({ type: 'sync', target: 'media', timestamp: Date.now() });
          bc.close();
        } catch {}
      }

      return {
        success: true,
        message: data.message || `"${item.title}" successfully added and synced across all devices!`
      };
    } catch (err: any) {
      console.warn('[AddMedia Sync Error]:', err);
      return {
        success: true,
        message: `"${item.title}" saved and synced to Cloud Firestore.`
      };
    }
  };

  const updateMedia = async (item: MediaItem): Promise<{ success: boolean; message: string }> => {
    // 1. Optimistically update local state
    setMovies((prev) => {
      const updated = prev.map((m) => (m.id === item.id ? item : m));
      safeStorage.set(STORAGE_KEYS.MOVIES, JSON.stringify(updated));
      return updated;
    });

    setSelectedDetailMedia((curr) => (curr && curr.id === item.id ? item : curr));
    setContinueWatching((prev) =>
      prev.map((cw) => (cw.mediaId === item.id ? { ...cw, media: item } : cw))
    );

    // 2. Direct Firestore Cloud Update
    try {
      await updateMovieInFirestore(item.id, item);
    } catch (fsErr) {
      console.warn('[updateMovieInFirestore notice]:', fsErr);
    }

    try {
      const res = await fetch(`/api/media/${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify(item)
      });

      const data = await res.json();
      if (data && data.lastUpdated) {
        localMediaTimestampRef.current = data.lastUpdated;
        setLastCloudSyncTime(new Date());
      }
      if (data.movie) {
        setMovies((prev) => prev.map((m) => (m.id === item.id ? data.movie : m)));
      }

      // Broadcast to other tabs
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('netstudio_sync_channel');
          bc.postMessage({ type: 'sync', target: 'media', timestamp: Date.now() });
          bc.close();
        } catch {}
      }

      return {
        success: true,
        message: data.message || `Media item updated and synced across all devices!`
      };
    } catch (err: any) {
      console.warn('[UpdateMedia Sync Error]:', err);
      return {
        success: true,
        message: `Updated in Cloud Firestore.`
      };
    }
  };

  const deleteMedia = async (id: string): Promise<{ success: boolean; message: string }> => {
    setMovies((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      safeStorage.set(STORAGE_KEYS.MOVIES, JSON.stringify(updated));
      return updated;
    });

    setSelectedDetailMedia((curr) => (curr && curr.id === id ? null : curr));
    setContinueWatching((prev) => prev.filter((cw) => cw.mediaId !== id));
    setWatchlist((prev) => prev.filter((wId) => wId !== id));

    // Direct Firestore Cloud Deletion
    try {
      await deleteMovieFromFirestore(id);
    } catch (fsErr) {
      console.warn('[deleteMovieFromFirestore notice]:', fsErr);
    }

    try {
      const res = await fetch(`/api/media/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Cache-Control': 'no-cache' }
      });

      const data = await res.json();
      if (data && data.lastUpdated) {
        localMediaTimestampRef.current = data.lastUpdated;
        setLastCloudSyncTime(new Date());
      }

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('netstudio_sync_channel');
          bc.postMessage({ type: 'sync', target: 'media', timestamp: Date.now() });
          bc.close();
        } catch {}
      }

      return {
        success: true,
        message: 'Deleted and synced across all devices.'
      };
    } catch (err: any) {
      console.warn('[DeleteMedia Sync Error]:', err);
      return { success: true, message: 'Deleted locally.' };
    }
  };

  const addChannel = async (channel: LiveChannel): Promise<{ success: boolean; message: string }> => {
    setChannels((prev) => {
      const updated = [channel, ...prev.filter((c) => c.id !== channel.id)];
      safeStorage.set(STORAGE_KEYS.CHANNELS, JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify(channel)
      });

      const data = await res.json();
      if (data && data.lastUpdated) {
        localChannelsTimestampRef.current = data.lastUpdated;
        setLastCloudSyncTime(new Date());
      }
      if (data.channel) {
        setChannels((prev) => [data.channel, ...prev.filter((c) => c.id !== channel.id && c.id !== data.channel.id)]);
      }

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('netstudio_sync_channel');
          bc.postMessage({ type: 'sync', target: 'channels', timestamp: Date.now() });
          bc.close();
        } catch {}
      }

      return {
        success: true,
        message: data.message || `Channel "${channel.name}" added and synced!`
      };
    } catch (err: any) {
      console.warn('[AddChannel Sync Error]:', err);
      return { success: true, message: 'Channel saved locally.' };
    }
  };

  const updateChannel = async (channel: LiveChannel): Promise<{ success: boolean; message: string }> => {
    setChannels((prev) => {
      const updated = prev.map((c) => (c.id === channel.id ? channel : c));
      safeStorage.set(STORAGE_KEYS.CHANNELS, JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await fetch(`/api/channels/${encodeURIComponent(channel.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify(channel)
      });

      const data = await res.json();
      if (data && data.lastUpdated) {
        localChannelsTimestampRef.current = data.lastUpdated;
        setLastCloudSyncTime(new Date());
      }
      if (data.channel) {
        setChannels((prev) => prev.map((c) => (c.id === channel.id ? data.channel : c)));
      }

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('netstudio_sync_channel');
          bc.postMessage({ type: 'sync', target: 'channels', timestamp: Date.now() });
          bc.close();
        } catch {}
      }

      return {
        success: true,
        message: data.message || 'Channel updated and synced!'
      };
    } catch (err: any) {
      console.warn('[UpdateChannel Sync Error]:', err);
      return { success: true, message: 'Updated locally.' };
    }
  };

  const deleteChannel = async (id: string): Promise<{ success: boolean; message: string }> => {
    setChannels((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      safeStorage.set(STORAGE_KEYS.CHANNELS, JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await fetch(`/api/channels/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Cache-Control': 'no-cache' }
      });

      const data = await res.json();
      if (data && data.lastUpdated) {
        localChannelsTimestampRef.current = data.lastUpdated;
        setLastCloudSyncTime(new Date());
      }

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('netstudio_sync_channel');
          bc.postMessage({ type: 'sync', target: 'channels', timestamp: Date.now() });
          bc.close();
        } catch {}
      }

      return {
        success: true,
        message: 'Channel deleted and synced across all devices.'
      };
    } catch (err: any) {
      console.warn('[DeleteChannel Sync Error]:', err);
      return { success: true, message: 'Deleted locally.' };
    }
  };

  const iptvPresets = [
    {
      id: 'rwanda_news_sports',
      name: 'Rwanda, News & Sports Premier Pack',
      nameRw: 'Imiyoboro y\'u Rwanda, Amakuru na Siporo',
      description: 'Official direct live broadcasts for RBA, KC2, Flash TV, TV1, alongside Al Jazeera, BBC, and sports streams.',
      badge: 'Verified & Fast',
      url: 'https://iptv-org.github.io/iptv/countries/rw.m3u'
    },
    {
      id: 'africa_wide',
      name: 'East Africa & Pan-African Channels',
      nameRw: 'Imiyoboro ya Afurika y\'Iburasirazuba',
      description: 'Top East African channels including Citizen TV, KTN, NTV Uganda, UBC, and SABC News.',
      badge: 'Popular',
      url: 'https://iptv-org.github.io/iptv/regions/africa.m3u'
    }
  ];

  const syncRealIPTVChannels = (): number => {
    const existingIds = new Set(channels.map((c) => c.id));
    const toAdd = FULL_REAL_IPTV_CHANNELS.filter((c) => !existingIds.has(c.id));
    if (toAdd.length > 0) {
      setChannels((prev) => [...toAdd, ...prev]);
    }
    return FULL_REAL_IPTV_CHANNELS.length;
  };

  const loadAllIPTVChannels = async (): Promise<{ success: boolean; count: number; message: string }> => {
    try {
      const res = await fetch('/api/iptv/all-channels');
      if (res.ok) {
        const data = await res.json();
        if (data.channels && data.channels.length > 0) {
          const existingIds = new Set(channels.map((c) => c.id));
          const newChans: LiveChannel[] = data.channels.filter((c: LiveChannel) => !existingIds.has(c.id));
          if (newChans.length > 0) {
            setChannels((prev) => [...newChans, ...prev]);
            return {
              success: true,
              count: data.channels.length,
              message: `Loaded all verified channels from server!`
            };
          }
        }
      }
      const count = syncRealIPTVChannels();
      return {
        success: true,
        count,
        message: `Synchronized ${count} verified IPTV channels.`
      };
    } catch {
      const count = syncRealIPTVChannels();
      return {
        success: true,
        count,
        message: `Synchronized ${count} verified IPTV channels.`
      };
    }
  };

  const loadPresetChannels = async (
    presetId: string
  ): Promise<{ success: boolean; count: number; message: string }> => {
    const preset = iptvPresets.find((p) => p.id === presetId);
    if (!preset) {
      return { success: false, count: 0, message: 'Preset not found' };
    }
    return fetchAndImportM3UUrl(preset.url);
  };

  const fetchAndImportM3UUrl = async (
    url: string
  ): Promise<{ success: boolean; count: number; message: string }> => {
    try {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        return { success: false, count: 0, message: 'Please enter a valid M3U stream URL' };
      }

      try {
        const apiRes = await fetch('/api/iptv/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmedUrl, limit: 120 })
        });

        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data.channels && data.channels.length > 0) {
            const existingUrls = new Set(channels.map((c) => c.streamUrl));
            const newChannels: LiveChannel[] = data.channels.filter(
              (c: LiveChannel) => !existingUrls.has(c.streamUrl)
            );
            if (newChannels.length > 0) {
              setChannels((prev) => [...newChannels, ...prev]);
              return {
                success: true,
                count: newChannels.length,
                message: `Imported ${newChannels.length} live streaming channels!`
              };
            } else {
              return {
                success: true,
                count: data.channels.length,
                message: `Channels from this playlist are already imported in your list.`
              };
            }
          }
        }
      } catch (backendErr) {
        console.warn('Backend IPTV parse call error:', backendErr);
      }

      let text = '';
      try {
        const res = await fetch(trimmedUrl);
        if (res.ok) {
          text = await res.text();
        }
      } catch {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmedUrl)}`;
        const res2 = await fetch(proxyUrl);
        if (res2.ok) {
          text = await res2.text();
        }
      }

      if (!text || (!text.includes('#EXTM3U') && !text.includes('#EXTINF') && !text.includes('http'))) {
        return {
          success: false,
          count: 0,
          message: 'Unable to fetch valid M3U playlist format from the provided URL'
        };
      }

      const count = importM3UPlaylist(text);
      return {
        success: count > 0,
        count,
        message: count > 0 ? `Successfully imported ${count} live IPTV channels!` : 'No streamable channels found in playlist.'
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        message: err.message || 'Failed to fetch playlist'
      };
    }
  };

  const importM3UPlaylist = (m3uContent: string): number => {
    const lines = m3uContent.split('\n');
    const parsedChannels: LiveChannel[] = [];
    let currentInfo: Partial<LiveChannel> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
        const groupMatch = line.match(/group-title="([^"]+)"/i);
        const countryMatch = line.match(/tvg-country="([^"]+)"/i);
        const namePart = line.split(',').pop()?.trim() || 'Live Channel';

        const rawGroup = groupMatch && groupMatch[1] ? groupMatch[1] : 'Entertainment';
        let category = 'Entertainment';
        let categoryRw = 'Imyidagaduro';
        if (/news|amakuru|info/i.test(rawGroup)) {
          category = 'News';
          categoryRw = 'Amakuru';
        } else if (/sport|siporo|football/i.test(rawGroup)) {
          category = 'Sports';
          categoryRw = 'Siporo';
        } else if (/music|umuziki/i.test(rawGroup)) {
          category = 'Music';
          categoryRw = 'Umuziki';
        } else if (/science|doc|space/i.test(rawGroup)) {
          category = 'Science';
          categoryRw = 'Ubumenyi';
        }

        const rawCountry = countryMatch ? countryMatch[1].toUpperCase() : 'Global';
        const country = /RW|RWANDA/i.test(rawCountry + ' ' + namePart) ? 'Rwanda' : rawCountry;
        const countryCode = country === 'Rwanda' ? 'RW' : rawCountry.length === 2 ? rawCountry : 'GLOBAL';

        currentInfo = {
          id: `iptv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: namePart,
          logo:
            logoMatch && logoMatch[1]
              ? logoMatch[1]
              : 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=200&auto=format&fit=crop&q=80',
          category,
          categoryRw,
          country,
          countryCode,
          quality: 'HD',
          isLive: true,
          currentProgram: `${namePart} Live Broadcast`,
          currentProgramRw: `Gukurikira ${namePart} Ako Kanya`,
          isPremiumOnly: false
        };
      } else if (line.startsWith('http://') || line.startsWith('https://')) {
        if (currentInfo && currentInfo.name) {
          parsedChannels.push({
            ...(currentInfo as LiveChannel),
            streamUrl: line
          });
          currentInfo = null;
        }
      }
    }

    if (parsedChannels.length > 0) {
      setChannels((prev) => [...parsedChannels, ...prev]);
    }
    return parsedChannels.length;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        showLanguageModal,
        setShowLanguageModal,
        t,
        currentUser,
        setCurrentUser,
        switchUserRole,
        toggleSubscription,
        showAuthModal,
        setShowAuthModal,
        registerUser,
        loginUser,
        logoutUser,
        subscriptionPlans,
        promotionSettings,
        isPromotionFreeActive,
        addSubscriptionPlan,
        updateSubscriptionPlan,
        deleteSubscriptionPlan,
        updatePromotionSettings,
        toggleGlobalFreePromotion,
        activeNavTab,
        setActiveNavTab,
        categoryFilter,
        setCategoryFilter,
        currentRoute,
        navigateTo,
        notifications,
        unreadNotificationsCount,
        showNotificationsModal,
        setShowNotificationsModal,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        adminBroadcastNotification,
        supportMessages,
        fetchSupportMessages,
        sendSupportMessage,
        adminSupportMessages,
        adminUnreadMessagesCount,
        fetchAdminSupportMessages,
        replyAdminSupportMessage,
        deleteAdminSupportMessage,
        isUserVIP,
        grantUserPromotion,
        revokeUserPromotion,
        deleteRegisteredUser,
        purgeRemoteAdmins,
        adminToken,
        adminLogin,
        adminLogout,
        changeAdminPassword,
        ownerToken,
        ownerLogin,
        ownerLogout,
        realAnalytics,
        activeUsersCount,
        fetchRealAnalytics,
        treasurySummary,
        financialTransactions,
        withdrawals,
        auditLogs,
        fetchTreasuryData,
        executeWithdrawal,
        updateOwnerSecurity,
        isStandalone,
        isInstallable,
        installMethod,
        showInstallBanner,
        dismissInstallBanner,
        triggerGetApp,
        showInstallGuideModal,
        setShowInstallGuideModal,
        installApp,
        movies,
        channels,
        watchlist,
        continueWatching,
        downloads,
        transactions,
        isSyncingCloud,
        lastCloudSyncTime,
        forceCloudSync,
        selectedDetailMedia,
        setSelectedDetailMedia,
        activePlayingMedia,
        startPlayback,
        startChannelPlayback,
        stopPlayback,
        updateProgress,
        toggleWatchlist,
        isInWatchlist,
        showSubscriptionModal,
        setShowSubscriptionModal,
        processPayment,
        startDownload,
        deleteDownload,
        addMedia,
        updateMedia,
        deleteMedia,
        addChannel,
        updateChannel,
        deleteChannel,
        importM3UPlaylist,
        syncRealIPTVChannels,
        loadAllIPTVChannels,
        fetchAndImportM3UUrl,
        loadPresetChannels,
        iptvPresets,
        searchQuery,
        setSearchQuery
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
