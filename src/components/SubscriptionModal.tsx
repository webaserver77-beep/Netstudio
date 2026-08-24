import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Crown,
  Check,
  Smartphone,
  CreditCard,
  Lock,
  Sparkles,
  ShieldCheck,
  UserPlus,
  LogIn,
  Gift,
  HelpCircle,
  MessageCircle,
  User,
  Mail,
  AlertCircle
} from 'lucide-react';

export const SubscriptionModal: React.FC = () => {
  const {
    showSubscriptionModal,
    setShowSubscriptionModal,
    subscriptionPlans,
    isPromotionFreeActive,
    promotionSettings,
    currentUser,
    registerUser,
    loginUser,
    processPayment,
    language,
    t
  } = useApp();

  const isGuest = !currentUser.isLoggedIn || currentUser.isGuest || currentUser.id === 'guest_visitor';

  const activePlans = subscriptionPlans.filter((p) => p.isActive);
  const initialPlanId = activePlans.length > 0 ? activePlans[0].id : 'plan_monthly';

  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);
  const [selectedMethod, setSelectedMethod] = useState<'mtn_momo' | 'airtel_money' | 'stripe'>('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState<string>('0788349201');
  const [momoPin, setMomoPin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showUssdPrompt, setShowUssdPrompt] = useState<boolean>(false);
  const [paymentResult, setPaymentResult] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Guest registration / login fields before payment
  const [authStepMode, setAuthStepMode] = useState<'register' | 'login'>('register');
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmailOrPhone, setGuestEmailOrPhone] = useState<string>('');
  const [guestPassword, setGuestPassword] = useState<string>('');

  if (!showSubscriptionModal) return null;

  const currentPlan =
    activePlans.find((p) => p.id === selectedPlanId) ||
    activePlans[0] || {
      id: 'plan_monthly',
      name: 'Monthly VIP Pass',
      nameRw: 'Kwezi Kuri VIP',
      priceRwf: 2500,
      priceUsd: 2.99,
      billingPeriod: 'monthly',
      features: ['4K Ultra HD Streaming', 'Full Agasobanuye Catalog', 'Live TV All Channels', 'Unlimited Downloads'],
      featuresRw: ['Kureba muri 4K Ultra HD', 'Filime zose Zisobanuye', 'Televiziyo zose z\'Isi', 'Gukuramo Filime nta rubibi']
    };

  const amountRwfFormatted = `${currentPlan.priceRwf.toLocaleString()} RWF`;
  const amountUsdFormatted = `$${currentPlan.priceUsd.toFixed(2)}`;

  const handleClaimFreePromo = async () => {
    if (isGuest) {
      setAuthError(
        language === 'rw'
          ? 'Banza ufungure konti yawe cyangwa winjire muri fomu iri hasi kugira ngo uhabwe VIP!'
          : 'Please create an account or sign in below so your Free VIP is linked to your account!'
      );
      return;
    }
    setIsProcessing(true);
    const res = await processPayment('mtn_momo', currentPlan.id, 'PROMO-FREE');
    setIsProcessing(false);
    setPaymentResult(
      language === 'rw'
        ? 'Wahawe VIP y\'ubuntu! Komeza kuryoherwa na Filime.'
        : 'Free VIP activated successfully! Enjoy all movies and channels.'
    );
    setTimeout(() => {
      setPaymentResult(null);
      setShowSubscriptionModal(false);
    }, 2000);
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // If promo is free, activate directly
    if (isPromotionFreeActive) {
      handleClaimFreePromo();
      return;
    }

    // If user is guest, authenticate or register first
    if (isGuest) {
      if (authStepMode === 'register') {
        if (!guestName.trim()) {
          setAuthError(language === 'rw' ? 'Nyamuneka andika amazina yawe mbere yo kwishyura.' : 'Please enter your name to create your account.');
          return;
        }
        const userContact = guestEmailOrPhone.trim() || phoneNumber.trim();
        if (!userContact) {
          setAuthError(language === 'rw' ? 'Nyamuneka andika imeli cyangwa numero ya telefone.' : 'Please enter your email or phone number.');
          return;
        }
        if (!guestPassword || guestPassword.length < 4) {
          setAuthError(language === 'rw' ? 'Andika ijambo ry\'ibanga (byibuze inyuguti 4) kuri konti yawe.' : 'Please create a password (at least 4 chars) for your account.');
          return;
        }

        setIsProcessing(true);
        const isPhone = !userContact.includes('@');
        const email = isPhone ? `${userContact.replace(/[^0-9]/g, '')}@netstudio.rw` : userContact;
        const phone = isPhone ? userContact : phoneNumber;

        const authRes = await registerUser(guestName, email, phone, guestPassword);
        setIsProcessing(false);
        if (!authRes.success) {
          setAuthError(authRes.message);
          return;
        }
      } else {
        // Login mode
        const userContact = guestEmailOrPhone.trim() || phoneNumber.trim();
        if (!userContact) {
          setAuthError(language === 'rw' ? 'Nyamuneka andika imeli cyangwa telefone winjire.' : 'Please enter your email or phone.');
          return;
        }
        if (!guestPassword) {
          setAuthError(language === 'rw' ? 'Nyamuneka andika ijambo ry\'ibanga.' : 'Please enter your password.');
          return;
        }

        setIsProcessing(true);
        const authRes = await loginUser(userContact, guestPassword);
        setIsProcessing(false);
        if (!authRes.success) {
          setAuthError(authRes.message);
          return;
        }
      }
    }

    // Proceed to USSD prompt or payment finalization
    if (selectedMethod === 'mtn_momo' || selectedMethod === 'airtel_money') {
      setShowUssdPrompt(true);
    } else {
      handleFinalizePayment();
    }
  };

  const handleFinalizePayment = async () => {
    setIsProcessing(true);
    const activePhone = (isGuest && guestEmailOrPhone && !guestEmailOrPhone.includes('@')) ? guestEmailOrPhone : phoneNumber;
    const res = await processPayment(selectedMethod, currentPlan.id, activePhone);
    setIsProcessing(false);
    setShowUssdPrompt(false);
    setPaymentResult(res.message);

    setTimeout(() => {
      setPaymentResult(null);
      setShowSubscriptionModal(false);
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#111111] border border-zinc-800 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-none my-auto max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          id="btn-close-subscription-modal"
          onClick={() => setShowSubscriptionModal(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-md mx-auto mb-5">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500">
            <Crown className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t('subscriptionTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {t('subscriptionSubtitle')}
          </p>
        </div>

        {/* Global Free Promotion Active Banner */}
        {isPromotionFreeActive && (
          <div className="p-4 mb-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-green-500/20 to-emerald-500/20 border-2 border-green-500/60 text-white space-y-2">
            <div className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-amber-400 animate-bounce" />
              <span className="font-extrabold text-sm text-green-400 uppercase tracking-wide">
                {promotionSettings.promoTag || 'PROMOTION ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-zinc-200 font-semibold">
              {language === 'rw'
                ? promotionSettings.freePromoMessageRw || 'Kwamamaza: Filime zose na Live TV bishyizwe ku buntu (100% Free VIP)!'
                : promotionSettings.freePromoMessage || 'Special Promo: Everything is 100% accessible for FREE without payment!'}
            </p>
            <button
              onClick={handleClaimFreePromo}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-black text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer mt-1"
            >
              <Sparkles className="w-4 h-4" />
              <span>{language === 'rw' ? 'Tangira Kureba Kubuntu (Free VIP)' : 'Activate 100% Free VIP Pass'}</span>
            </button>
          </div>
        )}

        {/* Success Alert */}
        {paymentResult && (
          <div className="p-4 mb-5 rounded-2xl bg-green-500/15 border border-green-500/40 text-green-400 text-sm font-bold flex items-center space-x-3">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{paymentResult}</span>
          </div>
        )}

        {/* Error Alert */}
        {authError && (
          <div className="p-3.5 mb-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* 1. Subscription Plans Selection Grid */}
        <div className="space-y-2 mb-5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            {language === 'rw' ? 'Hitamo Porogaramu ya VIP' : 'Select Subscription Plan'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activePlans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">
                      {language === 'rw' && plan.nameRw ? plan.nameRw : plan.name}
                    </span>
                    {plan.badge && (
                      <span className="px-1.5 py-0.2 rounded bg-green-500 text-black text-[9px] font-black">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-black text-green-400">
                    {plan.priceRwf.toLocaleString()} RWF{' '}
                    <span className="text-[10px] text-zinc-400 font-normal">(${plan.priceUsd.toFixed(2)})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Selected Plan Details & Features */}
        <div className="p-4 rounded-2xl bg-[#161616] border border-green-500/30 mb-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="font-extrabold text-sm text-white">
                {language === 'rw' && currentPlan.nameRw ? currentPlan.nameRw : currentPlan.name}
              </span>
            </div>
            <span className="text-base font-black text-green-400">
              {amountRwfFormatted}{' '}
              <span className="text-xs text-zinc-500 font-normal">({amountUsdFormatted})</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
            {(language === 'rw' && currentPlan.featuresRw ? currentPlan.featuresRw : currentPlan.features).map(
              (feature, idx) => (
                <div key={idx} className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <span className="truncate">{feature}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Main Payment & Account Form */}
        <form onSubmit={handleInitiatePayment} className="space-y-4">
          {/* 3. Account Creation / Login Section if Guest */}
          {isGuest ? (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-green-400" />
                  <span className="font-bold text-xs text-white">
                    {authStepMode === 'register'
                      ? (language === 'rw' ? 'Kora Konti ya VIP' : 'Create Account for VIP')
                      : (language === 'rw' ? 'Injira muri Konti' : 'Sign In to Your Account')}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStepMode('register');
                      setAuthError(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      authStepMode === 'register' ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {language === 'rw' ? 'Kora Konti' : 'Create Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStepMode('login');
                      setAuthError(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      authStepMode === 'login' ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {language === 'rw' ? 'Injira' : 'Sign In'}
                  </button>
                </div>
              </div>

              {authStepMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    {language === 'rw' ? 'Amazina Yombi (Full Name)' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder={language === 'rw' ? 'urugero: Patrick Mugisha' : 'e.g., Patrick Mugisha'}
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    {language === 'rw' ? 'Imeli cyangwa Telefone' : 'Email or Phone Number'}
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="078XXXXXXX cyangwa name@..."
                      value={guestEmailOrPhone}
                      onChange={(e) => {
                        setGuestEmailOrPhone(e.target.value);
                        if (!e.target.value.includes('@') && e.target.value.length >= 8) {
                          setPhoneNumber(e.target.value);
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    {language === 'rw' ? 'Ijambo ry\'Ibanga (Password)' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={guestPassword}
                      onChange={(e) => setGuestPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span className="text-zinc-300">
                  {language === 'rw' ? 'Ugiye kwishyura nk\'umunyamuryango:' : 'Subscribing as user:'}{' '}
                  <strong className="text-white">{currentUser.name}</strong>
                </span>
              </div>
              <span className="text-green-400 font-bold">{currentUser.phoneNumber || currentUser.email}</span>
            </div>
          )}

          {/* 4. Payment Gateways Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              {language === 'rw' ? 'Hitamo uburyo bwo kwishyura' : 'Select Payment Gateway'}
            </label>

            {/* MTN MoMo Rwanda */}
            <div
              onClick={() => setSelectedMethod('mtn_momo')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedMethod === 'mtn_momo'
                  ? 'border-yellow-500/80 bg-yellow-500/10'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-400 text-black font-extrabold text-xs flex items-center justify-center">
                  MoMo
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-white flex items-center space-x-1.5">
                    <span>MTN Mobile Money Rwanda</span>
                    <span className="px-1.5 py-0.2 rounded bg-yellow-400 text-black text-[9px] font-black">
                      RW
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">078 / 079 Rwanda lines</div>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedMethod === 'mtn_momo' ? 'border-yellow-400 bg-yellow-400' : 'border-zinc-600'
                }`}
              >
                {selectedMethod === 'mtn_momo' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
            </div>

            {/* Airtel Money Rwanda */}
            <div
              onClick={() => setSelectedMethod('airtel_money')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedMethod === 'airtel_money'
                  ? 'border-red-500/80 bg-red-500/10'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-extrabold text-xs flex items-center justify-center">
                  Airtel
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-white">Airtel Money Rwanda</div>
                  <div className="text-[11px] text-zinc-400">073 / 072 lines</div>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedMethod === 'airtel_money' ? 'border-red-500 bg-red-500' : 'border-zinc-600'
                }`}
              >
                {selectedMethod === 'airtel_money' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
            </div>

            {/* Stripe / Card */}
            <div
              onClick={() => setSelectedMethod('stripe')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedMethod === 'stripe'
                  ? 'border-green-500/80 bg-green-500/10'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-white">Credit / Debit Card (Stripe)</div>
                  <div className="text-[11px] text-zinc-400">Visa, Mastercard, International</div>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedMethod === 'stripe' ? 'border-green-500 bg-green-500' : 'border-zinc-600'
                }`}
              >
                {selectedMethod === 'stripe' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
            </div>
          </div>

          {/* Phone Number Input for MoMo / Airtel */}
          {(selectedMethod === 'mtn_momo' || selectedMethod === 'airtel_money') && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                {selectedMethod === 'mtn_momo' ? t('enterMtnNumber') : t('enterAirtelNumber')}
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0788123456"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <p className="text-[11px] text-zinc-500">{t('momoPromptText')}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-sm sm:text-base transition-colors flex items-center justify-center space-x-2 cursor-pointer border border-green-400 mt-3"
          >
            <Lock className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Processing...'
                : isPromotionFreeActive
                ? 'Claim Free VIP Access'
                : `${t('proceedPayment')} • ${amountRwfFormatted}`}
            </span>
          </button>
        </form>

        {/* WhatsApp Customer Care Support Banner */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>{language === 'rw' ? 'Ukeneye ubufasha kuri WhatsApp:' : 'Need payment help on WhatsApp:'}</span>
          </div>
          <a
            href="https://wa.me/250796119924?text=Hello%20NetStudio%20Support,%20I%20need%20help%20with%20VIP%20subscription"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1"
          >
            <span>+250796119924</span>
          </a>
        </div>

        {/* USSD Push Prompt Interactive Simulation */}
        {showUssdPrompt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-sm bg-zinc-950 border-2 border-yellow-400 rounded-3xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-400 text-black font-black text-xl flex items-center justify-center mx-auto mb-4">
                MoMo
              </div>
              <h3 className="font-extrabold text-base text-white mb-2">MTN MoMo USSD Prompt</h3>
              <p className="text-xs text-zinc-300 mb-4 bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-left font-mono">
                {language === 'rw'
                  ? `Emeza kwishyura ${amountRwfFormatted} kuri NetStudio Streaming (Ref: RW-${Date.now()
                      .toString()
                      .slice(-4)}).`
                  : `Approve payment of ${amountRwfFormatted} to NetStudio Streaming.`}
              </p>

              <div className="space-y-3">
                <input
                  type="password"
                  maxLength={5}
                  value={momoPin}
                  onChange={(e) => setMomoPin(e.target.value)}
                  placeholder="Enter MoMo PIN (e.g. 12345)"
                  className="w-full p-3 bg-black border border-zinc-700 rounded-xl text-center text-lg tracking-widest text-white focus:outline-none focus:border-yellow-400"
                />

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowUssdPrompt(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 text-xs font-bold"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalizePayment}
                    className="w-1/2 py-2.5 rounded-xl bg-yellow-400 text-black text-xs font-black hover:bg-yellow-300"
                  >
                    Confirm & Pay
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
