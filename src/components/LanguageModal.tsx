import React from 'react';
import { useApp } from '../context/AppContext';
import { Globe, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LanguageModal: React.FC = () => {
  const { showLanguageModal, setShowLanguageModal, language, setLanguage, t } = useApp();

  if (!showLanguageModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md bg-[#111111] border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center"
        >
          {/* Icon Header */}
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-green-500">
            <Globe className="w-7 h-7" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
            {t('chooseLanguage')}
          </h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            {t('chooseLanguageDesc')}
          </p>

          {/* Language Options */}
          <div className="space-y-3 mb-6">
            {/* Kinyarwanda */}
            <button
              onClick={() => setLanguage('rw')}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left ${
                language === 'rw'
                  ? 'border-green-500 bg-green-500/10 text-white'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <span className="text-2xl">🇷🇼</span>
                <div>
                  <div className="font-semibold text-base text-white">Kinyarwanda</div>
                  <div className="text-xs text-zinc-400">Ururimi rw\'Ikinyarwanda</div>
                </div>
              </div>
              {language === 'rw' && (
                <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>

            {/* English */}
            <button
              onClick={() => setLanguage('en')}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left ${
                language === 'en'
                  ? 'border-green-500 bg-green-500/10 text-white'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <span className="text-2xl">🇬🇧</span>
                <div>
                  <div className="font-semibold text-base text-white">English</div>
                  <div className="text-xs text-zinc-400">English Language</div>
                </div>
              </div>
              {language === 'en' && (
                <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>
          </div>

          {/* Continue Button */}
          <button
            onClick={() => setShowLanguageModal(false)}
            className="w-full py-3.5 px-6 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-base transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>{t('continueBtn')}</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
