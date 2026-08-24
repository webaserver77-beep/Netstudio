import React from 'react';
import { Film, Tv, X, Plus, Sparkles } from 'lucide-react';

interface ContentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: () => void;
  onSelectSeries: () => void;
}

export const ContentChoiceModal: React.FC<ContentChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectMovie,
  onSelectSeries
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#111111] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Add New Content</h3>
              <p className="text-xs text-zinc-400">Select the content format you want to publish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Choice Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option: MOVIE */}
          <button
            onClick={() => {
              onClose();
              onSelectMovie();
            }}
            className="group flex flex-col items-center text-center p-6 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-green-500 hover:bg-green-500/5 transition-all cursor-pointer space-y-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 group-hover:bg-green-500/20 text-zinc-300 group-hover:text-green-400 border border-zinc-800 group-hover:border-green-500/40 flex items-center justify-center transition-all shadow-md">
              <Film className="w-7 h-7" />
            </div>
            <div>
              <span className="block text-sm font-extrabold text-white group-hover:text-green-400 tracking-wide uppercase">
                Movie
              </span>
              <span className="block text-[11px] text-zinc-400 mt-1">
                Single video title, feature film, or Agasobanuye
              </span>
            </div>
          </button>

          {/* Option: SERIES */}
          <button
            onClick={() => {
              onClose();
              onSelectSeries();
            }}
            className="group flex flex-col items-center text-center p-6 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer space-y-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 group-hover:bg-blue-500/20 text-zinc-300 group-hover:text-blue-400 border border-zinc-800 group-hover:border-blue-500/40 flex items-center justify-center transition-all shadow-md">
              <Tv className="w-7 h-7" />
            </div>
            <div>
              <span className="block text-sm font-extrabold text-white group-hover:text-blue-400 tracking-wide uppercase">
                Series
              </span>
              <span className="block text-[11px] text-zinc-400 mt-1">
                Multi-season drama, TV show, episodes & parts
              </span>
            </div>
          </button>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60 flex items-center space-x-2 text-[11px] text-zinc-400">
          <Sparkles className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span>Timestamps are automatically recorded by the NetStudio server on save.</span>
        </div>
      </div>
    </div>
  );
};
