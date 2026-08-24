import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Crown,
  Download,
  Bookmark,
  History,
  Globe,
  Trash2,
  Play,
  Check,
  Smartphone,
  CreditCard,
  LogOut,
  Sparkles,
  ChevronRight,
  UserPlus,
  LogIn,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    switchUserRole,
    toggleSubscription,
    language,
    setLanguage,
    t,
    watchlist,
    continueWatching,
    downloads,
    deleteDownload,
    movies,
    startPlayback,
    setSelectedDetailMedia,
    setShowSubscriptionModal,
    setShowAuthModal,
    registerUser,
    loginUser,
    logoutUser,
    setActiveNavTab,
    isStandalone,
    triggerGetApp,
    setShowInstallGuideModal
  } = useApp();

  const isGuest = !currentUser.isLoggedIn || currentUser.isGuest || currentUser.id === 'guest_visitor';

  // Form states for inline auth in account page
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const [activeAccountTab, setActiveAccountTab] = useState<'profile' | 'downloads' | 'watchlist' | 'history'>('profile');

  const watchlistItems = movies.filter((m) => watchlist.includes(m.id));

  const handleInlineAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'register') {
        if (!name.trim()) {
          setAuthError(language === 'rw' ? 'Nyamuneka andika amazina yawe.' : 'Please enter your full name.');
          setIsSubmitting(false);
          return;
        }
        if (!emailOrPhone.trim()) {
          setAuthError(language === 'rw' ? 'Nyamuneka andika imeli cyangwa numero ya telefone.' : 'Please enter your email or phone number.');
          setIsSubmitting(false);
          return;
        }
        if (!password || password.length < 4) {
          setAuthError(language === 'rw' ? 'Ijambo ry\'ibanga rigomba kugira byibuze inyuguti 4.' : 'Password must be at least 4 characters.');
          setIsSubmitting(false);
          return;
        }

        const isPhone = !emailOrPhone.includes('@');
        const email = isPhone ? `${emailOrPhone.replace(/[^0-9]/g, '')}@netstudio.rw` : emailOrPhone;
        const phone = isPhone ? emailOrPhone : undefined;

        const res = await registerUser(name, email, phone, password);
        if (res.success) {
          setAuthSuccess(
            language === 'rw'
              ? 'Konti yawe yafunguwe neza! Ubu winjiye muri NetStudio.'
              : 'Account created successfully! You are now signed in.'
          );
          setName('');
          setEmailOrPhone('');
          setPassword('');
        } else {
          setAuthError(res.message);
        }
      } else {
        if (!emailOrPhone.trim()) {
          setAuthError(language === 'rw' ? 'Nyamuneka andika imeli cyangwa numero ya telefone.' : 'Please enter your email or phone number.');
          setIsSubmitting(false);
          return;
        }
        if (!password) {
          setAuthError(language === 'rw' ? 'Nyamuneka andika ijambo ry\'ibanga.' : 'Please enter your password.');
          setIsSubmitting(false);
          return;
        }

        const res = await loginUser(emailOrPhone, password);
        if (res.success) {
          setAuthSuccess(
            language === 'rw'
              ? 'Winjiye muri konti yawe neza!'
              : 'Signed in successfully!'
          );
          setEmailOrPhone('');
          setPassword('');
        } else {
          setAuthError(res.message);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. Profile / Guest Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-[#111111] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-green-500/40 flex-shrink-0 bg-zinc-900">
              <img
                src={
                  currentUser.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                }
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentUser.name}
                </h1>
                {currentUser.subscription.plan === 'premium' ? (
                  <span className="px-2 py-0.5 rounded-lg bg-green-500 text-black text-[11px] font-black uppercase flex items-center space-x-1">
                    <Crown className="w-3 h-3" />
                    <span>VIP</span>
                  </span>
                ) : isGuest ? (
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-amber-400 text-[11px] font-bold border border-amber-500/30">
                    {language === 'rw' ? 'UMUSHYITSI' : 'GUEST'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 text-[11px] font-bold">
                    FREE TIER
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                {isGuest
                  ? (language === 'rw'
                      ? 'Konti y\'umushyitsi - Ushobora kureba filime z\'ubuntu nta konti'
                      : 'Guest Visitor - You can watch standard movies freely without an account')
                  : currentUser.email || currentUser.phoneNumber}
              </p>
              
              {!isGuest && (
                <div className="flex items-center space-x-3 mt-2">
                  <span className="text-[11px] text-zinc-400">
                    Status: <strong className="text-green-400 font-semibold">{currentUser.subscription.plan === 'premium' ? 'VIP Active' : 'Free Member'}</strong>
                  </span>
                  <span className="text-zinc-700">•</span>
                  <button
                    onClick={logoutUser}
                    className="text-[11px] text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>{language === 'rw' ? 'Sohoka muri Konti' : 'Sign Out'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Upgrade to VIP or Open Auth */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {currentUser.subscription.plan !== 'premium' ? (
              <button
                id="btn-account-upgrade-vip"
                onClick={() => setShowSubscriptionModal(true)}
                className="px-5 py-3 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs sm:text-sm transition-transform active:scale-95 flex items-center justify-center space-x-2 cursor-pointer border border-green-400"
              >
                <Crown className="w-4 h-4" />
                <span>{t('upgradeToVIP')}</span>
              </button>
            ) : (
              <div className="px-4 py-2.5 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>{language === 'rw' ? 'VIP Ifunguye' : 'Active VIP Pass'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Account Creation & Sign In Section (For Guests) */}
      {isGuest && (
        <div id="section-create-account" className="p-6 sm:p-8 rounded-3xl bg-[#111111] border-2 border-green-500/40 shadow-none space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-green-500/15 text-green-400">
                  {authMode === 'register' ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {authMode === 'register'
                    ? (language === 'rw' ? 'Kora Konti ya NetStudio' : 'Create an Account')
                    : (language === 'rw' ? 'Injira muri Konti Yawe' : 'Sign In to Your Account')}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {language === 'rw'
                  ? 'Fungura konti ukoresheje amazina, imeli cyangwa numero ya telefone (MTN / Airtel), n\'ijambo ry\'ibanga kugira ngo ugure VIP kandi ubike filime ukunda.'
                  : 'Register with your name, email or phone number (MTN / Airtel), and password to save watch history and upgrade to VIP passes.'}
              </p>
            </div>

            {/* Toggle between Register & Sign In */}
            <div className="flex items-center p-1 bg-zinc-950 rounded-2xl border border-zinc-800 self-start sm:self-auto flex-shrink-0">
              <button
                type="button"
                id="btn-tab-create-account"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  authMode === 'register' ? 'bg-green-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {language === 'rw' ? 'Kora Konti' : 'Create Account'}
              </button>
              <button
                type="button"
                id="btn-tab-sign-in"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  authMode === 'login' ? 'bg-green-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {language === 'rw' ? 'Kwinjira' : 'Sign In'}
              </button>
            </div>
          </div>

          {/* Guest Watching Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start space-x-3 text-xs text-zinc-300">
            <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">
                {language === 'rw'
                  ? 'Kureba filime utari muri konti biremewe!'
                  : 'Free Guest Watching Enabled!'}
              </span>
              <span className="text-zinc-400">
                {language === 'rw'
                  ? 'Ushobora gukanda kuri filime cyangwa TV zikora ako kanya ukareba nta konti. Kora konti kugira ngo ugure VIP pass no kubika urutonde rwawe.'
                  : 'You can watch standard movies, trailers, and live channels right now without an account. Create an account to activate VIP passes and sync favorites.'}
              </span>
            </div>
          </div>

          {/* Feedback messages */}
          {authError && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Interactive Form with Name, Email/Phone, Password */}
          <form onSubmit={handleInlineAuth} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {authMode === 'register' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    {language === 'rw' ? 'Amazina Yombi (Full Name)' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      id="input-account-name"
                      type="text"
                      required
                      placeholder={language === 'rw' ? 'urugero: Patrick Mugisha' : 'e.g., Patrick Mugisha'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className={authMode === 'register' ? 'sm:col-span-1' : 'sm:col-span-2'}>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  {language === 'rw' ? 'Imeli cyangwa Numero ya Telefone' : 'Email or Phone Number'}
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="input-account-email-or-phone"
                    type="text"
                    required
                    placeholder={language === 'rw' ? '078XXXXXXX cyangwa imeli@...' : '078XXXXXXX or email@...'}
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {language === 'rw' ? 'Numero ya MTN MoMo cyangwa Airtel Money irakora.' : 'Accepts MTN MoMo (078/079) or Airtel (073/072) numbers.'}
                </p>
              </div>

              <div className={authMode === 'register' ? 'sm:col-span-1' : 'sm:col-span-2'}>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  {language === 'rw' ? 'Ijambo ry\'Ibanga (Password)' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="input-account-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                id="btn-submit-account-auth"
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-black text-xs sm:text-sm transition-transform active:scale-95 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Tegereza...</span>
                ) : authMode === 'register' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{language === 'rw' ? 'Kora Konti Nshya (Kwiyandikisha)' : 'Create Free Account'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{language === 'rw' ? 'Injira muri Konti' : 'Sign In'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSubscriptionModal(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Crown className="w-4 h-4 text-green-400" />
                <span>{language === 'rw' ? 'Gura VIP Pass Ako Kanya' : 'Upgrade & Pay for VIP'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Account Navigation Subtabs */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar border-b border-zinc-900 pb-2">
        {[
          { id: 'profile', labelKey: 'myProfile', icon: User },
          { id: 'downloads', labelKey: 'myDownloads', icon: Download, count: downloads.length },
          { id: 'watchlist', labelKey: 'myWatchlist', icon: Bookmark, count: watchlistItems.length },
          { id: 'history', labelKey: 'watchHistory', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAccountTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAccountTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-green-500 bg-green-500/15 text-green-400'
                  : 'border-zinc-800 bg-[#111111] text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t(tab.labelKey)}</span>
              {typeof tab.count === 'number' && (
                <span className="px-1.5 py-0.2 rounded-md bg-zinc-800 text-[10px] text-zinc-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content Panels */}
      {activeAccountTab === 'profile' && (
        <div className="space-y-6">
          {/* Subscription Card */}
          <div className="p-6 rounded-3xl bg-[#111111] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-green-500" />
                <h3 className="font-extrabold text-base text-white">
                  {currentUser.subscription.plan === 'premium' ? t('premiumPlan') : t('freePlan')}
                </h3>
              </div>
              <button
                onClick={() =>
                  toggleSubscription(
                    currentUser.subscription.plan === 'premium' ? 'free' : 'premium'
                  )
                }
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
              >
                {currentUser.subscription.plan === 'premium' ? 'Simulate Downgrade' : 'Simulate VIP'}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400">
              {currentUser.subscription.plan === 'premium'
                ? t('premiumPlanDesc')
                : t('freePlanDesc')}
            </p>

            {currentUser.subscription.plan === 'premium' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-500 block">Status:</span>
                  <span className="text-green-400 font-bold">Active</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Payment Method:</span>
                  <span className="text-white font-medium">MTN MoMo (078...)</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Next Billing:</span>
                  <span className="text-white font-medium">2,500 RWF / month</span>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/40 text-green-400 text-xs font-bold hover:bg-green-500/25 transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{language === 'rw' ? 'Gura VIP Pass (2,500 RWF / Ukwezi)' : 'Upgrade to VIP Pass (2,500 RWF / mo)'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Language & Preferences */}
          <div className="p-6 rounded-3xl bg-[#111111] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-green-500" />
                <h3 className="font-extrabold text-base text-white">{t('switchLanguage')}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setLanguage('rw')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    language === 'rw'
                      ? 'border-green-500 bg-green-500 text-black'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  🇷🇼 Kinyarwanda
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    language === 'en'
                      ? 'border-green-500 bg-green-500 text-black'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>
          </div>

          {/* PWA App Status & Installation */}
          <div className="p-6 rounded-3xl bg-[#111111] border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {language === 'rw' ? 'App ya NetStudio (PWA)' : 'NetStudio App (PWA)'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {isStandalone
                      ? (language === 'rw' ? 'Iri gukora nk\'App yashyizwemo (Standalone)' : 'Running in installed standalone mode')
                      : (language === 'rw' ? 'Shyira NetStudio muri telefoni cyangwa mudasobwa yawe' : 'Install on Android, iOS, Windows, or Mac')}
                  </p>
                </div>
              </div>

              <div>
                {isStandalone ? (
                  <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'rw' ? 'Yashyizwemo (Installed)' : 'Installed'}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => triggerGetApp()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-extrabold text-xs shadow-md shadow-emerald-950/40 flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === 'rw' ? 'GET APP / INSTALL' : 'GET APP / INSTALL'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setActiveNavTab('support')}
              className="p-4 rounded-2xl bg-[#111111] border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-sm text-white">{t('supportTitle')}</div>
                <div className="text-xs text-zinc-400">{t('supportSubtitle')}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>

            <div
              onClick={() => setActiveNavTab('downloads')}
              className="p-4 rounded-2xl bg-[#111111] border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-sm text-white flex items-center space-x-1.5">
                  <Download className="w-4 h-4 text-green-500" />
                  <span>{t('myDownloads')}</span>
                </div>
                <div className="text-xs text-zinc-400">{downloads.length} offline files</div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>
          </div>
        </div>
      )}

      {/* Downloads Tab */}
      {activeAccountTab === 'downloads' && (
        <div className="space-y-4">
          {downloads.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl bg-[#111111] border border-zinc-800">
              <Download className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">{t('noDownloadsYet')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {downloads.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#111111] border border-zinc-800 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={item.poster || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&auto=format&fit=crop&q=80'}
                      alt={item.title}
                      className="w-14 h-20 object-cover rounded-xl bg-zinc-900 flex-shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">{item.title}</h4>
                      <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-1">
                        <span className="text-green-400 font-semibold">{item.quality}</span>
                        <span>•</span>
                        <span>{item.fileSize}</span>
                        <span>•</span>
                        <span className="text-zinc-500">Offline Ready</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const original = movies.find((m) => m.id === item.mediaId);
                        if (original) startPlayback(original);
                      }}
                      className="p-2.5 rounded-xl bg-green-500 text-black font-bold text-xs flex items-center space-x-1.5 hover:bg-green-400 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      <span className="hidden sm:inline">{t('play')}</span>
                    </button>

                    <button
                      onClick={() => deleteDownload(item.id)}
                      className="p-2.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
                      title="Delete Download"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Watchlist Tab */}
      {activeAccountTab === 'watchlist' && (
        <div>
          {watchlistItems.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl bg-[#111111] border border-zinc-800">
              <Bookmark className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">{t('noWatchlistYet')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {watchlistItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedDetailMedia(item)}
                  className="group relative bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:border-green-500/60 transition-all"
                >
                  <div className="relative aspect-[2/3] w-full bg-zinc-900 overflow-hidden">
                    <img
                      src={item.poster || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&auto=format&fit=crop&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-8 h-8 fill-white text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-green-400">
                      {language === 'rw' && item.titleRw ? item.titleRw : item.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{item.year} • {item.genres[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Watch History Tab */}
      {activeAccountTab === 'history' && (
        <div className="space-y-4">
          {continueWatching.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl bg-[#111111] border border-zinc-800">
              <History className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">{t('noHistoryYet')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {continueWatching.map((item) => {
                const media = item.media;
                const title = language === 'rw' && media.titleRw ? media.titleRw : media.title;

                return (
                  <div
                    key={item.mediaId}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#111111] border border-zinc-800 hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={media.poster || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&auto=format&fit=crop&q=80'}
                        alt={title}
                        className="w-12 h-16 object-cover rounded-xl bg-zinc-900 flex-shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-white">{title}</h4>
                        <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-1">
                          <span className="text-green-400 font-semibold">{item.progressPercentage}% watched</span>
                          <span>•</span>
                          <span>{media.type === 'series' ? 'Series' : media.duration}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => startPlayback(media, undefined, item.progressSeconds)}
                      className="px-3 py-1.5 rounded-xl bg-green-500 text-black font-bold text-xs flex items-center space-x-1.5 hover:bg-green-400 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>{t('resume')}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
