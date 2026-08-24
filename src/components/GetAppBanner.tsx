import React from 'react';
import { useApp } from '../context/AppContext';
import { Smartphone, Download, X, Sparkles, CheckCircle2 } from 'lucide-react';

export const GetAppBanner: React.FC = () => {
  const {
    showInstallBanner,
    dismissInstallBanner,
    triggerGetApp,
    isStandalone,
    language
  } = useApp();

  // If already running as installed app or dismissed, do not display
  if (isStandalone || !showInstallBanner) {
    return null;
  }

  const isKinya = language === 'rw';

  return (
    <aside
      aria-label="Install NetStudio Application Banner"
      className="w-full bg-gradient-to-r from-zinc-950 via-[#0a150e] to-zinc-950 border-b border-emerald-500/20 py-2.5 px-3 sm:px-6 transition-all duration-300 relative z-40"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Left: Icon & Description */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.2)]">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                {isKinya ? '📱 Shyira NetStudio muri Telefoni / Mudasobwa' : '📱 Get the NetStudio App'}
              </span>
              <span className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" />
                <span>PWA</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
              {isKinya
                ? 'Reba filime zose, series na Live TV zitabangamiwe no guhagarara.'
                : 'Watch movies, series and Live TV anywhere with faster playback.'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={() => triggerGetApp()}
            className="flex-1 sm:flex-initial px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-extrabold text-xs shadow-md shadow-emerald-950/40 flex items-center justify-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isKinya ? 'GET APP' : 'GET APP'}</span>
          </button>

          <button
            onClick={dismissInstallBanner}
            aria-label="Dismiss Get App banner"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
