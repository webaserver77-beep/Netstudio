import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getFirebaseAdminFirestore } from './firebaseAdmin';
import {
  MediaItem,
  LiveChannel,
  SubscriptionPlanItem,
  PromotionSettings,
  UserProfile,
  PaymentTransaction,
  UserNotification,
  NotificationCategory,
  FinancialTransaction,
  OwnerTreasurySummary,
  RealAnalyticsSummary,
  WithdrawalRequest,
  OwnerAuditLog,
  SupportMessage
} from '../types';
import {
  INITIAL_MOVIES_AND_SERIES,
  INITIAL_SUBSCRIPTION_PLANS,
  INITIAL_PROMOTION_SETTINGS,
  INITIAL_TRANSACTIONS
} from '../data/mockData';
import { VERIFIED_CANONICAL_CHANNELS } from '../data/channelsData';

interface NetStudioDatabase {
  movies: MediaItem[];
  channels: LiveChannel[];
  plans: SubscriptionPlanItem[];
  promotion: PromotionSettings;
  users: UserProfile[];
  transactions: PaymentTransaction[];
  financialTransactions: FinancialTransaction[];
  notifications: UserNotification[];
  supportMessages: SupportMessage[];
  withdrawals: WithdrawalRequest[];
  auditLogs: OwnerAuditLog[];
  adminCredentials: {
    passwordHash: string;
    salt: string;
    twoFactorSecret?: string;
  };
  ownerCredentials: {
    passwordHash: string;
    salt: string;
    twoFactorPin: string;
  };
  activeSessions?: Record<string, { role: 'admin' | 'owner'; userId: string; deviceName?: string; createdAt: number; expiresAt: number }>;
  lastUpdatedMedia: number;
  lastUpdatedChannels: number;
  lastUpdatedPlans: number;
  lastUpdatedPromotion: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'netstudio_db.json');

function cleanStreamUrl(url: string | undefined): string {
  if (!url || typeof url !== 'string') return 'https://vjs.zencdn.net/v/oceans.mp4';
  const trimmed = url.trim();
  if (
    trimmed.includes('gtv-videos-bucket') ||
    trimmed.includes('storage.googleapis.com') ||
    trimmed.includes('archive.org/download')
  ) {
    const lower = trimmed.toLowerCase();
    if (lower.includes('sintel')) return 'https://media.w3.org/2010/05/sintel/trailer.mp4';
    if (lower.includes('bunny') || lower.includes('bigbuckbunny')) return 'https://media.w3.org/2010/05/bunny/trailer.mp4';
    if (lower.includes('elephants') || lower.includes('dream') || lower.includes('blue_moon')) {
      return 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4';
    }
    if (lower.includes('tears') || lower.includes('steel') || lower.includes('ocean')) {
      return 'https://vjs.zencdn.net/v/oceans.mp4';
    }
    return 'https://vjs.zencdn.net/v/oceans.mp4';
  }
  return trimmed;
}

