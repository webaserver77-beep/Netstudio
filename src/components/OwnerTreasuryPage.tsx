import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  History,
  Lock,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Building2,
  Download,
  FileText,
  LogOut,
  ChevronRight,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const OwnerTreasuryPage: React.FC = () => {
  const {
    language,
    t,
    ownerToken,
    ownerLogin,
    ownerLogout,
    treasurySummary,
    financialTransactions,
    withdrawals,
    auditLogs,
    fetchTreasuryData,
    executeWithdrawal,
    updateOwnerSecurity,
    navigateTo
  } = useApp();

  // Authentication Lock Screen State
  const [passwordInput, setPasswordInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'ledger' | 'withdrawals' | 'audit_logs'>('ledger');

  // Withdrawal Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'mobile_money' | 'bank_transfer'>('mobile_money');
  const [withdrawProvider, setWithdrawProvider] = useState<'mtn_momo' | 'airtel_money' | 'bank_rwanda'>('mtn_momo');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('50000');
  const [destAccount, setDestAccount] = useState('+250796119924');
  const [destAccountName, setDestAccountName] = useState('NetStudio Owner Treasury');
  const [bankName, setBankName] = useState('Bank of Kigali (BK)');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);

  // Security Credentials Modal State
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [secSuccess, setSecSuccess] = useState('');
  const [secError, setSecError] = useState('');

  useEffect(() => {
    if (ownerToken) {
      fetchTreasuryData();
    }
  }, [ownerToken, fetchTreasuryData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    const result = await ownerLogin(passwordInput, pinInput);
    setIsAuthenticating(false);

    if (!result.success) {
      setAuthError(result.message);
    } else {
      setPasswordInput('');
      setPinInput('');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    const numAmount = Number(withdrawAmount);
    if (!numAmount || numAmount <= 0) {
      setWithdrawError('Please enter a valid amount.');
      return;
    }

    if (!destAccount || !destAccountName) {
      setWithdrawError('Please provide complete recipient details.');
      return;
    }

    if (!withdrawPin) {
      setWithdrawError('2FA PIN is required to authorize withdrawal.');
      return;
    }

    setIsProcessingWithdrawal(true);
    const result = await executeWithdrawal({
      amount: numAmount,
      method: withdrawMethod,
      provider: withdrawProvider,
      destinationAccount: destAccount,
      destinationAccountName: destAccountName,
      bankName: withdrawMethod === 'bank_transfer' ? bankName : undefined,
      pin: withdrawPin
    });

    setIsProcessingWithdrawal(false);

    if (result.success) {
      setWithdrawSuccess(result.message);
      setWithdrawPin('');
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess('');
      }, 3000);
    } else {
      setWithdrawError(result.message);
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecError('');
    setSecSuccess('');

    if (!currentPin) {
      setSecError('Current PIN is required to confirm changes.');
      return;
    }

    const res = await updateOwnerSecurity(
      newPassword.trim() || undefined,
      newPin.trim() || undefined,
      currentPin
    );

    if (res.success) {
      setSecSuccess('Security credentials updated successfully.');
      setNewPassword('');
      setNewPin('');
      setCurrentPin('');
      setTimeout(() => setShowSecurityModal(false), 2000);
    } else {
      setSecError(res.message);
    }
  };

  // 1. SECURITY LOCK GATE IF NOT AUTHENTICATED
  if (!ownerToken) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl backdrop-blur-xl animate-fade-in relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 flex items-center justify-center text-green-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide mb-1">
              {t('ownerTreasury')}
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
              {t('ownerTreasuryDesc')}
            </p>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                <span>{t('enterOwnerPassword')}</span>
                <span className="text-[10px] text-neutral-500">Master Secret</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                <span>{t('twoFactorPin')}</span>
                <span className="text-[10px] text-green-400/80">Owner PIN (9924)</span>
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="9924"
                required
                className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 tracking-widest text-center font-mono focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-bold text-sm tracking-wide shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAuthenticating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>{t('unlockTreasury')}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              <span>256-Bit Ledger Verification & Cryptographic Hashes</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED OWNER TREASURY DASHBOARD
  const summary = treasurySummary || {
    availableBalance: 0,
    pendingBalance: 0,
    totalRevenue: 0,
    totalWithdrawn: 0,
    totalRefunds: 0,
    currency: 'RWF'
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Owner Financial Authority</span>
            </span>
            <span className="text-xs text-neutral-500">• Official NetStudio Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t('ownerTreasury')}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time balance, automated MoMo & Airtel Money collections, and instant payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-green-500/20 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{t('withdrawFunds')}</span>
          </button>

          <button
            onClick={() => fetchTreasuryData()}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSecurityModal(true)}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="Security Credentials"
          >
            <Lock className="w-4 h-4" />
          </button>

          <button
            onClick={ownerLogout}
            className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance Card */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-green-500/30 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
              {t('availableBalance')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mb-1">
            {summary.availableBalance.toLocaleString()} <span className="text-sm font-semibold text-green-400">RWF</span>
          </div>
          <p className="text-[11px] text-neutral-400 flex items-center gap-1">
            <span className="text-green-400 font-semibold">Ready for payout</span> to MoMo/Bank
          </p>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {t('totalRevenue')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mb-1">
            {summary.totalRevenue.toLocaleString()} <span className="text-sm font-semibold text-yellow-400">RWF</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Cumulative MoMo + Airtel collections
          </p>
        </div>

        {/* Total Withdrawn Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {t('totalWithdrawn')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mb-1">
            {summary.totalWithdrawn.toLocaleString()} <span className="text-sm font-semibold text-blue-400">RWF</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Processed to owner bank / MoMo accounts
          </p>
        </div>

        {/* Pending / Escrow Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {t('pendingBalance')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mb-1">
            {summary.pendingBalance.toLocaleString()} <span className="text-sm font-semibold text-purple-400">RWF</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Awaiting carrier settlement confirmation
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-800 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'border-green-500 text-white'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t('financialLedger')}</span>
          <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[11px]">
            {financialTransactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'withdrawals'
              ? 'border-green-500 text-white'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>{t('withdrawalHistory')}</span>
          <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[11px]">
            {withdrawals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'audit_logs'
              ? 'border-green-500 text-white'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{t('auditLogs')}</span>
          <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[11px]">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT 1: FINANCIAL TRANSACTIONS LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
            <h3 className="text-sm font-bold text-white">
              Verified Inbound Subscriptions & Payments
            </h3>
            <span className="text-xs text-neutral-400">
              {financialTransactions.length} verified transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">User / Phone</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium">
                {financialTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-neutral-500">
                      No financial transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  financialTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-green-400">
                        {tx.providerTransactionId || tx.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white font-semibold">{tx.userName || 'Member'}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">{tx.phoneNumber || '+250796119924'}</div>
                      </td>
                      <td className="py-3 px-4 uppercase text-neutral-300">
                        {tx.provider.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-neutral-300">
                        {tx.planName || 'VIP Monthly Pass'}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        +{tx.amount.toLocaleString()} RWF
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: WITHDRAWAL REQUESTS & PAYOUTS */}
      {activeTab === 'withdrawals' && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
            <h3 className="text-sm font-bold text-white">
              Owner Payouts & Transfers
            </h3>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="text-xs text-green-400 font-bold hover:underline flex items-center gap-1"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{t('withdrawFunds')}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Payout ID</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Method & Provider</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-neutral-500">
                      No withdrawal payouts created yet.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-neutral-300">
                        {w.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white font-semibold">{w.destinationAccountName}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">{w.destinationAccount}</div>
                      </td>
                      <td className="py-3 px-4 uppercase text-neutral-300">
                        {w.provider} ({w.method.replace('_', ' ')})
                        {w.bankName && <div className="text-[10px] text-neutral-500">{w.bankName}</div>}
                      </td>
                      <td className="py-3 px-4 font-bold text-red-400">
                        -{w.amount.toLocaleString()} RWF
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{w.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        {new Date(w.requestedAt).toLocaleDateString()} {new Date(w.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: IMMUTABLE AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-bold text-white">
                Cryptographic Security & Action Audit Trail
              </h3>
            </div>
            <span className="text-xs text-neutral-400">
              {auditLogs.length} logged events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP / Host</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-neutral-500">
                      No security audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono uppercase text-[11px] text-neutral-300">
                        {log.eventType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 text-neutral-200">
                        {language === 'rw' && log.detailsRw ? log.detailsRw : log.details}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.severity === 'security'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : log.severity === 'financial'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                              : log.severity === 'warning'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t('withdrawFunds')}</h3>
                  <p className="text-xs text-neutral-400">
                    Transfer money directly to your Mobile Money or Bank Account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="p-5 space-y-4">
              {withdrawError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {withdrawSuccess && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-xs text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{withdrawSuccess}</span>
                </div>
              )}

              {/* Payout Method Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  {t('payoutDestination')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawMethod('mobile_money');
                      setWithdrawProvider('mtn_momo');
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold transition-all ${
                      withdrawMethod === 'mobile_money'
                        ? 'bg-green-500/10 border-green-500 text-green-400'
                        : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile Money (RW)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawMethod('bank_transfer');
                      setWithdrawProvider('bank_rwanda');
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold transition-all ${
                      withdrawMethod === 'bank_transfer'
                        ? 'bg-green-500/10 border-green-500 text-green-400'
                        : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Bank Transfer (RW)</span>
                  </button>
                </div>
              </div>

              {withdrawMethod === 'mobile_money' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawProvider('mtn_momo')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                      withdrawProvider === 'mtn_momo'
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    MTN Mobile Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawProvider('airtel_money')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                      withdrawProvider === 'airtel_money'
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    Airtel Money
                  </button>
                </div>
              )}

              {withdrawMethod === 'bank_transfer' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Select Bank (Rwanda)
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-black/60 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="Bank of Kigali (BK)">Bank of Kigali (BK)</option>
                    <option value="I&M Bank Rwanda">I&M Bank Rwanda</option>
                    <option value="Equity Bank Rwanda">Equity Bank Rwanda</option>
                    <option value="Cogebanque Rwanda">Cogebanque Rwanda</option>
                    <option value="BPR Bank Rwanda">BPR Bank Rwanda</option>
                    <option value="Ecobank Rwanda">Ecobank Rwanda</option>
                  </select>
                </div>
              )}

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    {t('recipientName')}
                  </label>
                  <input
                    type="text"
                    value={destAccountName}
                    onChange={(e) => setDestAccountName(e.target.value)}
                    placeholder="e.g., Patrick Mugisha"
                    required
                    className="w-full bg-black/60 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    {withdrawMethod === 'mobile_money' ? 'Phone Number (MoMo)' : 'Account Number'}
                  </label>
                  <input
                    type="text"
                    value={destAccount}
                    onChange={(e) => setDestAccount(e.target.value)}
                    placeholder="+250796119924"
                    required
                    className="w-full bg-black/60 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              {/* Amount & Available Balance shortcut */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    {t('enterWithdrawAmount')}
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    Max: <strong className="text-green-400">{summary.availableBalance.toLocaleString()} RWF</strong>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    max={summary.availableBalance}
                    min={1000}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(summary.availableBalance.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-green-400 px-2 py-1 rounded"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* 2FA PIN Authorization */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <label className="block text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>{t('twoFactorPin')}</span>
                  <span className="text-[10px] text-neutral-500">Security Check</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={withdrawPin}
                  onChange={(e) => setWithdrawPin(e.target.value)}
                  placeholder="Enter 2FA PIN (9924)"
                  required
                  className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white text-center font-mono tracking-widest focus:outline-none focus:border-green-500"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessingWithdrawal}
                className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-black text-sm tracking-wide shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessingWithdrawal ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
                <span>{t('confirmWithdrawal')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SECURITY CREDENTIALS MODAL */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-400" />
                <h3 className="text-sm font-bold text-white">Owner Security Credentials</h3>
              </div>
              <button
                onClick={() => setShowSecurityModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {secError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {secError}
              </div>
            )}
            {secSuccess && (
              <div className="mb-3 p-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-xs text-green-400">
                {secSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateSecurity} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  New Master Password (optional)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full bg-black/60 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  New 2FA PIN (optional)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. 9924"
                  className="w-full bg-black/60 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Current 2FA PIN (Required to confirm)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder="Current PIN (9924)"
                  required
                  className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-green-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold"
              >
                Save New Credentials
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
