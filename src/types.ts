export type Language = 'en' | 'rw';

export type ContentType = 'movie' | 'series' | 'livetv';

export type ContentStatus = 'draft' | 'published' | 'archived';

export interface Episode {
  id: string;
  season: number;
  episodeNumber: number;
  title: string;
  titleRw?: string;
  duration?: string;
  synopsis?: string;
  description?: string;
  synopsisRw?: string;
  thumbnail: string;
  poster?: string;
  videoUrl: string;
  isPremium?: boolean;
  status?: ContentStatus;
  catalogRefId?: string; // Reference to existing content in catalog
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Season {
  id: string;
  seasonNumber: number;
  title?: string;
  description?: string;
  poster?: string;
  year?: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  episodes?: Episode[];
}

export interface MediaPart {
  id: string;
  partNumber: number;
  title: string;
  description?: string;
  poster?: string;
  videoUrl: string;
  duration?: string;
  status: ContentStatus;
  catalogRefId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  title: string;
  titleRw?: string;
  originalTitle?: string;
  type: 'movie' | 'series';
  poster: string;
  backdrop?: string;
  year: number;
  rating: number; // e.g. 8.9
  ageRating?: string; // e.g. '16+', '18+', 'PG-13'
  duration?: string; // e.g. '2h 15m'
  seasonsCount?: number;
  episodesCount?: number;
  partsCount?: number;
  genres: string[];
  genresRw?: string[];
  director?: string;
  cast?: string[];
  interpreter?: string; // e.g., 'Rocky Kimomo', 'Junior Giti', 'Sankara', 'Yanga'
  synopsis: string;
  synopsisRw?: string;
  videoUrl: string;
  trailerUrl?: string;
  isTrending?: boolean;
  isNewRelease?: boolean;
  isFeatured?: boolean;
  isPremiumOnly?: boolean;
  allowsDownload?: boolean;
  country?: string;
  language?: string;
  quality?: '4K' | 'FHD' | 'HD';
  status?: ContentStatus;
  seasons?: Season[];
  episodes?: Episode[];
  parts?: MediaPart[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  viewsCount: number;
}

export interface LiveChannel {
  id: string; // Permanent unique channel ID (e.g. 'FlashTV.rw', 'BTN.rw', 'RwandaTV.rw')
  name: string;
  country: string | null;
  countryCode: string | null;
  category: string;
  categories?: string[];
  categoryRw?: string;
  logo: string;
  logoUrl?: string | null;
  streamUrl: string;
  feed?: string | null;
  quality: 'HD' | 'FHD' | '4K' | string | null;
  isLive: boolean;
  viewsCount?: number;
  currentProgram?: string;
  currentProgramRw?: string;
  nextProgram?: string;
  nextProgramRw?: string;
  isPremiumOnly?: boolean;
  verifiedLogo?: boolean;
  debugInfo?: {
    channelId: string;
    logoChannelId: string | null;
    streamChannelId: string | null;
    status: 'VERIFIED' | 'NO_LOGO' | 'ERROR';
  };
}

export interface ContinueWatchingItem {
  mediaId: string;
  media: MediaItem;
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  progressSeconds: number;
  durationSeconds: number;
  progressPercentage: number;
  lastWatchedAt: string;
}

export interface DownloadedItem {
  id: string;
  mediaId: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  season?: number;
  episodeNumber?: number;
  fileSize: string; // e.g. '1.4 GB'
  quality: string;
  downloadedAt: string;
  videoUrl: string;
}

export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  nameRw: string;
  priceRwf: number;
  priceUsd: number;
  billingPeriod?: 'monthly' | 'yearly' | 'weekly' | 'custom' | string;
  period?: string; // e.g. 'Daily', 'Weekly', 'Monthly', 'Yearly', 'Lifetime'
  periodRw?: string;
  durationDays?: number;
  description?: string;
  descriptionRw?: string;
  features: string[];
  featuresRw: string[];
  badge?: string;
  isPopular?: boolean;
  isActive: boolean;
  isFreePromotion?: boolean; // 100% free promotional plan
}

export type SubscriptionPlan = SubscriptionPlanItem;

export interface PromotionSettings {
  isGlobalFreeActive: boolean;
  promoTitle?: string;
  promoTitleRw?: string;
  promoMessage?: string;
  promoMessageRw?: string;
  freePromoMessage?: string;
  freePromoMessageRw?: string;
  promoTag?: string;
  discountPercentage?: number;
}

export type UserRole = 'user' | 'admin' | 'owner';

export interface UserSubscription {
  plan: SubscriptionTier;
  planId?: string;
  planName?: string;
  status: 'active' | 'expired' | 'canceled';
  expiresAt: string;
  paymentMethod?: 'mtn_momo' | 'airtel_money' | 'stripe' | 'promotion';
  phoneNumber?: string;
  amountRwf?: number;
}

export interface UserFreePromotion {
  isActive: boolean;
  grantedAt: string;
  expiresAt: string;
  grantedBy: string;
  durationDays: number;
  updatedAt: string;
}

export type Movie = MediaItem;

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  role: UserRole;
  subscription?: UserSubscription;
  freePromotion?: UserFreePromotion;
  createdAt: string;
  isLoggedIn?: boolean;
  isGuest?: boolean;
}