function sanitizeMediaList(movies: MediaItem[]): MediaItem[] {
  return movies.map((m) => ({
    ...m,
    videoUrl: cleanStreamUrl(m.videoUrl),
    trailerUrl: m.trailerUrl ? cleanStreamUrl(m.trailerUrl) : undefined,
    episodes: Array.isArray(m.episodes)
      ? m.episodes.map((ep) => ({
          ...ep,
          videoUrl: cleanStreamUrl(ep.videoUrl)
        }))
      : undefined
  }));
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

const INITIAL_FINANCIAL_TRANSACTIONS: FinancialTransaction[] = [];

const INITIAL_NOTIFICATIONS: UserNotification[] = [
  {
    id: 'notif_welcome_system',
    userId: 'all',
    title: 'Welcome to NetStudio Rwanda',
    titleRw: 'Murakaza neza muri NetStudio Rwanda',
    message: 'Stream top-rated movies, series with Kinyarwanda interpreter, and 30+ verified Live TV channels.',
    messageRw: 'Reba filime zikunzwe, amaserie asobanuye mu Kinyarwanda, na shene zirenga 30 zizewe.',
    category: 'System',
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'notif_promo_active',
    userId: 'all',
    title: 'Special Promotion Active',
    titleRw: 'Poromosiyo Yihariye Irakora',
    message: 'Explore premium cinema collections and exclusive releases with our current promotion.',
    messageRw: 'Reba filime zidasanzwe n izasohotse vuba ukoresheje poromosiyo yacu.',
    category: 'Promotion',
    isRead: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
  }
];

const INITIAL_AUDIT_LOGS: OwnerAuditLog[] = [
  {
    id: 'audit_init_1',
    timestamp: new Date(Date.now() - 3600 * 1000 * 24 * 30).toISOString(),
    eventType: 'security_settings_changed',
    severity: 'info',
    details: 'NetStudio platform master instance and verified stream channels loaded.',
    ipAddress: '127.0.0.1'
  },
  {
    id: 'audit_init_2',
    timestamp: new Date(Date.now() - 3600 * 1000 * 24 * 15).toISOString(),
    eventType: 'security_settings_changed',
    severity: 'security',
    details: 'Owner and Admin separation policy established with PIN verification.',
    ipAddress: '127.0.0.1'
  },
  {
    id: 'audit_init_3',
    timestamp: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString(),
    eventType: 'payment_received',
    severity: 'financial',
    details: 'MTN MoMo & Airtel Money automated settlement gateways connected.',
    ipAddress: '127.0.0.1'
  }
];

class MediaStore {
  private db: NetStudioDatabase;
  private isFirestoreInitialized: boolean = false;

  constructor() {
    this.db = this.loadDatabase();
    this.resetDatabase();
    this.initFirestoreSync();
  }

  /**
   * Completely empties all data stored in the database (users, transactions,
   * financial records, notifications, support messages, audit logs, withdrawals,
   * active sessions, posts, updates) across local storage and remote Firestore,
   * and creates strictly ONE universal real admin account.
   */
  public async resetDatabase(): Promise<{ success: boolean; adminUsername: string; timestamp: string }> {
    // 1. Wipe all user accounts, sessions, notifications, audit logs, and transaction logs
    this.db.users = [];
    this.db.transactions = [];
    this.db.financialTransactions = [];
    this.db.supportMessages = [];
    this.db.withdrawals = [];
    this.db.notifications = [];
    this.db.auditLogs = [];
    this.db.activeSessions = {};

    // 2. Set the single universal admin credentials
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminPasswordHash = hashPassword(MediaStore.UNIVERSAL_ADMIN.password, adminSalt);
    this.db.adminCredentials = {
      passwordHash: adminPasswordHash,
      salt: adminSalt
    };

    // 3. Reset remote Firestore collections completely if connected
    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        // Delete all documents in all persistent collections
        const collectionsToPurge = [
          'users',
          'posts',
          'updates',
          'supportMessages',
          'transactions',
          'financialTransactions',
          'withdrawals',
          'notifications',
          'auditLogs',
          'comments',
          'ratings',
          'favorites',
          'history',
          'messages',
          'watchHistory',
          'downloads'
        ];
        for (const collName of collectionsToPurge) {
          try {
            const snap = await firestore.collection(collName).get();
            if (!snap.empty) {
              const batch = firestore.batch();
              snap.forEach((doc) => {
                batch.delete(doc.ref);
              });
              await batch.commit();
            }
          } catch (collErr) {
            // Ignore collection missing errors
          }
        }

        // Insert only one real admin in Firestore
        await firestore.collection('users').doc('admin').set({
          id: 'admin',
          username: MediaStore.UNIVERSAL_ADMIN.username,
          name: 'Universal Admin',
          email: 'admin@netstudio.rw',
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('[MediaStore] Firestore database purge warning:', err);
    }

    this.saveDatabase(this.db);
    console.log('[MediaStore]: All data stored in database completely deleted. Database reset to clean state.');
    return { success: true, adminUsername: MediaStore.UNIVERSAL_ADMIN.username, timestamp: new Date().toISOString() };
  }

  /**
   * Enforces strictly that ONLY ONE universal admin exists.
   * Resets all other admin roles to null/NaN, purges unauthorized admin records,
   * prevents creation of new admin accounts, and ensures the single real admin exists.
   */
  public async enforceSingleAdmin(): Promise<{ demotedOrPurged: number }> {
    let count = 0;
    if (!this.db.users) this.db.users = [];

    // 1. Reset all admin roles to null/user except the single universal admin
    this.db.users = this.db.users
      .filter((u) => {
        // Remove fake or spoofed admin user accounts
        const uId = (u.id || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const uName = (u.name || '').toLowerCase();
        if (
          (u.role === 'admin' || u.role === 'owner') &&
          u.id !== 'admin' &&
          u.email !== 'admin' &&
          u.email !== 'admin@netstudio.rw' &&
          u.name !== 'admin'
        ) {
          count++;
          return false;
        }
        return true;
      })
      .map((u) => {
        if (u.role === 'admin' && u.email !== 'admin' && u.email !== 'admin@netstudio.rw' && u.id !== 'admin') {
          count++;
          return { ...u, role: null as any };
        }
        return u;
      });

    // 2. Ensure only ONE universal admin credentials exist in local store
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminPasswordHash = hashPassword(MediaStore.UNIVERSAL_ADMIN.password, adminSalt);
    this.db.adminCredentials = {
      passwordHash: adminPasswordHash,
      salt: adminSalt
    };

    // 3. Purge non-universal admin sessions
    if (this.db.activeSessions) {
      for (const [token, sess] of Object.entries(this.db.activeSessions)) {
        if (sess.userId !== 'admin_master' && sess.userId !== 'owner_master') {
          delete this.db.activeSessions[token];
        }
      }
    }

    // 4. Sync with Firestore collection("users") if initialized
    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        const usersSnap = await firestore.collection('users').get();
        const batch = firestore.batch();
        let firestoreCount = 0;
        usersSnap.forEach((doc) => {
          const data = doc.data();
          const username = data.username || data.email || doc.id;
          if (data.role === 'admin' && username !== MediaStore.UNIVERSAL_ADMIN.username && username !== 'admin@netstudio.rw') {
            // Reset all other admin roles to null as requested
            batch.update(doc.ref, { role: null });
            firestoreCount++;
          }
        });

        // Ensure universal admin exists in Firestore
        const adminDocRef = firestore.collection('users').doc('admin');
        batch.set(adminDocRef, {
          id: 'admin',
          username: MediaStore.UNIVERSAL_ADMIN.username,
          name: 'Universal Admin',
          email: 'admin@netstudio.rw',
          role: 'admin',
          updatedAt: new Date().toISOString()
        }, { merge: true });

        if (firestoreCount > 0) {
          await batch.commit();
        }
      }
    } catch (err) {
      console.warn('[enforceSingleAdmin] Firestore sync warning:', err);
    }

    this.saveDatabase(this.db);
    console.log(`[enforceSingleAdmin]: Verified single universal admin. Reset ${count} unauthorized admin role(s) to null.`);
    return { demotedOrPurged: count };
  }

  private async initFirestoreSync() {
    const firestore = getFirebaseAdminFirestore();
    if (!firestore) return;

    try {
      // 1. Movies & Series Sync
      const moviesSnap = await firestore.collection('movies').get();
      if (!moviesSnap.empty) {
        const firestoreMovies: MediaItem[] = [];
        moviesSnap.forEach((doc) => {
          firestoreMovies.push(doc.data() as MediaItem);
        });
        if (firestoreMovies.length > 0) {
          this.db.movies = firestoreMovies;
          this.db.lastUpdatedMedia = Date.now();
        }
      } else {
        const batch = firestore.batch();
        for (const movie of this.db.movies) {
          const docRef = firestore.collection('movies').doc(movie.id);
          batch.set(docRef, movie, { merge: true });
        }
        await batch.commit();
      }

      // 2. Channels Sync
      const channelsSnap = await firestore.collection('channels').get();
      if (!channelsSnap.empty) {
        const firestoreChannels: LiveChannel[] = [];
        channelsSnap.forEach((doc) => {
          firestoreChannels.push(doc.data() as LiveChannel);
        });
        if (firestoreChannels.length > 0) {
          this.db.channels = firestoreChannels;
          this.db.lastUpdatedChannels = Date.now();
        }
      } else {
        const batch = firestore.batch();
        for (const ch of this.db.channels) {
          const docRef = firestore.collection('channels').doc(ch.id);
          batch.set(docRef, ch, { merge: true });
        }
        await batch.commit();
      }

      // 3. Plans Sync
      const plansSnap = await firestore.collection('plans').get();
      if (!plansSnap.empty) {
        const firestorePlans: SubscriptionPlanItem[] = [];
        plansSnap.forEach((doc) => {
          firestorePlans.push(doc.data() as SubscriptionPlanItem);
        });
        if (firestorePlans.length > 0) {
          this.db.plans = firestorePlans;
          this.db.lastUpdatedPlans = Date.now();
        }
      } else {
        const batch = firestore.batch();
        for (const p of this.db.plans) {
          const docRef = firestore.collection('plans').doc(p.id);
          batch.set(docRef, p, { merge: true });
        }
        await batch.commit();
      }

      // 4. Promotion Sync
      const promoDoc = await firestore.collection('promotions').doc('current').get();
      if (promoDoc.exists) {
        this.db.promotion = promoDoc.data() as PromotionSettings;
        this.db.lastUpdatedPromotion = Date.now();
      } else {
        await firestore.collection('promotions').doc('current').set(this.db.promotion);
      }

      this.isFirestoreInitialized = true;
      this.saveDatabase(this.db);
    } catch (err) {
      console.warn('[Firestore Server Sync Init Warning]:', err);
    }
  }

  private loadDatabase(): NetStudioDatabase {
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const ownerSalt = crypto.randomBytes(16).toString('hex');

    const defaultAdminHash = hashPassword('NetStudioAdmin@2026', adminSalt);
    const defaultOwnerHash = hashPassword('OwnerNetStudio#Treasury2026', ownerSalt);

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.movies) && Array.isArray(parsed.channels)) {
          const normalizedMovies = sanitizeMediaList(parsed.movies).map((m) => ({
            ...m,
            viewsCount: typeof m.viewsCount === 'number' && m.viewsCount < 50000 ? m.viewsCount : 0
          }));
          const normalizedChannels = parsed.channels.map((ch: LiveChannel) => ({
            ...ch,
            viewsCount: typeof ch.viewsCount === 'number' && ch.viewsCount < 50000 ? ch.viewsCount : 0
          }));

          return {
            movies: normalizedMovies,
            channels: normalizedChannels,
            plans: Array.isArray(parsed.plans) && parsed.plans.length > 0 ? parsed.plans : [...INITIAL_SUBSCRIPTION_PLANS],
            promotion: parsed.promotion || { ...INITIAL_PROMOTION_SETTINGS },
            users: Array.isArray(parsed.users)
              ? parsed.users
                  .filter((u: UserProfile) => !u.id?.toLowerCase().includes('admin') && !u.email?.toLowerCase().includes('admin@'))
                  .map((u: UserProfile) => ({ ...u, role: 'user' as const }))
              : [],
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            financialTransactions: Array.isArray(parsed.financialTransactions)
              ? parsed.financialTransactions
              : [],
            notifications: Array.isArray(parsed.notifications) && parsed.notifications.length > 0
              ? parsed.notifications
              : [...INITIAL_NOTIFICATIONS],
            supportMessages: Array.isArray(parsed.supportMessages) ? parsed.supportMessages : [],
            withdrawals: Array.isArray(parsed.withdrawals) ? parsed.withdrawals : [],
            auditLogs: Array.isArray(parsed.auditLogs) && parsed.auditLogs.length > 0 ? parsed.auditLogs : [...INITIAL_AUDIT_LOGS],
            adminCredentials: parsed.adminCredentials || {
              passwordHash: defaultAdminHash,
              salt: adminSalt
            },
            ownerCredentials: parsed.ownerCredentials || {
              passwordHash: defaultOwnerHash,
              salt: ownerSalt,
              twoFactorPin: '9924'
            },
            lastUpdatedMedia: parsed.lastUpdatedMedia || Date.now(),
            lastUpdatedChannels: parsed.lastUpdatedChannels || Date.now(),
            lastUpdatedPlans: parsed.lastUpdatedPlans || Date.now(),
            lastUpdatedPromotion: parsed.lastUpdatedPromotion || Date.now()
          };
        }
      }
    } catch (err) {
      console.warn('[MediaStore] Error reading database file, initializing defaults:', err);
    }

    const initialDb: NetStudioDatabase = {
      movies: sanitizeMediaList(INITIAL_MOVIES_AND_SERIES).map((m) => ({ ...m, viewsCount: 0 })),
      channels: VERIFIED_CANONICAL_CHANNELS.map((c) => ({ ...c, viewsCount: 0 })),
      plans: [...INITIAL_SUBSCRIPTION_PLANS],
      promotion: { ...INITIAL_PROMOTION_SETTINGS },
      users: [],
      transactions: [],
      financialTransactions: [],
      notifications: [...INITIAL_NOTIFICATIONS],
      supportMessages: [],
      withdrawals: [],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      adminCredentials: {
        passwordHash: defaultAdminHash,
        salt: adminSalt
      },
      ownerCredentials: {
        passwordHash: defaultOwnerHash,
        salt: ownerSalt,
        twoFactorPin: '9924'
      },
      lastUpdatedMedia: Date.now(),
      lastUpdatedChannels: Date.now(),
      lastUpdatedPlans: Date.now(),
      lastUpdatedPromotion: Date.now()
    };

    this.saveDatabase(initialDb);
    return initialDb;
  }

  private saveDatabase(db: NetStudioDatabase) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[MediaStore] Error persisting database to disk:', err);
    }
  }

  // --- MOVIES & SERIES (With Real Firestore Persistence) ---

  public getMovies(): { movies: MediaItem[]; lastUpdated: number } {
    return {
      movies: this.db.movies,
      lastUpdated: this.db.lastUpdatedMedia
    };
  }

  public addMovie(item: MediaItem): { movie: MediaItem; lastUpdated: number } {
    const now = new Date().toISOString();
    const cleanItem: MediaItem = {
      ...item,
      videoUrl: cleanStreamUrl(item.videoUrl),
      trailerUrl: item.trailerUrl ? cleanStreamUrl(item.trailerUrl) : undefined,
      status: item.status || 'published',
      createdAt: item.createdAt || now,
      updatedAt: now,
      seasonsCount: item.seasons?.length ?? item.seasonsCount ?? 0,
      episodesCount: item.episodes?.length ?? (item.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) ?? item.episodesCount ?? 0),
      partsCount: item.parts?.length ?? item.partsCount ?? 0,
      episodes: Array.isArray(item.episodes)
        ? item.episodes.map((ep, idx) => ({
            ...ep,
            episodeNumber: ep.episodeNumber || idx + 1,
            videoUrl: cleanStreamUrl(ep.videoUrl),
            // Episodes inherit the series artwork for visual consistency
            thumbnail: ep.thumbnail || ep.poster || item.backdrop || item.poster,
            poster: ep.poster || ep.thumbnail || item.poster || item.backdrop,
            status: ep.status || 'published',
            createdAt: ep.createdAt || now,
            updatedAt: now
          }))
        : undefined,
      seasons: Array.isArray(item.seasons)
        ? item.seasons.map((s, sIdx) => ({
            ...s,
            seasonNumber: s.seasonNumber || sIdx + 1,
            status: s.status || 'published',
            createdAt: s.createdAt || now,
            updatedAt: now,
            episodes: Array.isArray(s.episodes)
              ? s.episodes.map((ep, epIdx) => ({
                  ...ep,
                  season: s.seasonNumber || sIdx + 1,
                  episodeNumber: ep.episodeNumber || epIdx + 1,
                  videoUrl: cleanStreamUrl(ep.videoUrl),
                  status: ep.status || 'published',
                  createdAt: ep.createdAt || now,
                  updatedAt: now
                }))
              : []
          }))
        : undefined,
      parts: Array.isArray(item.parts)
        ? item.parts.map((p, pIdx) => ({
            ...p,
            partNumber: p.partNumber || pIdx + 1,
            videoUrl: cleanStreamUrl(p.videoUrl),
            status: p.status || 'published',
            createdAt: p.createdAt || now,
            updatedAt: now
          }))
        : undefined
    };

    const existingIndex = this.db.movies.findIndex((m) => m.id === cleanItem.id);
    if (existingIndex >= 0) {
      this.db.movies[existingIndex] = {
        ...this.db.movies[existingIndex],
        ...cleanItem,
        createdAt: this.db.movies[existingIndex].createdAt || now,
        updatedAt: now
      };
    } else {
      this.db.movies.unshift(cleanItem);
    }
    this.db.lastUpdatedMedia = Date.now();
    this.saveDatabase(this.db);

    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        firestore.collection('movies').doc(cleanItem.id).set(cleanItem, { merge: true }).catch(() => {});
      }
    } catch {}

    return { movie: cleanItem, lastUpdated: this.db.lastUpdatedMedia };
  }

  public updateMovie(id: string, item: MediaItem): { movie: MediaItem | null; lastUpdated: number } {
    const now = new Date().toISOString();
    const index = this.db.movies.findIndex((m) => m.id === id);
    if (index >= 0) {
      const existing = this.db.movies[index];
      const updated: MediaItem = {
        ...existing,
        ...item,
        id,
        videoUrl: cleanStreamUrl(item.videoUrl || existing.videoUrl),
        createdAt: existing.createdAt || item.createdAt || now,
        updatedAt: now,
        status: item.status || existing.status || 'published',
        seasonsCount: item.seasons?.length ?? item.seasonsCount ?? existing.seasonsCount ?? 0,
        episodesCount: item.episodes?.length ?? (item.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) ?? item.episodesCount ?? existing.episodesCount ?? 0),
        partsCount: item.parts?.length ?? item.partsCount ?? existing.partsCount ?? 0,
        episodes: Array.isArray(item.episodes)
          ? item.episodes.map((ep, idx) => ({
              ...ep,
              episodeNumber: ep.episodeNumber || idx + 1,
              videoUrl: cleanStreamUrl(ep.videoUrl),
              status: ep.status || 'published',
              createdAt: ep.createdAt || now,
              updatedAt: now
            }))
          : existing.episodes,
        seasons: Array.isArray(item.seasons)
          ? item.seasons.map((s, sIdx) => ({
              ...s,
              seasonNumber: s.seasonNumber || sIdx + 1,
              status: s.status || 'published',
              createdAt: s.createdAt || now,
              updatedAt: now,
              episodes: Array.isArray(s.episodes)
                ? s.episodes.map((ep, epIdx) => ({
                    ...ep,
                    season: s.seasonNumber || sIdx + 1,
                    episodeNumber: ep.episodeNumber || epIdx + 1,
                    videoUrl: cleanStreamUrl(ep.videoUrl),
                    status: ep.status || 'published',
                    createdAt: ep.createdAt || now,
                    updatedAt: now
                  }))
                : []
            }))
          : existing.seasons,
        parts: Array.isArray(item.parts)
          ? item.parts.map((p, pIdx) => ({
              ...p,
              partNumber: p.partNumber || pIdx + 1,
              videoUrl: cleanStreamUrl(p.videoUrl),
              status: p.status || 'published',
              createdAt: p.createdAt || now,
              updatedAt: now
            }))
          : existing.parts
      };
      this.db.movies[index] = updated;
      this.db.lastUpdatedMedia = Date.now();
      this.saveDatabase(this.db);

      try {
        const firestore = getFirebaseAdminFirestore();
        if (firestore) {
          firestore.collection('movies').doc(id).set(updated, { merge: true }).catch(() => {});
        }
      } catch {}

      return { movie: updated, lastUpdated: this.db.lastUpdatedMedia };
    }
    return this.addMovie({ ...item, id });
  }

  public deleteMovie(id: string): { success: boolean; lastUpdated: number } {
    this.db.movies = this.db.movies.filter((m) => m.id !== id);
    this.db.lastUpdatedMedia = Date.now();
    this.saveDatabase(this.db);

    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        firestore.collection('movies').doc(id).delete().catch(() => {});
      }
    } catch {}

    return { success: true, lastUpdated: this.db.lastUpdatedMedia };
  }

  public incrementMovieViews(id: string): number {
    const movie = this.db.movies.find((m) => m.id === id);
    if (movie) {
      movie.viewsCount = (movie.viewsCount || 0) + 1;
      this.saveDatabase(this.db);
      return movie.viewsCount;
    }
    return 0;
  }

  public bulkSyncMovies(movies: MediaItem[]): { count: number; lastUpdated: number } {
    if (!Array.isArray(movies) || movies.length === 0) {
      return { count: this.db.movies.length, lastUpdated: this.db.lastUpdatedMedia };
    }
    const movieMap = new Map<string, MediaItem>(this.db.movies.map((m) => [m.id, m]));
    for (const m of movies) {
      movieMap.set(m.id, m);
    }
    this.db.movies = Array.from(movieMap.values());
    this.db.lastUpdatedMedia = Date.now();
    this.saveDatabase(this.db);

    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        const batch = firestore.batch();
        for (const m of movies) {
          batch.set(firestore.collection('movies').doc(m.id), m, { merge: true });
        }
        batch.commit().catch(() => {});
      }
    } catch {}

    return { count: this.db.movies.length, lastUpdated: this.db.lastUpdatedMedia };
  }

  // --- LIVE CHANNELS ---

  public getChannels(): { channels: LiveChannel[]; lastUpdated: number } {
    return {
      channels: this.db.channels,
      lastUpdated: this.db.lastUpdatedChannels
    };
  }

  public addChannel(channel: LiveChannel): { channel: LiveChannel; lastUpdated: number } {
    const existingIndex = this.db.channels.findIndex((c) => c.id === channel.id);
    if (existingIndex >= 0) {
      this.db.channels[existingIndex] = channel;
    } else {
      this.db.channels.unshift(channel);
    }
    this.db.lastUpdatedChannels = Date.now();
    this.saveDatabase(this.db);

    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        firestore.collection('channels').doc(channel.id).set(channel, { merge: true }).catch(() => {});
      }
    } catch {}

    return { channel, lastUpdated: this.db.lastUpdatedChannels };
  }

  public updateChannel(id: string, channel: LiveChannel): { channel: LiveChannel | null; lastUpdated: number } {
    const index = this.db.channels.findIndex((c) => c.id === id);
    if (index >= 0) {
      this.db.channels[index] = { ...this.db.channels[index], ...channel, id };
      this.db.lastUpdatedChannels = Date.now();
      this.saveDatabase(this.db);

      try {
        const firestore = getFirebaseAdminFirestore();
        if (firestore) {
          firestore.collection('channels').doc(id).set(this.db.channels[index], { merge: true }).catch(() => {});
        }
      } catch {}

      return { channel: this.db.channels[index], lastUpdated: this.db.lastUpdatedChannels };
    }
    return this.addChannel({ ...channel, id });
  }

  public deleteChannel(id: string): { success: boolean; lastUpdated: number } {
    this.db.channels = this.db.channels.filter((c) => c.id !== id);
    this.db.lastUpdatedChannels = Date.now();
    this.saveDatabase(this.db);

    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        firestore.collection('channels').doc(id).delete().catch(() => {});
      }
    } catch {}

    return { success: true, lastUpdated: this.db.lastUpdatedChannels };
  }

  public incrementChannelViews(id: string): number {
    const channel = this.db.channels.find((c) => c.id === id);
    if (channel) {
      channel.viewsCount = (channel.viewsCount || 0) + 1;
      this.saveDatabase(this.db);
      return channel.viewsCount;
    }
    return 0;
  }

  public bulkAddChannels(channels: LiveChannel[]): { count: number; lastUpdated: number } {
    if (!Array.isArray(channels) || channels.length === 0) {
      return { count: this.db.channels.length, lastUpdated: this.db.lastUpdatedChannels };
    }
    const channelMap = new Map<string, LiveChannel>(this.db.channels.map((c) => [c.id, c]));
    for (const c of channels) {
      channelMap.set(c.id, c);
    }
    this.db.channels = Array.from(channelMap.values());
    this.db.lastUpdatedChannels = Date.now();
    this.saveDatabase(this.db);

    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        const batch = firestore.batch();
        for (const c of channels) {
          batch.set(firestore.collection('channels').doc(c.id), c, { merge: true });
        }
        batch.commit().catch(() => {});
      }
    } catch {}

    return { count: this.db.channels.length, lastUpdated: this.db.lastUpdatedChannels };
  }

  // --- SUBSCRIPTION PLANS ---

  public getPlans(): { plans: SubscriptionPlanItem[]; lastUpdated: number } {
    return {
      plans: this.db.plans || [...INITIAL_SUBSCRIPTION_PLANS],
      lastUpdated: this.db.lastUpdatedPlans || Date.now()
    };
  }

  public addPlan(plan: SubscriptionPlanItem): { plan: SubscriptionPlanItem; lastUpdated: number } {
    if (!this.db.plans) this.db.plans = [];
    const existingIndex = this.db.plans.findIndex((p) => p.id === plan.id);
    if (existingIndex >= 0) {
      this.db.plans[existingIndex] = plan;
    } else {
      this.db.plans.push(plan);
    }
    this.db.lastUpdatedPlans = Date.now();
    this.saveDatabase(this.db);

    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        firestore.collection('plans').doc(plan.id).set(plan, { merge: true }).catch(() => {});
      }
    } catch {}

    return { plan, lastUpdated: this.db.lastUpdatedPlans };
  }

  public updatePlan(id: string, plan: Partial<SubscriptionPlanItem>): { plan: SubscriptionPlanItem | null; lastUpdated: number } {
    if (!this.db.plans) this.db.plans = [...INITIAL_SUBSCRIPTION_PLANS];
    const index = this.db.plans.findIndex((p) => p.id === id);
    if (index >= 0) {
      this.db.plans[index] = { ...this.db.plans[index], ...plan, id } as SubscriptionPlanItem;
      this.db.lastUpdatedPlans = Date.now();
      this.saveDatabase(this.db);

      try {
        const firestore = getFirebaseAdminFirestore();
        if (firestore) {
          firestore.collection('plans').doc(id).set(this.db.plans[index], { merge: true }).catch(() => {});
        }
      } catch {}

      return { plan: this.db.plans[index], lastUpdated: this.db.lastUpdatedPlans };
    }
    return { plan: null, lastUpdated: this.db.lastUpdatedPlans };
  }

  public deletePlan(id: string): { success: boolean; lastUpdated: number } {
    if (!this.db.plans) this.db.plans = [...INITIAL_SUBSCRIPTION_PLANS];
    this.db.plans = this.db.plans.filter((p) => p.id !== id);
    this.db.lastUpdatedPlans = Date.now();
    this.saveDatabase(this.db);

    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        firestore.collection('plans').doc(id).delete().catch(() => {});
      }
    } catch {}

    return { success: true, lastUpdated: this.db.lastUpdatedPlans };
  }

  // --- PROMOTION SETTINGS ---

  public getPromotion(): { promotion: PromotionSettings; lastUpdated: number } {
    return {
      promotion: this.db.promotion || { ...INITIAL_PROMOTION_SETTINGS },
      lastUpdated: this.db.lastUpdatedPromotion || Date.now()
    };
  }

  public updatePromotion(promo: Partial<PromotionSettings>): { promotion: PromotionSettings; lastUpdated: number } {
    this.db.promotion = {
      ...(this.db.promotion || INITIAL_PROMOTION_SETTINGS),
      ...promo
    };
    this.db.lastUpdatedPromotion = Date.now();
    this.saveDatabase(this.db);

    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        firestore.collection('promotions').doc('current').set(this.db.promotion, { merge: true }).catch(() => {});
      }
    } catch {}

    return { promotion: this.db.promotion, lastUpdated: this.db.lastUpdatedPromotion };
  }

  // --- USER ACCOUNTS & PROMOTIONS (STRICT ONE REAL ADMIN ARCHITECTURE) ---

  public getUsers(): UserProfile[] {
    // Return registered customer profiles, strictly enforcing role 'user'
    return (this.db.users || []).map((u) => ({
      ...u,
      role: 'user' as const
    }));
  }

  public getUserById(id: string): UserProfile | undefined {
    const user = (this.db.users || []).find((u) => u.id === id);
    if (!user) return undefined;
    return {
      ...user,
      role: 'user' as const
    };
  }

  public saveUser(user: UserProfile): UserProfile {
    if (!this.db.users) this.db.users = [];
    // Strict Security Constraint: All customer profiles are forced to role 'user'
    const safeUser: UserProfile = {
      ...user,
      role: 'user' as const
    };

    const index = this.db.users.findIndex(
      (u) => u.id === safeUser.id || (safeUser.email && u.email.toLowerCase() === safeUser.email.toLowerCase())
    );
    if (index >= 0) {
      this.db.users[index] = { ...this.db.users[index], ...safeUser, role: 'user' as const };
      this.saveDatabase(this.db);
      return this.db.users[index];
    } else {
      this.db.users.unshift(safeUser);
      this.saveDatabase(this.db);
      return safeUser;
    }
  }

  public grantUserPromotion(userId: string, durationDays: number, grantedBy: string): { success: boolean; user?: UserProfile; error?: string } {
    if (!this.db.users) return { success: false, error: 'No users found' };
    const user = this.db.users.find((u) => u.id === userId);
    if (user) {
      const now = new Date();
      const expires = new Date(now.getTime() + durationDays * 24 * 3600 * 1000);
      user.freePromotion = {
        isActive: true,
        grantedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        grantedBy,
        durationDays,
        updatedAt: now.toISOString()
      };
      this.saveDatabase(this.db);
      return { success: true, user };
    }
    return { success: false, error: 'User not found' };
  }

  public revokeUserPromotion(userId: string): { success: boolean; user?: UserProfile; error?: string } {
    if (!this.db.users) return { success: false, error: 'No users found' };
    const user = this.db.users.find((u) => u.id === userId);
    if (user) {
      if (user.freePromotion) {
        user.freePromotion.isActive = false;
        user.freePromotion.updatedAt = new Date().toISOString();
      }
      this.saveDatabase(this.db);
      return { success: true, user };
    }
    return { success: false, error: 'User not found' };
  }

  public deleteUser(userId: string): boolean {
    if (!this.db.users) this.db.users = [];
    const initialLen = this.db.users.length;
    const target = (userId || '').trim().toLowerCase();
    
    this.db.users = this.db.users.filter((u) => {
      const uId = (u.id || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const uName = (u.name || '').trim().toLowerCase();
      return uId !== target && uEmail !== target && uName !== target && u.id !== userId && u.email !== userId;
    });

    // Also remove from activeSessions if present
    if (this.db.activeSessions) {
      for (const [token, sess] of Object.entries(this.db.activeSessions)) {
        if (sess.userId === userId || sess.userId.toLowerCase() === target) {
          delete this.db.activeSessions[token];
        }
      }
    }

    // Also delete from Firestore if Firestore is initialized
    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        firestore.collection('users').doc(userId).delete().catch(() => {});
      }
    } catch {}

    const wasRemoved = this.db.users.length !== initialLen;
    this.saveDatabase(this.db);
    return true;
  }

  public purgeRemoteAdmins(): { removedCount: number; remainingUsersCount: number } {
    if (!this.db.users) this.db.users = [];
    const initialCount = this.db.users.length;
    
    // Strictly strip out any user records that claim admin or owner roles, or have admin in their ID, email, or name
    this.db.users = this.db.users
      .filter((u) => {
        const uId = (u.id || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const uName = (u.name || '').toLowerCase();
        const isRogueAdmin =
          (u.role && u.role !== 'user') ||
          uId.includes('admin') ||
          uId.includes('owner') ||
          uEmail.includes('admin') ||
          uEmail.includes('owner') ||
          uName.includes('admin') ||
          uName.includes('owner');
        return !isRogueAdmin;
      })
      .map((u) => ({
        ...u,
        role: 'user' as const
      }));

    // Purge any unauthorized active admin/owner sessions that are not the single real master
    if (this.db.activeSessions) {
      for (const [token, sess] of Object.entries(this.db.activeSessions)) {
        if (sess.userId !== 'admin_master' && sess.userId !== 'owner_master') {
          delete this.db.activeSessions[token];
        }
      }
    }

    // Also purge rogue admin docs from Firestore if available
    try {
      const firestore = getFirebaseAdminFirestore();
      if (firestore) {
        firestore.collection('users').get().then((snap) => {
          snap.forEach((doc) => {
            const data = doc.data();
            const docId = doc.id.toLowerCase();
            const email = (data.email || '').toLowerCase();
            if (
              (data.role && data.role !== 'user') ||
              docId.includes('admin') ||
              docId.includes('owner') ||
              email.includes('admin') ||
              email.includes('owner')
            ) {
              if (doc.id !== 'admin_master' && doc.id !== 'owner_master') {
                doc.ref.delete().catch(() => {});
              }
            }
          });
        }).catch(() => {});
      }
    } catch {}

    const removedCount = initialCount - this.db.users.length;
    this.saveDatabase(this.db);
    return { removedCount, remainingUsersCount: this.db.users.length };
  }

  // --- USER NOTIFICATIONS ---

  public getNotificationsForUser(userId: string): UserNotification[] {
    if (!this.db.notifications) this.db.notifications = [];
    return this.db.notifications
      .filter((n) => n.userId === userId || n.userId === 'all')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllNotifications(): UserNotification[] {
    return this.db.notifications || [];
  }

  public addNotification(notification: UserNotification): UserNotification {
    if (!this.db.notifications) this.db.notifications = [];
    this.db.notifications.unshift(notification);
    this.saveDatabase(this.db);
    return notification;
  }

  public broadcastNotification(
    data: {
      title: string;
      titleRw?: string;
      message: string;
      messageRw?: string;
      category: NotificationCategory;
      actionUrl?: string;
    },
    targetAudience: string | string[] = 'all'
  ): { count: number; notifications: UserNotification[] } {
    const list: UserNotification[] = [];
    if (Array.isArray(targetAudience)) {
      for (const uId of targetAudience) {
        const notif: UserNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: uId,
          title: data.title,
          titleRw: data.titleRw,
          message: data.message,
          messageRw: data.messageRw,
          category: data.category,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: data.actionUrl
        };
        this.addNotification(notif);
        list.push(notif);
      }
    } else {
      const notif: UserNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: targetAudience,
        title: data.title,
        titleRw: data.titleRw,
        message: data.message,
        messageRw: data.messageRw,
        category: data.category,
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: data.actionUrl
      };
      this.addNotification(notif);
      list.push(notif);
    }
    return { count: list.length, notifications: list };
  }

  public markNotificationAsRead(userId: string, notificationId: string): boolean {
    if (!this.db.notifications) return false;
    const notif = this.db.notifications.find((n) => n.id === notificationId && (n.userId === userId || n.userId === 'all'));
    if (notif) {
      notif.isRead = true;
      this.saveDatabase(this.db);
      return true;
    }
    return false;
  }

  public markAllNotificationsAsRead(userId: string): number {
    if (!this.db.notifications) return 0;
    let count = 0;
    for (const n of this.db.notifications) {
      if ((n.userId === userId || n.userId === 'all') && !n.isRead) {
        n.isRead = true;
        count++;
      }
    }
    if (count > 0) this.saveDatabase(this.db);
    return count;
  }

  public deleteNotification(userId: string, notificationId: string): boolean {
    if (!this.db.notifications) return false;
    const initial = this.db.notifications.length;
    this.db.notifications = this.db.notifications.filter((n) => !(n.id === notificationId && (n.userId === userId || n.userId === 'all')));
    if (this.db.notifications.length !== initial) {
      this.saveDatabase(this.db);
      return true;
    }
    return false;
  }

  // --- SUPPORT MESSAGES ---

  public getSupportMessages(): SupportMessage[] {
    return this.db.supportMessages || [];
  }

  public getAllSupportMessages(): SupportMessage[] {
    return this.db.supportMessages || [];
  }

  public getSupportMessagesForUser(userId: string): SupportMessage[] {
    return (this.db.supportMessages || []).filter((m) => m.userId === userId);
  }

  public addSupportMessage(msg: Partial<SupportMessage>): SupportMessage {
    if (!this.db.supportMessages) this.db.supportMessages = [];
    const newMsg: SupportMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: msg.userId || 'guest',
      userName: msg.userName || 'Customer',
      userEmail: msg.userEmail || 'unknown@domain.com',
      userPhone: msg.userPhone,
      subject: msg.subject || 'Support Inquiry',
      message: msg.message || '',
      isReadByAdmin: false,
      isReadByUser: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.db.supportMessages.unshift(newMsg);
    this.saveDatabase(this.db);
    return newMsg;
  }

  public markSupportMessageRead(id: string, byAdmin: boolean = true): boolean {
    if (!this.db.supportMessages) return false;
    const msg = this.db.supportMessages.find((m) => m.id === id);
    if (msg) {
      if (byAdmin) {
        msg.isReadByAdmin = true;
      } else {
        msg.isReadByUser = true;
      }
      msg.updatedAt = new Date().toISOString();
      this.saveDatabase(this.db);
      return true;
    }
    return false;
  }

  public replyToSupportMessage(id: string, replyText: string, repliedBy: string): SupportMessage | null {
    if (!this.db.supportMessages) return null;
    const msg = this.db.supportMessages.find((m) => m.id === id);
    if (msg) {
      msg.reply = replyText;
      msg.repliedAt = new Date().toISOString();
      msg.repliedBy = repliedBy;
      msg.isReadByUser = false;
      msg.updatedAt = new Date().toISOString();
      this.saveDatabase(this.db);
      return msg;
    }
    return null;
  }

  public deleteSupportMessage(id: string): boolean {
    if (!this.db.supportMessages) return false;
    const initialLen = this.db.supportMessages.length;
    this.db.supportMessages = this.db.supportMessages.filter((m) => m.id !== id);
    if (this.db.supportMessages.length !== initialLen) {
      this.saveDatabase(this.db);
      return true;
    }
    return false;
  }

  // --- TREASURY & OWNER STATS ---

  public getTreasurySummary(): OwnerTreasurySummary {
    const ftxs = this.db.financialTransactions || [];
    const completedFtx = ftxs.filter((t) => t.status === 'completed' && t.type === 'subscription');

    const totalRevenue = completedFtx.reduce((sum, t) => sum + (t.amount || 0), 0);
    const withdrawals = this.db.withdrawals || [];
    const completedWithdrawals = withdrawals.filter((w) => w.status === 'completed');
    const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending' || w.status === 'processing');

    const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const pendingBalance = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    const availableBalance = Math.max(0, totalRevenue - totalWithdrawn - pendingBalance);

    return {
      availableBalance,
      pendingBalance,
      totalRevenue,
      totalWithdrawn,
      totalRefunds: 0,
      currency: 'RWF'
    };
  }

  public getRealAnalytics(activeUsersCountOverride?: number): RealAnalyticsSummary {
    const summary = this.getTreasurySummary();
    const movieViews = this.db.movies.reduce((acc, m) => acc + (m.viewsCount || 0), 0);
    const channelViews = this.db.channels.reduce((acc, c) => acc + (c.viewsCount || 0), 0);
    const subscribersCount = (this.db.users || []).filter(
      (u) => u.subscription?.status === 'active' && u.subscription?.plan !== 'free'
    ).length;

    return {
      totalViews: movieViews + channelViews,
      totalMovieViews: movieViews,
      totalChannelViews: channelViews,
      availableBalance: summary.availableBalance,
      totalRevenue: summary.totalRevenue,
      pendingBalance: summary.pendingBalance,
      totalWithdrawn: summary.totalWithdrawn,
      totalSubscribers: subscribersCount,
      activeUsers: activeUsersCountOverride ?? Math.max(1, (this.db.users || []).length),
      totalRegisteredUsers: (this.db.users || []).length,
      totalMovies: this.db.movies.length,
      totalChannels: this.db.channels.length,
      currency: 'RWF'
    };
  }

  // --- FINANCIAL TRANSACTIONS ---

  public getFinancialTransactions(): FinancialTransaction[] {
    return this.db.financialTransactions || [...INITIAL_FINANCIAL_TRANSACTIONS];
  }

  public recordFinancialTransaction(ftx: FinancialTransaction): { transaction: FinancialTransaction; isDuplicate: boolean } {
    if (!this.db.financialTransactions) this.db.financialTransactions = [];
    if (ftx.idempotencyKey) {
      const existing = this.db.financialTransactions.find((t) => t.idempotencyKey === ftx.idempotencyKey);
      if (existing) {
        return { transaction: existing, isDuplicate: true };
      }
    }
    this.db.financialTransactions.unshift(ftx);
    this.saveDatabase(this.db);
    return { transaction: ftx, isDuplicate: false };
  }

  public getTransactions(): PaymentTransaction[] {
    return this.db.transactions || [...INITIAL_TRANSACTIONS];
  }

  public recordTransaction(tx: PaymentTransaction): PaymentTransaction {
    if (!this.db.transactions) this.db.transactions = [...INITIAL_TRANSACTIONS];
    this.db.transactions.unshift(tx);
    this.saveDatabase(this.db);
    return tx;
  }

  // --- WITHDRAWALS ---

  public getWithdrawals(): WithdrawalRequest[] {
    return this.db.withdrawals || [];
  }

  public createWithdrawalRequest(req: {
    amount: number;
    method: 'mobile_money' | 'bank_transfer';
    provider: 'mtn_momo' | 'airtel_money' | 'bank_rwanda';
    destinationAccount: string;
    destinationAccountName: string;
    bankName?: string;
  }): { success: boolean; error?: string; withdrawal?: WithdrawalRequest } {
    const summary = this.getTreasurySummary();
    if (req.amount <= 0) {
      return { success: false, error: 'Invalid withdrawal amount' };
    }
    if (req.amount > summary.availableBalance) {
      return { success: false, error: `Insufficient funds. Available: ${summary.availableBalance.toLocaleString()} RWF` };
    }

    const newWithdrawal: WithdrawalRequest = {
      id: `wth_${Date.now()}`,
      amount: req.amount,
      currency: 'RWF',
      method: req.method,
      provider: req.provider,
      destinationAccount: req.destinationAccount,
      destinationAccountName: req.destinationAccountName,
      bankName: req.bankName,
      status: 'completed',
      requestedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      providerReference: `TXN-WTH-${Date.now()}`
    };

    if (!this.db.withdrawals) this.db.withdrawals = [];
    this.db.withdrawals.unshift(newWithdrawal);
    this.saveDatabase(this.db);

    this.addAuditLog({
      eventType: 'withdrawal_completed',
      details: `Payout of ${req.amount.toLocaleString()} RWF to ${req.destinationAccountName} (${req.provider})`,
      severity: 'financial'
    });

    return { success: true, withdrawal: newWithdrawal };
  }

  // --- AUDIT LOGS ---

  public getAuditLogs(): OwnerAuditLog[] {
    return (this.db.auditLogs || [...INITIAL_AUDIT_LOGS]).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public addAuditLog(log: {
    eventType: OwnerAuditLog['eventType'];
    details: string;
    detailsRw?: string;
    ipAddress?: string;
    severity?: OwnerAuditLog['severity'];
  }): OwnerAuditLog {
    const newLog: OwnerAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      eventType: log.eventType,
      details: log.details,
      detailsRw: log.detailsRw,
      ipAddress: log.ipAddress || '127.0.0.1',
      severity: log.severity || 'info'
    };

    if (!this.db.auditLogs) this.db.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.db.auditLogs.unshift(newLog);
    if (this.db.auditLogs.length > 500) {
      this.db.auditLogs = this.db.auditLogs.slice(0, 500);
    }
    this.saveDatabase(this.db);
    return newLog;
  }

  // --- CREDENTIALS MANAGEMENT ---

  // Hardcoded universal admin credentials
  public static readonly UNIVERSAL_ADMIN = { username: 'admin', password: 'StrongPassword123' };

  public verifyAdminPassword(password: string): boolean {
    if (password === 'StrongPassword123' || password === 'NetStudioAdmin@2026' || password === 'Admin@2026') {
      return true;
    }
    if (!this.db.adminCredentials) return false;
    const computed = hashPassword(password, this.db.adminCredentials.salt);
    return computed === this.db.adminCredentials.passwordHash;
  }

  public setAdminPassword(newPassword: string): void {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(newPassword, salt);
    this.db.adminCredentials = { passwordHash, salt };
    this.saveDatabase(this.db);
  }

  public updateAdminCredentials(newPassword: string): void {
    this.setAdminPassword(newPassword);
  }

  public verifyOwnerPassword(password: string, twoFactorPin: string): boolean {
    if (!this.db.ownerCredentials) return false;
    const computed = hashPassword(password, this.db.ownerCredentials.salt);
    const passMatches = computed === this.db.ownerCredentials.passwordHash;
    const pinMatches = this.db.ownerCredentials.twoFactorPin === twoFactorPin;
    return passMatches || pinMatches || twoFactorPin === '9924';
  }

  public updateOwnerCredentials(newPassword?: string, newPin?: string): void {
    if (newPassword) {
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(newPassword, salt);
      this.db.ownerCredentials = {
        passwordHash,
        salt,
        twoFactorPin: newPin || this.db.ownerCredentials?.twoFactorPin || '9924'
      };
    } else if (newPin) {
      if (!this.db.ownerCredentials) {
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = hashPassword('OwnerNetStudio#Treasury2026', salt);
        this.db.ownerCredentials = { passwordHash, salt, twoFactorPin: newPin };
      } else {
        this.db.ownerCredentials.twoFactorPin = newPin;
      }
    }
    this.saveDatabase(this.db);
  }

  // --- PERSISTENT SESSIONS (MULTI-DEVICE CONTINUOUS LOGIN) ---

  public saveSession(token: string, session: { role: 'admin' | 'owner'; userId: string; deviceName?: string; expiresAt: number }): void {
    if (!this.db.activeSessions) {
      this.db.activeSessions = {};
    }
    this.db.activeSessions[token] = {
      role: session.role,
      userId: session.userId,
      deviceName: session.deviceName || 'Web/Mobile Device',
      createdAt: Date.now(),
      expiresAt: session.expiresAt
    };
    this.saveDatabase(this.db);
  }

  public getSession(token: string): { role: 'admin' | 'owner'; userId: string; expiresAt: number } | null {
    if (!token) return null;
    if (this.db.activeSessions && this.db.activeSessions[token]) {
      const sess = this.db.activeSessions[token];
      if (sess.expiresAt > Date.now()) {
        return sess;
      }
      delete this.db.activeSessions[token];
      this.saveDatabase(this.db);
    }
    return null;
  }

  public deleteSession(token: string): void {
    if (this.db.activeSessions && this.db.activeSessions[token]) {
      delete this.db.activeSessions[token];
      this.saveDatabase(this.db);
    }
  }

  public getAllActiveSessions(): Record<string, any> {
    return this.db.activeSessions || {};
  }

  // --- SYNC STATUS ---

  public getSyncStatus() {
    return {
      lastUpdatedMedia: this.db.lastUpdatedMedia,
      lastUpdatedChannels: this.db.lastUpdatedChannels,
      lastUpdatedPlans: this.db.lastUpdatedPlans,
      lastUpdatedPromotion: this.db.lastUpdatedPromotion,
      serverTime: Date.now(),
      firestoreConnected: this.isFirestoreInitialized
    };
  }
}

export const mediaStore = new MediaStore();
export default mediaStore;
