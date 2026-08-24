import React from 'react';
import { useApp } from '../context/AppContext';
import { isIOSDevice, isAndroidDevice, isWindowsDevice, isMacDesktop } from '../utils/pwaManager';
import { APP_STORE_CONFIG } from '../utils/getApp';
import {
  Smartphone,
  Share,
  PlusSquare,
  Monitor,
  Download,
  X,
  CheckCircle2,
  Tv,
  Film,
  Zap,
  Bell,
  ExternalLink
} from 'lucide-react';

export const InstallAppModal: React.FC = () => {
  const {
    showInstallGuideModal,
    setShowInstallGuideModal,
    triggerGetApp,
    isStandalone,
    language
  } = useApp();

  if (!showInstallGuideModal) return null;

  const isKinya = language === 'rw';
  const isIOS = isIOSDevice();
  const isAndroid = isAndroidDevice();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#111114] border border-emerald-500/30 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          onClick={() => setShowInstallGuideModal(false)}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900/60 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with NetStudio Emblem */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-emerald-500/20">
            NS
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              {isKinya ? 'Shyira NetStudio ku Gikoresho Cyawe' : 'Get the NetStudio App'}
            </h3>
            <p className="text-xs text-zinc-400">
              {isKinya
                ? 'Filime, Series na Live TV muri App yihuta cyane'
                : 'Download for Android & iOS or install directly'}
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
          <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isKinya ? 'Gufunguka byihuse' : 'Instant Launch'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center space-x-2">
            <Tv className="w-4 h-4 text-red-400 shrink-0" />
            <span>{isKinya ? 'Live TV idacikagurika' : 'Full HD Live Streams'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center space-x-2">
            <Film className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{isKinya ? 'Kubika filime offline' : 'Offline Downloads'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center space-x-2">
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{isKinya ? 'Kumenyeshwa ibishya' : 'Movie Alerts'}</span>
          </div>
        </div>

        {/* Store Links for Desktop & Fallback */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            <span>{isKinya ? 'Hitamo Ububiko bw\'Ububiko (App Stores)' : 'Download from App Store or Google Play'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Android Direct APK & Google Play */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/80 transition-all flex flex-col justify-between space-y-2 group">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">ANDROID</div>
                  <div className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                    <span>Direct APK / Play Store</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={APP_STORE_CONFIG.androidApkUrl}
                  download="netstudio.apk"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download .APK</span>
                </a>
                <a
                  href={APP_STORE_CONFIG.androidPlayStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold text-center flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Google Play</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* Apple App Store Link */}
            <a
              href={APP_STORE_CONFIG.iosAppStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800/80 transition-all flex flex-col justify-between space-y-2 group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">DOWNLOAD ON THE</div>
                  <div className="text-sm font-black text-white group-hover:text-blue-400 transition-colors flex items-center gap-1">
                    <span>Apple App Store</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </div>
                </div>
              </div>
              <div className="pt-1">
                <span className="w-full block py-1.5 px-2.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-[11px] font-bold text-center transition-colors">
                  Open App Store
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Web App Single-Click Option */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-[#0d1710] to-zinc-900/90 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {isKinya ? 'Gushyira muri Mudasobwa (Desktop App)' : 'Desktop Web Application'}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {isKinya ? 'Koresha vuba udafunguye indi tab' : 'Install without downloading APK'}
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                await triggerGetApp();
                setShowInstallGuideModal(false);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-extrabold text-xs shadow-md shadow-emerald-950/40 flex items-center justify-center space-x-1.5 active:scale-98 transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isKinya ? 'INSTALL NONAHA' : 'INSTALL PWA'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800">
          <div className="flex items-center space-x-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isKinya ? 'Bikora no muri browser isanzwe' : 'Also works directly in web browser'}</span>
          </div>
          <button
            onClick={() => setShowInstallGuideModal(false)}
            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            {isKinya ? 'Funga' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
