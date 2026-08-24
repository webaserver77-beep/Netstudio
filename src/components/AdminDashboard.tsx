import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MediaItem, LiveChannel, SubscriptionPlanItem, NotificationCategory } from '../types';
import { ChannelLogo } from './ChannelLogo';
import { ContentChoiceModal } from './ContentChoiceModal';
import { MovieFormModal } from './MovieFormModal';
import { SeriesFormModal } from './SeriesFormModal';
import { SeriesStructureModal } from './SeriesStructureModal';
import {
  ShieldCheck,
  Film,
  Tv,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  FilePlus,
  Crown,
  Sparkles,
  Search,
  Check,
  X,
  Play,
  RotateCw,
  Link,
  Layers,
  Gift,
  Tag,
  ToggleLeft,
  ToggleRight,
  MessageCircle,
  AlertTriangle,
  Radio,
  Bell,
  Send,
  Users,
  LogOut,
  Wallet,
  KeyRound,
  Lock,
  Smartphone,
  ExternalLink,
  ArrowRight,
  Inbox,
  CheckCheck,
  Key,
  UserCheck,
  UserX,
  Mail,
  MessageSquare,
  Filter,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    movies,
    channels,
    transactions,
    addMedia,
    updateMedia,
    deleteMedia,
    addChannel,
    updateChannel,
    deleteChannel,
    importM3UPlaylist,
    syncRealIPTVChannels,
    fetchAndImportM3UUrl,
    startPlayback,
    startChannelPlayback,
    subscriptionPlans,
    promotionSettings,
    isPromotionFreeActive,
    addSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    updatePromotionSettings,
    toggleGlobalFreePromotion,
    isSyncingCloud,
    lastCloudSyncTime,
    forceCloudSync,
    language,
    t,
    setActiveNavTab,
    adminToken,
    ownerToken,
    adminLogin,
    adminLogout,
    adminBroadcastNotification,
    notifications,
    navigateTo,
    currentUser,
    realAnalytics,
    activeUsersCount,
    fetchRealAnalytics,
    adminSupportMessages,
    adminUnreadMessagesCount,
    fetchAdminSupportMessages,
    replyAdminSupportMessage,
    deleteAdminSupportMessage,
    grantUserPromotion,
    revokeUserPromotion,
    deleteRegisteredUser,
    purgeRemoteAdmins,
    changeAdminPassword
  } = useApp();

  // Admin Auth Gate State
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Real Registered Users & Live Metrics State
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isPurgingAdmins, setIsPurgingAdmins] = useState(false);
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);
  const [isDeletingUserMap, setIsDeletingUserMap] = useState<Record<string, boolean>>({});

  const handlePurgeRemoteAdmins = async () => {
    setIsPurgingAdmins(true);
    setPurgeFeedback(null);
    try {
      const res = await purgeRemoteAdmins();
      if (res.success) {
        setPurgeFeedback(res.message || `Cleaned rogue admin records. Only the single Master Admin remains.`);
        fetchUsersList();
      } else {
        setPurgeFeedback(res.message || 'Purge operation completed.');
      }
    } catch {
      setPurgeFeedback('Error communicating with server');
    } finally {
      setIsPurgingAdmins(false);
      setTimeout(() => setPurgeFeedback(null), 6000);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user account "${userName}"?`)) return;
    setIsDeletingUserMap((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await deleteRegisteredUser(userId);
      if (res.success) {
        setRegisteredUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {
      // Catch
    } finally {
      setIsDeletingUserMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const fetchUsersList = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${adminToken || ''}`,
          'x-admin-token': adminToken || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setRegisteredUsers(data.users);
        }
      }
    } catch {
      // Silent catch
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchRealAnalytics();
      fetchUsersList();
      fetchAdminSupportMessages();
    }
  }, [adminToken, fetchRealAnalytics, fetchAdminSupportMessages]);

  const [activeTab, setActiveTab] = useState<
    'content' | 'channels' | 'subscriptions' | 'notifications' | 'messages' | 'users' | 'security' | 'transactions'
  >('content');
  const [contentSearch, setContentSearch] = useState<string>('');
  const [channelSearch, setChannelSearch] = useState<string>('');

  // Notification Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastTitleRw, setBroadcastTitleRw] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastMessageRw, setBroadcastMessageRw] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<NotificationCategory>('New Movie');
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'vip' | 'free' | 'selected'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [broadcastActionUrl, setBroadcastActionUrl] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Support Inbox State
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'replied'>('all');
  const [messageSearch, setMessageSearch] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<{ [id: string]: string }>({});
  const [isReplyingMap, setIsReplyingMap] = useState<{ [id: string]: boolean }>({});
  const [isDeletingMsgMap, setIsDeletingMsgMap] = useState<{ [id: string]: boolean }>({});

  // Users & Free Promotion State
  const [userSearch, setUserSearch] = useState('');
  const [promoUserModal, setPromoUserModal] = useState<{
    user: any;
    durationDays: number;
    reason: string;
  } | null>(null);
  const [isGrantingPromo, setIsGrantingPromo] = useState(false);
  const [isRevokingPromoMap, setIsRevokingPromoMap] = useState<{ [id: string]: boolean }>({});

  // Admin Password Change Security State
  const [currentAdminPass, setCurrentAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmNewAdminPass, setConfirmNewAdminPass] = useState('');
  const [showPassInput, setShowPassInput] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Content Modals & CMS State
  const [showChoiceModal, setShowChoiceModal] = useState<boolean>(false);
  const [showMovieFormModal, setShowMovieFormModal] = useState<boolean>(false);
  const [showSeriesFormModal, setShowSeriesFormModal] = useState<boolean>(false);
  const [managingStructureSeries, setManagingStructureSeries] = useState<MediaItem | null>(null);

  // Other Modals
  const [showAddChannelModal, setShowAddChannelModal] = useState<boolean>(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState<boolean>(false);
  const [showM3UModal, setShowM3UModal] = useState<boolean>(false);
  const [m3uInput, setM3uInput] = useState<string>('');
  const [m3uRemoteUrl, setM3uRemoteUrl] = useState<string>('');
  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Edit Modals
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [editingChannel, setEditingChannel] = useState<LiveChannel | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null);

  // Delete Confirmation Modals
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<LiveChannel | null>(null);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlanItem | null>(null);

  // New Channel Form State
  const [newChanName, setNewChanName] = useState('');
  const [newChanCountry, setNewChanCountry] = useState('Rwanda');
  const [newChanCategory, setNewChanCategory] = useState('News');
  const [newChanLogo, setNewChanLogo] = useState('');
  const [newChanUrl, setNewChanUrl] = useState('');
  const [newChanCurrentProg, setNewChanCurrentProg] = useState('');
  const [newChanIsVIP, setNewChanIsVIP] = useState(false);

  // New Plan Form State
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanNameRw, setNewPlanNameRw] = useState('');
  const [newPlanPriceRwf, setNewPlanPriceRwf] = useState(2500);
  const [newPlanPriceUsd, setNewPlanPriceUsd] = useState(2.99);
  const [newPlanBillingPeriod, setNewPlanBillingPeriod] = useState<'monthly' | 'yearly' | 'weekly' | 'custom'>('monthly');
  const [newPlanBadge, setNewPlanBadge] = useState('');
  const [newPlanFeatures, setNewPlanFeatures] = useState('4K UHD, Agasobanuye, All Live TV, Downloads');

  // Promotion Form State
  const [promoMessage, setPromoMessage] = useState(promotionSettings.freePromoMessage || '');
  const [promoMessageRw, setPromoMessageRw] = useState(promotionSettings.freePromoMessageRw || '');
  const [promoTag, setPromoTag] = useState(promotionSettings.promoTag || 'SPECIAL PROMOTION');

  // Real Metrics Calculations
  const realTotalViews =
    realAnalytics?.totalViews ??
    movies.reduce((acc, m) => acc + (Number(m.viewsCount) || 0), 0) +
      channels.reduce((acc, c) => acc + (Number(c.viewsCount) || 0), 0);

  const realBalance =
    realAnalytics?.availableBalance ??
    transactions.reduce((acc, tx) => acc + (Number(tx.amountRwf) || 0), 0);

  const realSubscribers =
    realAnalytics?.totalSubscribers ??
    registeredUsers.filter(
      (u) => u.subscription?.status === 'active' && u.subscription?.plan !== 'free'
    ).length;

  const realActiveUsers = activeUsersCount ?? realAnalytics?.activeUsers ?? 0;

  // Hierarchical Media Calculations
  const totalMoviesCount = movies.filter((m) => m.type === 'movie').length;
  const totalSeriesCount = movies.filter((m) => m.type === 'series').length;
  const totalSeasonsCount = movies
    .filter((m) => m.type === 'series')
    .reduce((sum, s) => sum + (s.seasons?.length || (s.seasonsCount || 0)), 0);
  const totalEpisodesCount = movies
    .filter((m) => m.type === 'series')
    .reduce(
      (sum, s) =>
        sum +
        (s.episodesCount ||
          s.episodes?.length ||
          s.seasons?.reduce((eSum, sea) => eSum + (sea.episodes?.length || 0), 0) ||
          0),
      0
    );
  const totalPartsCount = movies.reduce(
    (sum, m) => sum + (m.parts?.length || (m.partsCount || 0)),
    0
  );

  // Filtered lists
  const filteredMovies = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(contentSearch.toLowerCase()) ||
      (m.titleRw && m.titleRw.toLowerCase().includes(contentSearch.toLowerCase())) ||
      (m.interpreter && m.interpreter.toLowerCase().includes(contentSearch.toLowerCase())) ||
      m.genres.some((g) => g.toLowerCase().includes(contentSearch.toLowerCase()))
  );

  const filteredChannels = channels.filter(
    (ch) =>
      ch.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
      ch.country.toLowerCase().includes(channelSearch.toLowerCase()) ||
      ch.category.toLowerCase().includes(channelSearch.toLowerCase())
  );

  const handleSaveMovie = async (movieData: Partial<MediaItem>) => {
    if (editingMedia) {
      const res = await updateMedia({ ...editingMedia, ...movieData } as MediaItem);
      setFeedbackMsg(res.message || `Movie "${movieData.title}" updated and synced to Firestore!`);
    } else {
      const res = await addMedia(movieData as MediaItem);
      setFeedbackMsg(res.message || `Movie "${movieData.title}" saved and synced to Firestore!`);
    }
    setEditingMedia(null);
    setShowMovieFormModal(false);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleSaveSeries = async (seriesData: Partial<MediaItem>) => {
    if (editingMedia) {
      const res = await updateMedia({ ...editingMedia, ...seriesData } as MediaItem);
      setFeedbackMsg(res.message || `Series "${seriesData.title}" updated and synced to Firestore!`);
    } else {
      const res = await addMedia(seriesData as MediaItem);
      setFeedbackMsg(res.message || `Series "${seriesData.title}" saved and synced to Firestore!`);
    }
    setEditingMedia(null);
    setShowSeriesFormModal(false);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChanName.trim()) return;

    const newChannelItem: LiveChannel = {
      id: `ch_${Date.now()}`,
      name: newChanName,
      logo:
        newChanLogo ||
        'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=200&auto=format&fit=crop&q=80',
      logoUrl: newChanLogo || null,
      country: newChanCountry,
      countryCode: newChanCountry === 'Rwanda' ? 'RW' : 'GLOBAL',
      category: newChanCategory,
      categories: [newChanCategory.toLowerCase()],
      streamUrl:
        newChanUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      quality: 'HD',
      isLive: true,
      currentProgram: newChanCurrentProg || 'Live Stream Broadcast',
      isPremiumOnly: newChanIsVIP
    };

    const res = await addChannel(newChannelItem);
    setFeedbackMsg(res.message || `Live TV "${newChanName}" added and synced!`);
    setShowAddChannelModal(false);
    setNewChanName('');
    setNewChanLogo('');
    setNewChanUrl('');
    setNewChanCurrentProg('');
    setNewChanIsVIP(false);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleUpdateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    const res = await updateChannel(editingChannel);
    setFeedbackMsg(res.message || `Updated "${editingChannel.name}" and synced!`);
    setEditingChannel(null);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;

    const featureList = newPlanFeatures
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    const plan: SubscriptionPlanItem = {
      id: `plan_${Date.now()}`,
      name: newPlanName,
      nameRw: newPlanNameRw || newPlanName,
      priceRwf: Number(newPlanPriceRwf) || 2500,
      priceUsd: Number(newPlanPriceUsd) || 2.99,
      billingPeriod: newPlanBillingPeriod,
      badge: newPlanBadge || undefined,
      features: featureList.length > 0 ? featureList : ['All VIP Features', 'Live TV', 'Downloads'],
      featuresRw: featureList.length > 0 ? featureList : ['Ibyiza byose bya VIP', 'Televiziyo Ako Kanya', 'Gukuramo Filime'],
      isActive: true
    };

    addSubscriptionPlan(plan);
    setFeedbackMsg(`Subscription Plan "${newPlanName}" created!`);
    setShowAddPlanModal(false);
    setNewPlanName('');
    setNewPlanNameRw('');
    setNewPlanBadge('');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleUpdatePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    updateSubscriptionPlan(editingPlan);
    setFeedbackMsg(`Subscription Plan "${editingPlan.name}" updated!`);
    setEditingPlan(null);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleSavePromotionSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePromotionSettings({
      freePromoMessage: promoMessage,
      freePromoMessageRw: promoMessageRw,
      promoTag
    });
    setFeedbackMsg('Promotion settings saved successfully!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleM3UImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uInput.trim()) return;
    const count = importM3UPlaylist(m3uInput);
    setFeedbackMsg(`Imported ${count} live TV channels from M3U playlist!`);
    setM3uInput('');
    setShowM3UModal(false);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleRemoteM3UFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uRemoteUrl.trim()) return;
    setIsFetchingUrl(true);
    const result = await fetchAndImportM3UUrl(m3uRemoteUrl);
    setIsFetchingUrl(false);
    setFeedbackMsg(result.message);
    if (result.success) {
      setM3uRemoteUrl('');
      setShowM3UModal(false);
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleSyncAllRealChannels = () => {
    const count = syncRealIPTVChannels();
    setFeedbackMsg(`Successfully synchronized ${count} live IPTV channels from stream catalog!`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    setIsLoggingIn(true);
    const res = await adminLogin(adminPasswordInput);
    setIsLoggingIn(false);
    if (!res.success) {
      setAdminAuthError(res.message);
    } else {
      setAdminPasswordInput('');
    }
  };

  const handleSendNotificationBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      setFeedbackMsg('Please enter both title and message for the broadcast.');
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    if (broadcastAudience === 'selected' && selectedUserIds.length === 0) {
      setFeedbackMsg('Please select at least one user from the list to receive this broadcast.');
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }

    setIsSendingBroadcast(true);
    const res = await adminBroadcastNotification({
      title: broadcastTitle,
      titleRw: broadcastTitleRw || broadcastTitle,
      message: broadcastMessage,
      messageRw: broadcastMessageRw || broadcastMessage,
      category: broadcastCategory,
      audience: broadcastAudience,
      targetUserIds: broadcastAudience === 'selected' ? selectedUserIds : undefined,
      actionUrl: broadcastActionUrl || undefined
    });
    setIsSendingBroadcast(false);

    if (res.success) {
      setFeedbackMsg(`Broadcast alert delivered to ${broadcastAudience.toUpperCase()} audience!`);
      setBroadcastTitle('');
      setBroadcastTitleRw('');
      setBroadcastMessage('');
      setBroadcastMessageRw('');
      setBroadcastActionUrl('');
      setSelectedUserIds([]);
    } else {
      setFeedbackMsg(`Broadcast error: ${res.message}`);
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleReplyMessage = async (messageId: string) => {
    const replyText = replyTextMap[messageId];
    if (!replyText || !replyText.trim()) return;

    setIsReplyingMap((prev) => ({ ...prev, [messageId]: true }));
    const res = await replyAdminSupportMessage(messageId, replyText.trim());
    setIsReplyingMap((prev) => ({ ...prev, [messageId]: false }));

    if (res.success) {
      setFeedbackMsg('Reply dispatched to user and push notification sent!');
      setReplyTextMap((prev) => ({ ...prev, [messageId]: '' }));
    } else {
      setFeedbackMsg(`Reply error: ${res.message}`);
    }
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message thread?')) return;
    setIsDeletingMsgMap((prev) => ({ ...prev, [messageId]: true }));
    const res = await deleteAdminSupportMessage(messageId);
    setIsDeletingMsgMap((prev) => ({ ...prev, [messageId]: false }));

    if (res.success) {
      setFeedbackMsg('Message deleted successfully.');
    } else {
      setFeedbackMsg(`Error deleting message: ${res.message}`);
    }
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleGrantPromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoUserModal) return;

    setIsGrantingPromo(true);
    const res = await grantUserPromotion(
      promoUserModal.user.id,
      Number(promoUserModal.durationDays) || 30,
      promoUserModal.reason || 'Admin VIP Free Access Grant'
    );
    setIsGrantingPromo(false);

    if (res.success) {
      setFeedbackMsg(`VIP Free Promotion granted to ${promoUserModal.user.name || promoUserModal.user.email}!`);
      setPromoUserModal(null);
      fetchUsersList();
    } else {
      setFeedbackMsg(`Promotion error: ${res.message}`);
    }
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleRevokePromotion = async (userId: string, userName: string) => {
    if (!window.confirm(`Revoke VIP Free promotion for ${userName}?`)) return;

    setIsRevokingPromoMap((prev) => ({ ...prev, [userId]: true }));
    const res = await revokeUserPromotion(userId);
    setIsRevokingPromoMap((prev) => ({ ...prev, [userId]: false }));

    if (res.success) {
      setFeedbackMsg(`VIP Free Promotion revoked for ${userName}.`);
      fetchUsersList();
    } else {
      setFeedbackMsg(`Revocation error: ${res.message}`);
    }
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleChangeAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus(null);

    if (newAdminPass !== confirmNewAdminPass) {
      setPasswordChangeStatus({
        success: false,
        message: 'New password and confirmation do not match.'
      });
      return;
    }

    if (newAdminPass.length < 6) {
      setPasswordChangeStatus({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
      return;
    }

    setIsChangingPass(true);
    const res = await changeAdminPassword(currentAdminPass, newAdminPass);
    setIsChangingPass(false);

    setPasswordChangeStatus({
      success: res.success,
      message: res.message
    });

    if (res.success) {
      setCurrentAdminPass('');
      setNewAdminPass('');
      setConfirmNewAdminPass('');
    }
  };

  // 1. ADMIN AUTHENTICATION LOCK SCREEN IF NOT LOGGED IN
  if (!adminToken && !ownerToken) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fade-in relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide mb-1">
              {t('adminDashboard')}
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Please enter the Master Admin credentials to manage catalog, streams, promotions, and notifications.
            </p>
          </div>

          {adminAuthError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{adminAuthError}</span>
            </div>
          )}

          <form onSubmit={handleAdminAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Master Admin Password</span>
                <span className="text-[10px] text-zinc-500">Security Gate</span>
              </label>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Enter password..."
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>Unlock Admin Studio</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-800 text-center flex items-center justify-between text-[11px] text-zinc-500">
            <button
              onClick={() => setActiveNavTab('home')}
              className="hover:text-zinc-300"
            >
              ← Back to Catalog
            </button>
            <button
              onClick={() => navigateTo('/weba-token-wallet')}
              className="text-amber-400/80 hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              <Wallet className="w-3 h-3" />
              <span>Owner Treasury</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-[#111111] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {t('adminDashboard')}
              </h1>
            </div>
            <div className="flex items-center space-x-2 text-xs text-zinc-400">
              <span className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span>
                  {language === 'rw' ? 'Guhuza Mobile & Laptop bikora ako kanya' : 'Live Sync across Mobile & PC active'}
                </span>
              </span>
              {lastCloudSyncTime && (
                <span className="text-[11px] text-zinc-500 hidden sm:inline">
                  • {language === 'rw' ? 'Biheruka guhuzwa:' : 'Synced:'}{' '}
                  {lastCloudSyncTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigateTo('/weba-token-wallet')}
              className="px-3.5 py-2.5 rounded-2xl border border-green-500/40 bg-green-500/10 text-green-400 font-bold text-xs hover:bg-green-500/20 transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Open Owner Treasury & Financials"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Owner Treasury</span>
            </button>

            <button
              onClick={() => {
                forceCloudSync();
                setFeedbackMsg(language === 'rw' ? 'Guhuza byarangiye neza!' : 'Cloud catalog refreshed & synced!');
                setTimeout(() => setFeedbackMsg(null), 2500);
              }}
              disabled={isSyncingCloud}
              className="px-3 py-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:text-white hover:border-zinc-700 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Force sync now"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin text-amber-400' : 'text-zinc-400'}`} />
              <span>
                {isSyncingCloud
                  ? language === 'rw'
                    ? 'Birahuza...'
                    : 'Syncing...'
                  : language === 'rw'
                  ? 'Huza Ako Kanya'
                  : 'Sync Now'}
              </span>
            </button>

            <button
              onClick={() => setActiveNavTab('home')}
              className="px-3.5 py-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white hover:border-zinc-700 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <span>← {language === 'rw' ? 'Subira Ahabanza' : 'Back to Home'}</span>
            </button>

            <button
              onClick={() => {
                setEditingMedia(null);
                setShowChoiceModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-green-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ {language === 'rw' ? 'Ongeraho Filime / Series' : 'Add Content'}</span>
            </button>

            <button
              onClick={() => setShowAddChannelModal(true)}
              className="px-4 py-2.5 rounded-2xl border border-zinc-700 bg-zinc-900 text-white font-bold text-xs hover:border-zinc-500 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Tv className="w-4 h-4 text-red-500" />
              <span>{t('addChannel')}</span>
            </button>

            <button
              onClick={adminLogout}
              className="px-3 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-colors flex items-center gap-1"
              title="Logout from Admin Studio"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      {/* Analytics KPI Metrics Cards (Real Analytics Engine) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Views */}
        <div className="p-4 rounded-2xl bg-[#111111] border border-zinc-800 space-y-1">
          <div className="text-xs text-zinc-500 font-semibold flex items-center justify-between">
            <span>Total Views</span>
            <span className="text-[10px] text-zinc-500">Live</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {realTotalViews.toLocaleString()} <span className="text-xs text-zinc-400 font-normal">Views</span>
          </div>
          <div className="text-[10px] text-zinc-400">Movies & Live Channels</div>
        </div>

        {/* 2. Available Treasury Balance */}
        <div className="p-4 rounded-2xl bg-[#111111] border border-zinc-800 space-y-1">
          <div className="text-xs text-zinc-500 font-semibold flex items-center justify-between">
            <span>{t('availableBalance') || 'Available Balance'}</span>
            <span className="text-[10px] text-green-400 font-bold">RWF</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-green-400">
            {realBalance.toLocaleString()} <span className="text-xs text-green-500 font-semibold">RWF</span>
          </div>
          <div className="text-[10px] text-zinc-400">MoMo + Airtel + Card</div>
        </div>

        {/* 3. VIP Subscribers */}
        <div className="p-4 rounded-2xl bg-[#111111] border border-zinc-800 space-y-1">
          <div className="text-xs text-zinc-500 font-semibold flex items-center justify-between">
            <span>VIP Subscribers</span>
            <Crown className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400">
            {realSubscribers} <span className="text-xs text-zinc-400 font-normal">Subscribers</span>
          </div>
          <div className="text-[10px] text-zinc-400">Active Paid Members</div>
        </div>

        {/* 4. Active Online Users */}
        <div className="p-4 rounded-2xl bg-[#111111] border border-zinc-800 space-y-1">
          <div className="text-xs text-zinc-500 font-semibold flex items-center justify-between">
            <span>Active Online Users</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {realActiveUsers} <span className="text-xs text-zinc-400 font-normal">Active Users</span>
          </div>
          <div className="text-[10px] text-zinc-400">Real-time session pings</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-zinc-900 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'content', label: 'Movies & Series Catalog', icon: Film, count: movies.length },
          { id: 'channels', label: 'Live TV & IPTV Streams', icon: Tv, count: channels.length },
          { id: 'subscriptions', label: 'Subscription Plans & Free Promotions', icon: Crown, count: subscriptionPlans.length },
          { id: 'notifications', label: 'Broadcast Notifications', icon: Bell, count: notifications.length },
          { id: 'messages', label: 'Support & Inbox', icon: Inbox, count: adminSupportMessages.length, unread: adminUnreadMessagesCount },
          { id: 'users', label: 'Users & VIP Promotions', icon: Users, count: registeredUsers.length },
          { id: 'security', label: 'Admin Security & Password', icon: KeyRound, count: null },
          { id: 'transactions', label: 'MoMo / Card Payments', icon: DollarSign, count: transactions.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-green-500 bg-green-500/15 text-green-400'
                  : 'border-zinc-800 bg-[#111111] text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.unread !== undefined && tab.unread > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                  {tab.unread} new
                </span>
              )}
              {tab.count !== null && (
                <span className="px-1.5 py-0.2 rounded-md bg-zinc-800 text-[10px] text-zinc-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Management Tab (Movies & Series Editing) */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {/* Hierarchical Content Breakdown Summary Bar */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <Film className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-zinc-400">Movies:</span>
                  <span className="font-extrabold text-white">{totalMoviesCount}</span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <Tv className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-400">Series:</span>
                  <span className="font-extrabold text-white">{totalSeriesCount}</span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-zinc-400">Total Seasons:</span>
                  <span className="font-extrabold text-amber-400">{totalSeasonsCount}</span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <Play className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-zinc-400">Total Episodes:</span>
                  <span className="font-extrabold text-purple-400">{totalEpisodesCount}</span>
                </div>
                {totalPartsCount > 0 && (
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400">Multi-Parts:</span>
                    <span className="font-extrabold text-sky-400">{totalPartsCount}</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-zinc-500 font-medium">
                * Episodes and parts belong strictly to their parent series and are <strong className="text-zinc-400">not</strong> counted as standalone movies.
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                placeholder="Search catalog by title, interpreter, or genre..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-400">Showing {filteredMovies.length} of {movies.length} titles</span>
              <button
                onClick={() => {
                  setEditingMedia(null);
                  setShowChoiceModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs transition-colors flex items-center space-x-1 cursor-pointer shadow-lg shadow-green-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Title</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredMovies.map((item) => {
              const isSeries = item.type === 'series';
              const seasonsNum = item.seasons?.length || item.seasonsCount || 1;
              const episodesNum =
                item.episodesCount ||
                item.episodes?.length ||
                item.seasons?.reduce((sum, s) => sum + (s.episodes?.length || 0), 0) ||
                0;

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[#111111] border border-zinc-800 hover:border-zinc-700 transition-all gap-3"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    {item.poster && item.poster.trim() !== '' ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded-xl bg-zinc-900 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-16 rounded-xl bg-zinc-900 flex-shrink-0 flex items-center justify-center text-zinc-600">
                        {isSeries ? <Tv className="w-6 h-6 text-emerald-500" /> : <Film className="w-6 h-6 text-blue-500" />}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">{item.title}</h4>
                        {item.titleRw && item.titleRw !== item.title && (
                          <span className="text-[11px] text-zinc-400 truncate">({item.titleRw})</span>
                        )}
                        {item.isPremiumOnly && (
                          <span className="px-1.5 py-0.5 rounded bg-green-500 text-black text-[9px] font-black uppercase">
                            VIP
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            isSeries ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {item.type}
                        </span>

                        {isSeries && (
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-bold">
                            {seasonsNum} {seasonsNum === 1 ? 'Season' : 'Seasons'} • {episodesNum} {episodesNum === 1 ? 'Episode' : 'Episodes'}
                          </span>
                        )}

                        {item.status && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 text-[9px] font-semibold uppercase">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-1 flex-wrap">
                        <span>{item.year}</span>
                        <span>•</span>
                        <span>⭐ {item.rating}</span>
                        <span>•</span>
                        <span className="text-green-400 font-medium">
                          {item.interpreter ? `Agasobanuye: ${item.interpreter}` : item.genres[0]}
                        </span>
                        {item.videoUrl && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-500 font-mono text-[10px] truncate max-w-[150px]">
                              {item.videoUrl.slice(0, 28)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 self-end sm:self-auto flex-wrap gap-y-1">
                    {/* If Series: Show Manage Structure button */}
                    {isSeries && (
                      <button
                        onClick={() => setManagingStructureSeries(item)}
                        className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center space-x-1 text-xs font-bold cursor-pointer"
                        title="Manage Seasons, Episodes & Parts"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Seasons & Episodes</span>
                      </button>
                    )}

                    {/* Preview button */}
                    <button
                      onClick={() => startPlayback(item)}
                      className="px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-green-400 hover:border-green-500/40 transition-colors flex items-center space-x-1 text-xs cursor-pointer"
                      title="Preview Stream"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span className="hidden md:inline text-[11px]">Preview</span>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setEditingMedia(item);
                        if (isSeries) {
                          setShowSeriesFormModal(true);
                        } else {
                          setShowMovieFormModal(true);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 transition-all flex items-center space-x-1 text-xs font-bold cursor-pointer"
                      title={isSeries ? 'Edit Series Info' : 'Edit Movie Details'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Edit</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => setMediaToDelete(item)}
                      className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-all flex items-center space-x-1 text-xs font-bold cursor-pointer"
                      title={isSeries ? 'Delete Series' : 'Delete Movie'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live TV Channels & IPTV Stream Tab */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
                placeholder="Search TV channels by name, country or category..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSyncAllRealChannels}
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                title="Sync 20+ Real IPTV Channels (Rwanda, EA, BBC, Al Jazeera, Sports, News)"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Sync All Real IPTV</span>
              </button>

              <button
                onClick={() => setShowM3UModal(true)}
                className="px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 text-zinc-300 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <FilePlus className="w-3.5 h-3.5 text-green-400" />
                <span>Import M3U / URL</span>
              </button>

              <button
                onClick={() => setShowAddChannelModal(true)}
                className="px-3 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Channel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredChannels.map((channel) => (
              <div
                key={channel.id}
                className="flex flex-col justify-between p-3.5 rounded-2xl bg-[#111111] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <ChannelLogo
                      channel={channel}
                      size="md"
                      className="w-full h-full rounded-xl"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-bold text-xs sm:text-sm text-white truncate">{channel.name}</h4>
                      {channel.isPremiumOnly && (
                        <span className="px-1.5 py-0.2 rounded bg-green-500 text-black text-[9px] font-black">
                          VIP
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {channel.country} • {channel.category} • <span className="text-zinc-500">{channel.quality}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate mt-1 font-mono">
                      {channel.streamUrl}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs">
                  <span className="text-[11px] text-green-400 font-semibold truncate max-w-[140px]">
                    {channel.currentProgram || 'Live Stream'}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => startChannelPlayback(channel)}
                      className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-green-400 transition-colors cursor-pointer"
                      title="Play Stream"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingChannel({ ...channel })}
                      className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-amber-400 hover:border-amber-500/50 transition-colors cursor-pointer"
                      title="Edit Channel"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setChannelToDelete(channel)}
                      className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete Channel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscriptions & Free Promotions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Global Free Promotion Controller */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#161616] via-[#111111] to-black border-2 border-zinc-800 hover:border-zinc-700 transition-all space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Gift className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    Global 100% Free Promotion Control
                  </h3>
                  {isPromotionFreeActive ? (
                    <span className="px-2 py-0.5 rounded-md bg-green-500 text-black text-[10px] font-black uppercase animate-pulse">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  When enabled, all users can watch all VIP movies, Agasobanuye and Live TV completely free without paying.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newState = !isPromotionFreeActive;
                  toggleGlobalFreePromotion(newState);
                  setFeedbackMsg(
                    newState
                      ? 'Global 100% Free VIP Promotion ACTIVATED! Everything is now free for all users.'
                      : 'Free Promotion disabled. Normal subscription payments resumed.'
                  );
                  setTimeout(() => setFeedbackMsg(null), 3500);
                }}
                className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer shadow-lg ${
                  isPromotionFreeActive
                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                }`}
              >
                {isPromotionFreeActive ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-black" />
                    <span>Free VIP Promo Is ON (Click to Disable)</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-zinc-400" />
                    <span>Enable 100% Free Promotion</span>
                  </>
                )}
              </button>
            </div>

            {/* Promotion Banner Customizer Form */}
            <form onSubmit={handleSavePromotionSettings} className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 text-xs">
              <h4 className="font-bold text-zinc-300 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Customize Promotion Banner Texts</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Promo Badge / Tag</label>
                  <input
                    type="text"
                    value={promoTag}
                    onChange={(e) => setPromoTag(e.target.value)}
                    placeholder="e.g. SPECIAL PROMOTION"
                    className="w-full p-2.5 bg-[#111111] border border-zinc-800 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Promo Message (English)</label>
                  <input
                    type="text"
                    value={promoMessage}
                    onChange={(e) => setPromoMessage(e.target.value)}
                    placeholder="e.g. Special Promo: Everything is 100% free!"
                    className="w-full p-2.5 bg-[#111111] border border-zinc-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Promo Message (Kinyarwanda)</label>
                  <input
                    type="text"
                    value={promoMessageRw}
                    onChange={(e) => setPromoMessageRw(e.target.value)}
                    placeholder="e.g. Kwamamaza: Filime zose ni ubuntu!"
                    className="w-full p-2.5 bg-[#111111] border border-zinc-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer"
                >
                  Save Promotion Details
                </button>
              </div>
            </form>
          </div>

          {/* Subscription Plans List Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Crown className="w-4 h-4 text-green-400" />
                <span>Manage Monetization Subscription Plans</span>
              </h3>
              <p className="text-xs text-zinc-400">Add, edit pricing, or remove subscription options for users</p>
            </div>

            <button
              onClick={() => setShowAddPlanModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </button>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                  plan.isActive
                    ? 'bg-[#111111] border-zinc-800 hover:border-zinc-700'
                    : 'bg-zinc-950/60 border-zinc-900 opacity-60'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-white">{plan.name}</span>
                    {plan.badge ? (
                      <span className="px-2 py-0.5 rounded-md bg-green-500 text-black text-[10px] font-black">
                        {plan.badge}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                        {plan.billingPeriod.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {plan.nameRw && (
                    <div className="text-xs text-zinc-400">Izina: {plan.nameRw}</div>
                  )}

                  <div className="pt-2 border-t border-zinc-800">
                    <div className="text-2xl font-black text-green-400">
                      {plan.priceRwf.toLocaleString()} RWF
                    </div>
                    <div className="text-xs text-zinc-400">${plan.priceUsd.toFixed(2)} USD • {plan.billingPeriod}</div>
                  </div>

                  <div className="space-y-1 text-xs text-zinc-300 pt-2">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      updateSubscriptionPlan({ ...plan, isActive: !plan.isActive });
                      setFeedbackMsg(`Plan "${plan.name}" is now ${!plan.isActive ? 'Active' : 'Inactive'}.`);
                      setTimeout(() => setFeedbackMsg(null), 2500);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                      plan.isActive
                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {plan.isActive ? 'Active Plan' : 'Inactive'}
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setEditingPlan({ ...plan, features: [...plan.features] })}
                      className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPlanToDelete(plan)}
                      className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp Support Info Banner */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white">Customer Care WhatsApp Support:</span>
                <p className="text-zinc-400">+250796119924 (Rwanda lines)</p>
              </div>
            </div>
            <a
              href="https://wa.me/250796119924"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold self-start sm:self-auto"
            >
              Test WhatsApp Link
            </a>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-300">MoMo & Card Payment Logs</h3>
          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#111111] border border-zinc-800"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs sm:text-sm text-white">{tx.userName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-green-500/20 text-green-400 text-[10px] font-bold">
                      {tx.method === 'mtn_momo' ? 'MTN MoMo' : tx.method === 'airtel_money' ? 'Airtel' : 'Card'}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Ref: {tx.referenceId} {tx.phoneNumber ? `• Tel: ${tx.phoneNumber}` : ''}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-sm text-green-400">
                    +{tx.amountRwf.toLocaleString()} RWF
                  </div>
                  <div className="text-[10px] text-zinc-500">{new Date(tx.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Broadcast Notifications Center Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Broadcast Form */}
            <div className="lg:col-span-2 bg-[#111111] border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                <Bell className="w-5 h-5 text-green-400" />
                <h3 className="text-base font-bold text-white">Broadcast New Push Alert</h3>
              </div>

              <form onSubmit={handleSendNotificationBroadcast} className="space-y-4 text-xs">
                {/* Category & Audience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">
                      Notification Category
                    </label>
                    <select
                      value={broadcastCategory}
                      onChange={(e) => setBroadcastCategory(e.target.value as NotificationCategory)}
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="New Movie">New Movie (Film Nshya)</option>
                      <option value="New Series">New Series (Uruhererekane)</option>
                      <option value="Live TV">Live TV Stream</option>
                      <option value="Promotion">Promotion & Discounts</option>
                      <option value="Subscription">Subscription Alert</option>
                      <option value="Maintenance">Maintenance & Updates</option>
                      <option value="System">System Notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">
                      Target Audience
                    </label>
                    <select
                      value={broadcastAudience}
                      onChange={(e) => setBroadcastAudience(e.target.value as any)}
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="all">All Registered Users & Visitors (Everyone)</option>
                      <option value="vip">Active VIP Members Only</option>
                      <option value="free">Free Tier Users Only</option>
                      <option value="selected">Selected Specific Users ({selectedUserIds.length} chosen)</option>
                    </select>
                  </div>
                </div>

                {/* If selected audience, show user picker */}
                {broadcastAudience === 'selected' && (
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">
                        Select Target Recipients ({selectedUserIds.length} of {registeredUsers.length} selected):
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUserIds(registeredUsers.map((u) => u.id))}
                          className="text-[10px] text-green-400 font-bold hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-zinc-600">•</span>
                        <button
                          type="button"
                          onClick={() => setSelectedUserIds([])}
                          className="text-[10px] text-zinc-400 font-bold hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                      {registeredUsers.length === 0 ? (
                        <p className="text-[11px] text-zinc-500 py-2 text-center">No registered users available.</p>
                      ) : (
                        registeredUsers.map((u) => {
                          const isChecked = selectedUserIds.includes(u.id);
                          return (
                            <label
                              key={u.id}
                              className={`flex items-center justify-between p-2 rounded-xl border text-[11px] cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-green-500/10 border-green-500/40 text-white'
                                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUserIds((prev) => [...prev, u.id]);
                                    } else {
                                      setSelectedUserIds((prev) => prev.filter((id) => id !== u.id));
                                    }
                                  }}
                                  className="accent-green-500 rounded"
                                />
                                <span className="font-semibold text-white">{u.name || u.email}</span>
                                <span className="text-[10px] text-zinc-500">({u.email})</span>
                              </div>
                              <span className="text-[10px] text-zinc-400 uppercase font-mono">
                                {u.subscription?.plan === 'premium' ? 'VIP' : 'FREE'}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* English Content */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    English Message
                  </span>
                  <div>
                    <label className="block text-zinc-400 mb-1">Title (English) *</label>
                    <input
                      type="text"
                      required
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g., Fast X (Agasobanuye) is Now Streaming!"
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Message (English) *</label>
                    <textarea
                      required
                      rows={2}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="e.g., Watch Rocky Kimomo's newest translated blockbuster in 4K UHD right now!"
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Kinyarwanda Content */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-green-400">
                    Ubutumwa mu Kinyarwanda (Bilingual)
                  </span>
                  <div>
                    <label className="block text-zinc-400 mb-1">Umutwe (Kinyarwanda)</label>
                    <input
                      type="text"
                      value={broadcastTitleRw}
                      onChange={(e) => setBroadcastTitleRw(e.target.value)}
                      placeholder="e.g., Fast X (Agasobanuye) Yagezeho!"
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Ubutumwa (Kinyarwanda)</label>
                    <textarea
                      rows={2}
                      value={broadcastMessageRw}
                      onChange={(e) => setBroadcastMessageRw(e.target.value)}
                      placeholder="e.g., Irebere film nshya ya Rocky Kimomo muri 4K ifite amashusho meza cyane!"
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Optional Action URL */}
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">
                    Action / Destination Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={broadcastActionUrl}
                    onChange={(e) => setBroadcastActionUrl(e.target.value)}
                    placeholder="e.g., /movie/m1, /livetv, /subscribe"
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-green-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-black text-sm tracking-wide shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSendingBroadcast ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Broadcast to Users Instantly</span>
                </button>
              </form>
            </div>

            {/* Live Preview & Help Card */}
            <div className="space-y-4">
              <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Live Notification Preview
                </h4>
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-green-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-green-400 uppercase">
                      {broadcastCategory}
                    </span>
                    <span className="text-[10px] text-zinc-500">Just now</span>
                  </div>
                  <div className="font-bold text-sm text-white">
                    {broadcastTitle || 'Notification Title Example'}
                  </div>
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    {broadcastMessage || 'This is how your broadcast notification message will appear on user screens and the bell indicator.'}
                  </div>
                  {broadcastActionUrl && (
                    <div className="text-[11px] text-green-400 flex items-center gap-1 font-semibold pt-1">
                      <span>Opens: {broadcastActionUrl}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-5 text-xs text-zinc-400 space-y-2">
                <h4 className="font-bold text-white">Broadcast Delivery Rules</h4>
                <p>• Alerts are sent in real-time to active user sessions and stored in the database.</p>
                <p>• The red bell counter increments immediately for all targeted recipients.</p>
                <p>• Kinyarwanda translations display automatically if the user has selected Kinyarwanda.</p>
              </div>
            </div>
          </div>

          {/* Broadcast History Table */}
          <div className="bg-[#111111] border border-zinc-800 rounded-3xl overflow-hidden p-5 space-y-3">
            <h4 className="text-sm font-bold text-white">Recent Broadcast History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Message</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {notifications.slice(0, 8).map((n) => (
                    <tr key={n.id} className="hover:bg-zinc-900/40">
                      <td className="py-2.5 px-3 font-semibold text-green-400">{n.category}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{n.title}</td>
                      <td className="py-2.5 px-3 text-zinc-300 max-w-xs truncate">{n.message}</td>
                      <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Support & User Messages Inbox Tab */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Inbox className="w-5 h-5 text-green-400" />
                  <span>Support & User Inquiry Inbox</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Read inquiries sent from users, reply directly with instant notifications, and manage tickets.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchAdminSupportMessages}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Refresh Inbox</span>
                </button>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                {(['all', 'unread', 'replied'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setMessageFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer capitalize ${
                      messageFilter === filter
                        ? 'bg-green-500 text-black'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {filter === 'all'
                      ? `All (${adminSupportMessages.length})`
                      : filter === 'unread'
                      ? `Pending Review (${adminSupportMessages.filter((m) => !m.reply).length})`
                      : `Answered (${adminSupportMessages.filter((m) => !!m.reply).length})`}
                  </button>
                ))}
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  placeholder="Search user name, email, subject..."
                  className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            {/* Messages List */}
            {(() => {
              const filtered = adminSupportMessages.filter((m) => {
                if (messageFilter === 'unread' && m.isReplied) return false;
                if (messageFilter === 'replied' && !m.isReplied) return false;
                if (messageSearch) {
                  const q = messageSearch.toLowerCase();
                  return (
                    m.userName.toLowerCase().includes(q) ||
                    m.userEmail.toLowerCase().includes(q) ||
                    m.subject.toLowerCase().includes(q) ||
                    m.message.toLowerCase().includes(q) ||
                    (m.phoneNumber && m.phoneNumber.toLowerCase().includes(q))
                  );
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-zinc-500 space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto opacity-30 text-zinc-400" />
                    <p className="font-bold text-zinc-400 text-sm">No Support Messages Found</p>
                    <p className="text-xs text-zinc-600">
                      {messageFilter === 'unread'
                        ? 'All user inquiries have been addressed!'
                        : 'When users submit questions via Contact & Support, they will appear here.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filtered.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-5 rounded-2xl border space-y-3 transition-colors ${
                        !msg.isReadByAdmin
                          ? 'bg-zinc-950/90 border-green-500/40 shadow-sm shadow-green-500/10'
                          : 'bg-zinc-950 border-zinc-800/80'
                      }`}
                    >
                      {/* Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-2.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-200 font-bold flex items-center justify-center text-xs">
                            {msg.userName ? msg.userName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs sm:text-sm flex items-center space-x-2">
                              <span>{msg.userName || 'NetStudio User'}</span>
                              {!msg.isReadByAdmin && (
                                <span className="px-1.5 py-0.2 rounded-md bg-green-500 text-black text-[9px] font-black uppercase">
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {msg.userEmail} {msg.phoneNumber ? `• Tel: ${msg.phoneNumber}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-zinc-500">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                          {msg.phoneNumber && (
                            <a
                              href={`https://wa.me/${msg.phoneNumber.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(msg.userName)}%2C%20regarding%20your%20NetStudio%20inquiry%3A%20${encodeURIComponent(msg.subject)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-[11px] font-bold inline-flex items-center gap-1 hover:bg-[#25D366]/30 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            disabled={isDeletingMsgMap[msg.id]}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete thread"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Subject & User Message */}
                      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-xs space-y-1">
                        <div className="font-bold text-green-400">Subject: {msg.subject}</div>
                        <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>

                      {/* Admin Previous Reply (if already replied) */}
                      {msg.isReplied && msg.replyText && (
                        <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/30 text-xs text-green-300 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-green-400">
                            <span className="flex items-center space-x-1">
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Official Reply ({msg.repliedBy || 'NetStudio Admin'})</span>
                            </span>
                            {msg.repliedAt && (
                              <span className="text-[10px] text-zinc-500 font-normal">
                                {new Date(msg.repliedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">{msg.replyText}</p>
                        </div>
                      )}

                      {/* Reply Box */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="text"
                          value={replyTextMap[msg.id] || ''}
                          onChange={(e) => setReplyTextMap({ ...replyTextMap, [msg.id]: e.target.value })}
                          placeholder={msg.isReplied ? 'Send follow-up response...' : 'Type official response to user...'}
                          className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
                        />
                        <button
                          onClick={() => handleReplyMessage(msg.id)}
                          disabled={isReplyingMap[msg.id] || !(replyTextMap[msg.id] || '').trim()}
                          className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
                        >
                          {isReplyingMap[msg.id] ? (
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>{msg.isReplied ? 'Send Follow-up' : 'Reply & Notify'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Registered Users & VIP Free Promotion Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <span>Registered Users & VIP Promotions</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Manage viewer accounts, grant free VIP passes, and review user subscription statuses.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
                  />
                </div>
                <button
                  onClick={fetchUsersList}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                  title="Refresh Users"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handlePurgeRemoteAdmins}
                  disabled={isPurgingAdmins}
                  className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                  title="Delete all remote or browser-created admin accounts and enforce Single Master Admin"
                >
                  <ShieldAlert className={`w-3.5 h-3.5 ${isPurgingAdmins ? 'animate-spin' : ''}`} />
                  <span>{isPurgingAdmins ? 'Purging...' : 'Purge Remote Admins'}</span>
                </button>
              </div>
            </div>

            {purgeFeedback && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-300 flex items-center justify-between">
                <span>{purgeFeedback}</span>
                <button onClick={() => setPurgeFeedback(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Phone / Contact</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Subscription</th>
                    <th className="py-3 px-3">VIP Free Promotion</th>
                    <th className="py-3 px-3 text-right">Promotion & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {registeredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-600" />
                        <p className="font-semibold text-zinc-400">0 Registered Users Found</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                          Unregistered visitors browse as Guests by default until creating an account.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    registeredUsers
                      .filter((u) => {
                        if (!userSearch) return true;
                        const q = userSearch.toLowerCase();
                        return (
                          (u.name && u.name.toLowerCase().includes(q)) ||
                          (u.email && u.email.toLowerCase().includes(q)) ||
                          (u.phoneNumber && u.phoneNumber.toLowerCase().includes(q))
                        );
                      })
                      .map((u) => {
                        const hasActivePromo =
                          u.freePromotion &&
                          u.freePromotion.isActive &&
                          new Date(u.freePromotion.expiresAt) > new Date();

                        return (
                          <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-white">{u.name || 'NetStudio User'}</div>
                              <div className="text-[11px] text-zinc-500">{u.email}</div>
                            </td>
                            <td className="py-3 px-3 font-mono text-zinc-300">
                              {u.phoneNumber || 'N/A'}
                            </td>
                            <td className="py-3 px-3 uppercase text-[10px] font-bold text-amber-400">
                              {u.role || 'user'}
                            </td>
                            <td className="py-3 px-3 text-white font-semibold">
                              {u.subscription?.planName ||
                                (u.subscription?.plan === 'premium' ? 'VIP Pass' : 'Free Tier')}
                            </td>
                            <td className="py-3 px-3">
                              {hasActivePromo ? (
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-500/20 text-green-400 border border-green-500/40 inline-flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>Active Free VIP</span>
                                  </span>
                                  <div className="text-[10px] text-zinc-400">
                                    Expires: {new Date(u.freePromotion.expiresAt).toLocaleDateString()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-zinc-500 text-[11px]">None</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {hasActivePromo ? (
                                  <button
                                    onClick={() => handleRevokePromotion(u.id, u.name || u.email)}
                                    disabled={isRevokingPromoMap[u.id]}
                                    className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                                  >
                                    <UserX className="w-3 h-3" />
                                    <span>Revoke VIP</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setPromoUserModal({
                                        user: u,
                                        durationDays: 30,
                                        reason: 'Admin VIP Free Access Grant'
                                      })
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-green-500/15 hover:bg-green-500/25 border border-green-500/40 text-green-400 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Gift className="w-3 h-3" />
                                    <span>Grant Free VIP</span>
                                  </button>
                                )}

                                {u.phoneNumber ? (
                                  <a
                                    href={`https://wa.me/${u.phoneNumber.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] font-semibold text-[11px] inline-flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    <span>WhatsApp</span>
                                  </a>
                                ) : null}

                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                                  disabled={isDeletingUserMap[u.id]}
                                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Delete User Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Admin Security & Password Change Tab */}
      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-zinc-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Change Admin Master Password</h3>
                <p className="text-xs text-zinc-400">
                  Update the password required to unlock and access the NetStudio Admin Dashboard.
                </p>
              </div>
            </div>

            {passwordChangeStatus && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 ${
                  passwordChangeStatus.success
                    ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                    : 'bg-red-500/15 border border-red-500/30 text-red-400'
                }`}
              >
                {passwordChangeStatus.success ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{passwordChangeStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangeAdminPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Current Admin Password *</label>
                <div className="relative">
                  <input
                    type={showPassInput ? 'text' : 'password'}
                    required
                    value={currentAdminPass}
                    onChange={(e) => setCurrentAdminPass(e.target.value)}
                    placeholder="Enter current master password..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassInput(!showPassInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showPassInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">New Admin Password *</label>
                <input
                  type={showPassInput ? 'text' : 'password'}
                  required
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  placeholder="Min 6 characters..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Confirm New Password *</label>
                <input
                  type={showPassInput ? 'text' : 'password'}
                  required
                  value={confirmNewAdminPass}
                  onChange={(e) => setConfirmNewAdminPass(e.target.value)}
                  placeholder="Re-enter new password..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPass || !currentAdminPass || !newAdminPass}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-500/20"
                >
                  {isChangingPass ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  <span>Save New Admin Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- CREATE SUBSCRIPTION PLAN MODAL ---------------- */}
      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#111111] border border-zinc-800 rounded-3xl p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Crown className="w-5 h-5 text-green-400" />
                <span>Create New Subscription Plan</span>
              </h3>
              <button onClick={() => setShowAddPlanModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Plan Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="e.g. Weekly VIP Pass"
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Plan Name (Kinyarwanda)</label>
                  <input
                    type="text"
                    value={newPlanNameRw}
                    onChange={(e) => setNewPlanNameRw(e.target.value)}
                    placeholder="e.g. Icyumweru kuri VIP"
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Price in RWF *</label>
                  <input
                    type="number"
                    required
                    value={newPlanPriceRwf}
                    onChange={(e) => setNewPlanPriceRwf(Number(e.target.value))}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Price in USD</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPlanPriceUsd}
                    onChange={(e) => setNewPlanPriceUsd(Number(e.target.value))}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Billing Period</label>
                  <select
                    value={newPlanBillingPeriod}
                    onChange={(e) => setNewPlanBillingPeriod(e.target.value as any)}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white cursor-pointer"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Badge (Optional)</label>
                <input
                  type="text"
                  value={newPlanBadge}
                  onChange={(e) => setNewPlanBadge(e.target.value)}
                  placeholder="e.g. POPULAR, -20%, BEST VALUE"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Features (comma separated)</label>
                <input
                  type="text"
                  value={newPlanFeatures}
                  onChange={(e) => setNewPlanFeatures(e.target.value)}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddPlanModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-extrabold"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- EDIT SUBSCRIPTION PLAN MODAL ---------------- */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#111111] border border-zinc-800 rounded-3xl p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <span>Edit Plan: {editingPlan.name}</span>
              </h3>
              <button onClick={() => setEditingPlan(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlanSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Plan Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Plan Name (Kinyarwanda)</label>
                  <input
                    type="text"
                    value={editingPlan.nameRw || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, nameRw: e.target.value })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Price in RWF *</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.priceRwf}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceRwf: Number(e.target.value) })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Price in USD</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.priceUsd}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceUsd: Number(e.target.value) })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Billing Period</label>
                  <select
                    value={editingPlan.billingPeriod}
                    onChange={(e) => setEditingPlan({ ...editingPlan, billingPeriod: e.target.value as any })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white cursor-pointer"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Badge</label>
                <input
                  type="text"
                  value={editingPlan.badge || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value || undefined })}
                  placeholder="e.g. POPULAR, BEST VALUE"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Features (comma separated)</label>
                <input
                  type="text"
                  value={editingPlan.features.join(', ')}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: e.target.value.split(',').map((f) => f.trim()).filter(Boolean)
                    })
                  }
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="planActiveCheck"
                  checked={editingPlan.isActive}
                  onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                  className="w-4 h-4 accent-green-500 rounded"
                />
                <label htmlFor="planActiveCheck" className="text-zinc-300 font-semibold cursor-pointer">
                  Plan is Active and Visible to Users
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-extrabold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- DELETE PLAN CONFIRMATION MODAL ---------------- */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#111111] border border-red-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Subscription Plan</h3>
                <p className="text-xs text-zinc-400">Permanently removes this plan from options</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="font-extrabold text-sm text-white">{planToDelete.name}</div>
              <div className="text-xs text-green-400 font-bold mt-1">
                {planToDelete.priceRwf.toLocaleString()} RWF (${planToDelete.priceUsd.toFixed(2)})
              </div>
            </div>

            <p className="text-xs text-zinc-300">
              Are you sure you want to delete <span className="font-bold text-white">"{planToDelete.name}"</span>?
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSubscriptionPlan(planToDelete.id);
                  setFeedbackMsg(`Plan "${planToDelete.name}" deleted.`);
                  setPlanToDelete(null);
                  setTimeout(() => setFeedbackMsg(null), 3000);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black"
              >
                Yes, Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ---------------- EDIT LIVE CHANNEL MODAL ---------------- */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-[#111111] border border-zinc-800 rounded-3xl p-6 overflow-y-auto max-h-[90vh] my-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Edit Channel: <span className="text-red-500">{editingChannel.name}</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">Modify live stream URL, logo or program info</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingChannel(null)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateChannelSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Channel Name *</label>
                <input
                  type="text"
                  required
                  value={editingChannel.name}
                  onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    value={editingChannel.country}
                    onChange={(e) => setEditingChannel({ ...editingChannel, country: e.target.value })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    value={editingChannel.category}
                    onChange={(e) => setEditingChannel({ ...editingChannel, category: e.target.value })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Stream URL (.m3u8 / Direct Stream)</label>
                <input
                  type="text"
                  value={editingChannel.streamUrl}
                  onChange={(e) => setEditingChannel({ ...editingChannel, streamUrl: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Logo URL</label>
                <input
                  type="text"
                  value={editingChannel.logo}
                  onChange={(e) => setEditingChannel({ ...editingChannel, logo: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chanVipCheck"
                  checked={editingChannel.isPremiumOnly || false}
                  onChange={(e) => setEditingChannel({ ...editingChannel, isPremiumOnly: e.target.checked })}
                  className="w-4 h-4 accent-green-500 rounded"
                />
                <label htmlFor="chanVipCheck" className="text-zinc-300 font-semibold cursor-pointer">
                  Requires VIP Subscription
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingChannel;
                    setEditingChannel(null);
                    setChannelToDelete(target);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-bold text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Channel</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingChannel(null)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-extrabold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Channel</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- DELETE MOVIE CONFIRMATION MODAL ---------------- */}
      {mediaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#111111] border border-red-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Movie / Title</h3>
                <p className="text-xs text-zinc-400">Permanently removes from catalog across all devices</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center space-x-3">
              {mediaToDelete.poster ? (
                <img
                  src={mediaToDelete.poster}
                  alt={mediaToDelete.title}
                  className="w-12 h-16 object-cover rounded-xl bg-zinc-900 flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-16 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600 flex-shrink-0">
                  <Film className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-white truncate">{mediaToDelete.title}</h4>
                {mediaToDelete.titleRw && (
                  <p className="text-xs text-zinc-400 truncate">{mediaToDelete.titleRw}</p>
                )}
                <div className="flex items-center space-x-2 text-[11px] text-zinc-500 mt-1">
                  <span>{mediaToDelete.year}</span>
                  <span>•</span>
                  <span>{mediaToDelete.type.toUpperCase()}</span>
                  {mediaToDelete.interpreter && (
                    <>
                      <span>•</span>
                      <span className="text-green-400 font-semibold">{mediaToDelete.interpreter}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-300">
              Are you sure you want to delete <span className="font-bold text-white">"{mediaToDelete.title}"</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setMediaToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = mediaToDelete.id;
                  const title = mediaToDelete.title;
                  const res = await deleteMedia(id);
                  setFeedbackMsg(res.message || `"${title}" deleted and removed across all devices.`);
                  setMediaToDelete(null);
                  setTimeout(() => setFeedbackMsg(null), 3500);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Movie</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DELETE LIVE CHANNEL CONFIRMATION MODAL ---------------- */}
      {channelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#111111] border border-red-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Live Channel</h3>
                <p className="text-xs text-zinc-400">Permanently removes TV stream</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <ChannelLogo channel={channelToDelete} size="md" className="w-full h-full rounded-xl" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-white truncate">{channelToDelete.name}</h4>
                <p className="text-xs text-zinc-400">{channelToDelete.country} • {channelToDelete.category}</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setChannelToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = channelToDelete.id;
                  const name = channelToDelete.name;
                  const res = await deleteChannel(id);
                  setFeedbackMsg(res.message || `Live TV channel "${name}" deleted across all devices.`);
                  setChannelToDelete(null);
                  setTimeout(() => setFeedbackMsg(null), 3500);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Channel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- NEW CONTENT MANAGEMENT MODALS ---------------- */}
      {/* 1. Choice Modal (Movie vs Series) */}
      <ContentChoiceModal
        isOpen={showChoiceModal}
        onClose={() => setShowChoiceModal(false)}
        onSelectMovie={() => {
          setEditingMedia(null);
          setShowMovieFormModal(true);
        }}
        onSelectSeries={() => {
          setEditingMedia(null);
          setShowSeriesFormModal(true);
        }}
      />

      {/* 2. Movie Form Modal (Simple & Clean: Title, Description, Poster, Stream URL, Interpreter, Duration, Status, etc.) */}
      <MovieFormModal
        isOpen={showMovieFormModal}
        onClose={() => {
          setShowMovieFormModal(false);
          setEditingMedia(null);
        }}
        editingMovie={editingMedia && editingMedia.type === 'movie' ? editingMedia : null}
        onSave={handleSaveMovie}
        onTestPlayback={(item) => startPlayback(item)}
      />

      {/* 3. Series Form Modal */}
      <SeriesFormModal
        isOpen={showSeriesFormModal}
        onClose={() => {
          setShowSeriesFormModal(false);
          setEditingMedia(null);
        }}
        editingSeries={editingMedia && editingMedia.type === 'series' ? editingMedia : null}
        onSave={handleSaveSeries}
      />

      {/* 4. Series Structure & Episode / Multi-Part Management Modal */}
      {managingStructureSeries && (
        <SeriesStructureModal
          isOpen={Boolean(managingStructureSeries)}
          onClose={() => setManagingStructureSeries(null)}
          series={managingStructureSeries}
          catalog={movies}
          onSaveSeries={(updated) => {
            updateMedia(updated);
            setManagingStructureSeries(updated);
            setFeedbackMsg(`Series structure for "${updated.title}" updated successfully!`);
            setTimeout(() => setFeedbackMsg(null), 3000);
          }}
          onTestPlayback={(m, ep) => startPlayback(m, ep)}
        />
      )}

      {/* ---------------- ADD CHANNEL MODAL ---------------- */}
      {showAddChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#111111] border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Live TV Channel</h3>
              <button onClick={() => setShowAddChannelModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Channel Name</label>
                <input
                  type="text"
                  required
                  value={newChanName}
                  onChange={(e) => setNewChanName(e.target.value)}
                  placeholder="e.g. Flash TV Rwanda"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    value={newChanCountry}
                    onChange={(e) => setNewChanCountry(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    value={newChanCategory}
                    onChange={(e) => setNewChanCategory(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Stream URL (HLS / .m3u8)</label>
                <input
                  type="text"
                  value={newChanUrl}
                  onChange={(e) => setNewChanUrl(e.target.value)}
                  placeholder="https://.../live.m3u8"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddChannelModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold"
                >
                  Save Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- M3U PLAYLIST & REMOTE URL MODAL ---------------- */}
      {showM3UModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#111111] border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <FilePlus className="w-5 h-5 text-green-400" />
                <span>Import IPTV M3U Resources</span>
              </h3>
              <button onClick={() => setShowM3UModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Remote M3U URL Fetch */}
            <form onSubmit={handleRemoteM3UFetch} className="space-y-2 p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
              <label className="block text-xs font-bold text-white flex items-center space-x-1.5">
                <Link className="w-3.5 h-3.5 text-amber-400" />
                <span>Option 1: Load from Web URL (.m3u / .m3u8 playlist)</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={m3uRemoteUrl}
                  onChange={(e) => setM3uRemoteUrl(e.target.value)}
                  placeholder="https://iptv-org.github.io/iptv/countries/rw.m3u"
                  className="flex-1 p-2.5 bg-[#111111] border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-green-500"
                />
                <button
                  type="submit"
                  disabled={isFetchingUrl}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs disabled:opacity-50 cursor-pointer"
                >
                  {isFetchingUrl ? 'Fetching...' : 'Fetch & Load'}
                </button>
              </div>
            </form>

            {/* Paste Raw Text M3U */}
            <form onSubmit={handleM3UImport} className="space-y-3">
              <label className="block text-xs font-bold text-white flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-green-400" />
                <span>Option 2: Paste Raw M3U Content</span>
              </label>
              <textarea
                value={m3uInput}
                onChange={(e) => setM3uInput(e.target.value)}
                placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-logo=&quot;https://...&quot; group-title=&quot;News&quot;, Rwanda TV Live&#10;https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8"
                rows={5}
                className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
              />
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowM3UModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 text-xs hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs cursor-pointer"
                >
                  Import Channels
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- GRANT VIP FREE PROMOTION MODAL ---------------- */}
      {promoUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#111111] border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Grant Free VIP Access</h3>
                  <p className="text-[11px] text-zinc-400">
                    To: <span className="text-green-400 font-semibold">{promoUserModal.user.name || promoUserModal.user.email}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPromoUserModal(null)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantPromotionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Promotion Duration (Days) *</label>
                <select
                  value={promoUserModal.durationDays}
                  onChange={(e) =>
                    setPromoUserModal({ ...promoUserModal, durationDays: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                >
                  <option value={7}>7 Days (1 Week VIP Pass)</option>
                  <option value={14}>14 Days (2 Weeks VIP Pass)</option>
                  <option value={30}>30 Days (1 Month VIP Pass)</option>
                  <option value={60}>60 Days (2 Months VIP Pass)</option>
                  <option value={90}>90 Days (3 Months VIP Pass)</option>
                  <option value={180}>180 Days (6 Months VIP Pass)</option>
                  <option value={365}>365 Days (1 Year Full VIP Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Reason / Note for Grant</label>
                <input
                  type="text"
                  value={promoUserModal.reason}
                  onChange={(e) =>
                    setPromoUserModal({ ...promoUserModal, reason: e.target.value })
                  }
                  placeholder="e.g., Customer Loyalty, Beta Tester, Free VIP Giveaway"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/30 text-[11px] text-green-300 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Immediate VIP Activation</span>
                </p>
                <p>
                  The user will immediately gain full streaming access without payment barriers, and receive an instant notification in their account.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPromoUserModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 text-xs font-bold hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGrantingPromo}
                  className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black text-xs font-black cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {isGrantingPromo ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Activate Free VIP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
