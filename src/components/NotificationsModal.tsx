import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Sparkles,
  Film,
  Tv,
  CreditCard,
  Crown,
  ShieldAlert,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import { NotificationCategory, UserNotification } from '../types';

export const NotificationsModal: React.FC = () => {
  const {
    language,
    t,
    notifications,
    unreadNotificationsCount,
    showNotificationsModal,
    setShowNotificationsModal,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    fetchNotifications,
    setSelectedDetailMedia,
    movies,
    setActiveNavTab,
    setShowSubscriptionModal
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  if (!showNotificationsModal) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    return true;
  });

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'New Movie':
      case 'New Series':
        return <Film className="w-4 h-4 text-green-400" />;
      case 'Live TV':
        return <Tv className="w-4 h-4 text-emerald-400" />;
      case 'Payment':
        return <CreditCard className="w-4 h-4 text-yellow-400" />;
      case 'Subscription':
      case 'Promotion':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'Maintenance':
      case 'System':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = Date.now();
      const diff = now - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return language === 'rw' ? 'Ako kanya' : 'Just now';
      if (mins < 60) return `${mins}m ${language === 'rw' ? 'bishize' : 'ago'}`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ${language === 'rw' ? 'zishize' : 'ago'}`;
      const days = Math.floor(hours / 24);
      return `${days}d ${language === 'rw' ? 'bishize' : 'ago'}`;
    } catch {
      return dateStr;
    }
  };

  const handleActionClick = (notif: UserNotification) => {
    markNotificationAsRead(notif.id);
    setShowNotificationsModal(false);

    if (notif.actionUrl) {
      if (notif.actionUrl.startsWith('/movie/')) {
        const movieId = notif.actionUrl.replace('/movie/', '');
        const movie = movies.find((m) => m.id === movieId);
        if (movie) setSelectedDetailMedia(movie);
      } else if (notif.actionUrl === '/livetv') {
        setActiveNavTab('livetv');
      } else if (notif.actionUrl === '/subscribe') {
        setShowSubscriptionModal(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 relative">
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {t('notifications')}
              </h2>
              <p className="text-xs text-neutral-400">
                {language === 'rw'
                  ? `${notifications.length} amatangazo muri rusange`
                  : `${notifications.length} total alerts`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadNotificationsCount > 0 && (
              <button
                onClick={() => markAllNotificationsAsRead()}
                className="text-xs text-green-400 hover:text-green-300 font-medium flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors"
                title={t('markAllRead')}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('markAllRead')}</span>
              </button>
            )}
            <button
              onClick={() => setShowNotificationsModal(false)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-green-500 text-black font-semibold'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {t('allNotifications')} ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                activeFilter === 'unread'
                  ? 'bg-green-500 text-black font-semibold'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {t('unreadOnly')} ({unreadNotificationsCount})
            </button>
          </div>

          <button
            onClick={() => fetchNotifications()}
            className="text-neutral-400 hover:text-white text-xs underline"
          >
            {language === 'rw' ? 'Kuvugurura' : 'Refresh'}
          </button>
        </div>

        {/* Notification Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 p-2 sm:p-3 space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-neutral-800/80 flex items-center justify-center text-neutral-500">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                {t('noNotifications')}
              </h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                {t('noNotificationsDesc')}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => notif.actionUrl && handleActionClick(notif)}
                className={`p-3.5 rounded-xl transition-all border ${
                  !notif.isRead
                    ? 'bg-neutral-800/60 border-green-500/30 shadow-sm'
                    : 'bg-neutral-900/40 border-neutral-800/50 hover:bg-neutral-800/30'
                } ${notif.actionUrl ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700/50 shrink-0 mt-0.5">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-green-400">
                        {notif.category}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(notif.createdAt)}</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-white leading-snug mb-1">
                      {language === 'rw' && notif.titleRw ? notif.titleRw : notif.title}
                    </h4>

                    <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                      {language === 'rw' && notif.messageRw ? notif.messageRw : notif.message}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-800/40">
                      {notif.actionUrl ? (
                        <span className="text-xs font-medium text-green-400 flex items-center gap-1 hover:underline">
                          {language === 'rw' ? 'Fungura ako kanya' : 'View now'}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(notif.id);
                            }}
                            className="text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors"
                          >
                            {language === 'rw' ? 'Birasomwe' : 'Mark read'}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="text-neutral-500 hover:text-red-400 p-1 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