export interface UserProfile extends User {
  phoneNumber?: string;
  password?: string;
  avatar: string;
  subscription: UserSubscription;
}

export interface SupportMessage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject?: string;
  message: string;
  reply?: string;
  repliedAt?: string;
  repliedBy?: string;
  isReadByAdmin: boolean;
  isReadByUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationCategory =
  | 'System'
  | 'New Movie'
  | 'New Series'
  | 'Live TV'
  | 'Subscription'
  | 'Payment'
  | 'Account'
  | 'Promotion'
  | 'Maintenance';

export interface UserNotification {
  id: string;
  userId: string; // The specific user ID this notification belongs to
  title: string;
  titleRw?: string;
  message: string;
  messageRw?: string;
  category: NotificationCategory;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface FinancialTransaction {
  id: string;
  userId: string;
  userName?: string;
  provider: string; // 'mtn_momo' | 'airtel_money' | 'stripe' | 'bank_payout'
  providerTransactionId: string;
  amount: number;
  amountUsd?: number;
  currency: string;
  type: 'subscription' | 'refund' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  completedAt?: string;
  planId?: string;
  planName?: string;
  phoneNumber?: string;
  destinationDetails?: string;
  idempotencyKey?: string;
}

export interface OwnerTreasurySummary {
  availableBalance: number;
  pendingBalance: number;
  totalRevenue: number;
  totalWithdrawn: number;
  totalRefunds: number;
  currency: string;
}

export interface RealAnalyticsSummary {
  totalViews: number;
  totalMovieViews: number;
  totalChannelViews: number;
  availableBalance: number;
  totalRevenue: number;
  pendingBalance: number;
  totalWithdrawn: number;
  totalSubscribers: number;
  activeUsers: number;
  totalRegisteredUsers: number;
  totalMovies: number;
  totalChannels: number;
  currency: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  method: 'mobile_money' | 'bank_transfer';
  provider: 'mtn_momo' | 'airtel_money' | 'bank_rwanda';
  destinationAccount: string;
  destinationAccountName: string;
  bankName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: string;
  completedAt?: string;
  auditId?: string;
  providerReference?: string;
}

export interface OwnerAuditLog {
  id: string;
  eventType:
    | 'login'
    | 'failed_login'
    | 'successful_2fa'
    | 'payment_received'
    | 'refund'
    | 'withdrawal_requested'
    | 'withdrawal_completed'
    | 'withdrawal_failed'
    | 'payout_destination_changed'
    | 'security_settings_changed';
  details: string;
  detailsRw?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'security' | 'financial';
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userName: string;
  method: 'mtn_momo' | 'airtel_money' | 'stripe' | 'promotion';
  phoneNumber?: string;
  amountRwf: number;
  amountUsd: number;
  plan: string; // plan id or monthly/yearly
  planName?: string;
  status: 'completed' | 'pending' | 'failed';
  referenceId: string;
  date: string;
}

export type InstallMethod =
  | 'native-pwa'
  | 'ios-home-screen'
  | 'manual-pwa'
  | 'already-installed'
  | 'unsupported';


