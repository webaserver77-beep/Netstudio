import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Tv,
  Crown,
  Search,
  Globe,
  Download,
  Film,
  Smartphone
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    language,
    setLanguage,
    t,
    currentUser,
    activeNavTab,
    setActiveNavTab,
    categoryFilter,
    setCategoryFilter,
    setShowSubscriptionModal,
    downloads,
    isStandalone,
    triggerGetApp
  } = useApp();

  const handleCategoryClick = (cat: 'all' | 'movies' | 'series' | 'livetv') => {
    if (cat === 'livetv') {
      setActiveNavTab('livetv');
    } else {
      setActiveNavTab('home');
      setCategoryFilter(cat);
    }
  };

  const isHomeOrLive = activeNavTab === 'home' || activeNavTab === 'livetv';

  return (
    <header className="sticky top-0 z-40 w-full bg-black/95 backdrop-blur-md border-b border-zinc-900 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Tier Header */}
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveNavTab('home')}>
            <div className="flex items-center space-x-1.5">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-black font-black text-xl shadow-none">
                N
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white flex items-center">
                  Net<span className="text-green-500">Studio</span>
                </span>
                <span className="hidden md:inline-block text-[10px] uppercase font-medium tracking-wider text-zinc-400 -mt-1">
                  {t('appTagline')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Shortcut */}
            <button
              onClick={() => setActiveNavTab('search')}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border transition-all flex items-center space-x-2 cursor-pointer ${
                activeNavTab === 'search'
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
              title={t('navSearch')}
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium">{t('navSearch')}</span>
            </button>

            {/* Downloads Shortcut */}
            <button
              onClick={() => setActiveNavTab('downloads')}
              className={`relative p-2 sm:px-3 sm:py-1.5 rounded-xl border transition-all flex items-center space-x-2 cursor-pointer ${
                activeNavTab === 'downloads'
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
              title={t('myDownloads')}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium">{t('myDownloads')}</span>
              {downloads.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 text-black text-[10px] font-bold flex items-center justify-center">
                  {downloads.length}
                </span>
              )}
            </button>

            {/* Get App button when not running in standalone */}
            {!isStandalone && (
              <button
                onClick={() => triggerGetApp()}
                className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all cursor-pointer"
                title="Install NetStudio App (PWA)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Get App</span>
              </button>
            )}

            {/* Language Toggle Button */}
            <button
              onClick={() => setLanguage(language === 'rw' ? 'en' : 'rw')}
              className="px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-white transition-all flex items-center space-x-1.5 text-xs font-semibold cursor-pointer"
              title="Change Language / Hindura Ururimi"
            >
              <Globe className="w-3.5 h-3.5 text-green-500" />
              <span>{language === 'rw' ? '🇷🇼 RW' : '🇬🇧 EN'}</span>
            </button>

            {/* VIP Status / Upgrade */}
            {currentUser.subscription.plan === 'premium' ? (
              <div className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold">
                <Crown className="w-3.5 h-3.5 text-green-400" />
                <span>VIP PASS</span>
              </div>
            ) : (
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="px-3 py-1.5 rounded-xl bg-green-500 hover:bg-green-400 text-black text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('upgradeToVIP')}</span>
                <span className="sm:hidden">VIP</span>
              </button>
            )}

            {/* User Avatar */}
            <button
              onClick={() => setActiveNavTab('account')}
              className={`w-8 h-8 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                activeNavTab === 'account' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-zinc-800 hover:border-zinc-600'
              }`}
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        {/* Top 3 Sticky Category Tabs (Strictly adhering to prompt spec) */}
        {isHomeOrLive && (
          <div className="flex items-center justify-start overflow-x-auto no-scrollbar py-2.5 border-t border-zinc-900/80 gap-2">
            {/* Tab 1: All (Zose) */}
            <button
              onClick={() => handleCategoryClick('all')}
              className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                activeNavTab === 'home' && categoryFilter === 'all'
                  ? 'border-green-500 bg-green-500 text-black font-bold'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {t('tabAll')}
            </button>

            {/* Tab 2: Movies (Filme gusa) */}
            <button
              onClick={() => handleCategoryClick('movies')}
              className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap border flex items-center space-x-1.5 ${
                activeNavTab === 'home' && categoryFilter === 'movies'
                  ? 'border-green-500 bg-green-500 text-black font-bold'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>{t('tabMovies')}</span>
            </button>

            {/* Tab 3: Series (Serie gusa) */}
            <button
              onClick={() => handleCategoryClick('series')}
              className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap border flex items-center space-x-1.5 ${
                activeNavTab === 'home' && categoryFilter === 'series'
                  ? 'border-green-500 bg-green-500 text-black font-bold'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <span>{t('tabSeries')}</span>
            </button>

            {/* Live TV Tab */}
            <button
              onClick={() => handleCategoryClick('livetv')}
              className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap border flex items-center space-x-1.5 ${
                activeNavTab === 'livetv'
                  ? 'border-green-500 bg-green-500 text-black font-bold'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>{t('tabLiveTV')}</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping ml-1" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
