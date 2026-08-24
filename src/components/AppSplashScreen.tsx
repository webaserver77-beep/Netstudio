import React, { useEffect, useState } from 'react';
import { isStandalonePWA } from '../utils/pwaManager';

export const AppSplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // Show quick subtle branded splash on cold start or standalone launch
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => setIsVisible(false), 350);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-350 pointer-events-none select-none ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center space-y-4 text-center px-4 animate-scale-in">
        {/* NS Glowing Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-700 flex items-center justify-center text-black font-black text-3xl shadow-[0_0_40px_rgba(34,197,94,0.4)] border border-emerald-300/30">
            NS
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-black animate-pulse" />
        </div>

        {/* Brand Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-wider text-white">
            NET<span className="text-emerald-500">STUDIO</span>
          </h1>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
            Movies • Series • Live TV
          </p>
        </div>

        {/* Minimalist Loading Bar */}
        <div className="w-28 h-1 bg-zinc-900 rounded-full overflow-hidden mt-3">
          <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full animate-[pulse_1s_infinite]" />
        </div>
      </div>
    </div>
  );
};
