import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Crown,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tv
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, registerUser, loginUser, language, t } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+250 796 119 924');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        if (!name.trim() || !email.trim()) {
          setErrorMsg(language === 'rw' ? 'Nyamuneka andika amazina na imeli.' : 'Please enter your name and email.');
          setIsSubmitting(false);
          return;
        }

        const res = await registerUser(name, email, phoneNumber, password);
        if (res.success) {
          setSuccessMsg(res.message);
          setTimeout(() => {
            setShowAuthModal(false);
          }, 1500);
        } else {
          setErrorMsg(res.message);
        }
      } else {
        if (!email.trim()) {
          setErrorMsg(language === 'rw' ? 'Nyamuneka andika imeli cyangwa numero ya telefone.' : 'Please enter your email or phone.');
          setIsSubmitting(false);
          return;
        }

        const res = await loginUser(email, password);
        if (res.success) {
          setSuccessMsg(res.message);
          setTimeout(() => {
            setShowAuthModal(false);
          }, 1500);
        } else {
          setErrorMsg(res.message);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#111111] border border-zinc-800 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-none my-auto">
        {/* Close Button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-sm mx-auto mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {mode === 'register' ? (language === 'rw' ? 'Kora Konti Nshya' : 'Create Account') : (language === 'rw' ? 'Injira muri Konti' : 'Sign In')}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {mode === 'register'
              ? (language === 'rw' ? 'Kora konti kugira ngo ugure ifatabuguzi rya VIP maze urebe filime zose.' : 'Create an account to subscribe and unlock full VIP movie streaming.')
              : (language === 'rw' ? 'Injira muri konti yawe ya NetStudio.' : 'Sign in to access your subscriptions and favorites.')}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-2xl border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'register' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {language === 'rw' ? 'Kwiyandikisha' : 'Register'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {language === 'rw' ? 'Kwinjira' : 'Sign In'}
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3.5 mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 mb-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {language === 'rw' ? 'Amazina Yombi' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Patrick Mugisha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              {language === 'rw' ? 'Imeli cyangwa Telefone' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {language === 'rw' ? 'Numero ya Telefone (MTN / Airtel)' : 'Phone Number (MTN / Airtel)'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="tel"
                  placeholder="+250 796 119 924"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              {language === 'rw' ? 'Ijambo ry\'Ibanga (Password)' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition-transform active:scale-98 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <span>Loading...</span>
            ) : mode === 'register' ? (
              <>
                <span>{language === 'rw' ? 'Kora Konti Ubu' : 'Create VIP Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>{language === 'rw' ? 'Injira muri Konti' : 'Sign In Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
          <p className="text-[11px] text-zinc-500">
            {language === 'rw'
              ? 'Muri NetStudio, amakuru yawe arinzwe 100% kandi ifatabuguzi rishyirwaho ako kanya.'
              : 'Secure account with instant MTN MoMo and Airtel Money VIP subscription sync.'}
          </p>
        </div>
      </div>
    </div>
  );
};
