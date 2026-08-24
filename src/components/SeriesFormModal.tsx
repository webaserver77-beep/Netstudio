import React, { useState, useEffect } from 'react';
import { Tv, X, Check, AlertCircle, Sparkles } from 'lucide-react';
import { MediaItem, ContentStatus } from '../types';

interface SeriesFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (series: Partial<MediaItem>) => void;
  editingSeries?: MediaItem | null;
}

export const SeriesFormModal: React.FC<SeriesFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSeries
}) => {
  const [title, setTitle] = useState('');
  const [titleRw, setTitleRw] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [poster, setPoster] = useState('');
  const [backdrop, setBackdrop] = useState('');
  const [interpreter, setInterpreter] = useState('Rocky Kimomo');
  const [genre, setGenre] = useState('Drama');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [rating, setRating] = useState('8.8');
  const [status, setStatus] = useState<ContentStatus>('published');
  const [isPremiumOnly, setIsPremiumOnly] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingSeries) {
      setTitle(editingSeries.title || '');
      setTitleRw(editingSeries.titleRw || '');
      setSynopsis(editingSeries.synopsis || '');
      setPoster(editingSeries.poster || '');
      setBackdrop(editingSeries.backdrop || '');
      setInterpreter(editingSeries.interpreter || '');
      setGenre(editingSeries.genres?.[0] || 'Drama');
      setYear((editingSeries.year || new Date().getFullYear()).toString());
      setRating((editingSeries.rating || 8.8).toString());
      setStatus(editingSeries.status || 'published');
      setIsPremiumOnly(Boolean(editingSeries.isPremiumOnly));
    } else {
      setTitle('');
      setTitleRw('');
      setSynopsis('');
      setPoster('');
      setBackdrop('');
      setInterpreter('Rocky Kimomo');
      setGenre('Drama');
      setYear(new Date().getFullYear().toString());
      setRating('8.8');
      setStatus('published');
      setIsPremiumOnly(false);
    }
    setErrorMsg('');
  }, [editingSeries, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Series Title is required.');
      return;
    }

    const payload: Partial<MediaItem> = {
      ...(editingSeries ? { id: editingSeries.id } : { id: `s_${Date.now()}` }),
      title: title.trim(),
      titleRw: titleRw.trim() || undefined,
      type: 'series',
      synopsis: synopsis.trim() || `${title.trim()} full TV series streaming on NetStudio.`,
      poster: poster.trim() || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80',
      backdrop: backdrop.trim() || poster.trim() || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
      videoUrl: editingSeries?.videoUrl || '',
      interpreter: interpreter.trim() || undefined,
      genres: [genre.trim() || 'Drama'],
      year: Number(year) || new Date().getFullYear(),
      rating: Number(rating) || 8.8,
      status,
      isPremiumOnly,
      seasons: editingSeries?.seasons || [
        {
          id: `sea_${Date.now()}_1`,
          seasonNumber: 1,
          title: 'Season 1',
          description: `${title.trim()} Season 1`,
          status: 'published',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          episodes: []
        }
      ],
      seasonsCount: editingSeries?.seasonsCount || 1,
      episodesCount: editingSeries?.episodesCount || 0,
      partsCount: editingSeries?.partsCount || 0,
      parts: editingSeries?.parts || [],
      viewsCount: editingSeries?.viewsCount || 0
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-[#111111] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingSeries ? `Edit Series: ${editingSeries.title}` : 'Add New TV Series'}
              </h3>
              <p className="text-xs text-zinc-400">Configure show metadata, seasons and episode structure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Series Title */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5">Series Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Money Heist (La Casa de Papel) / Squid Game"
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Translated Title */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1.5">Translated / Local Title (Optional)</label>
            <input
              type="text"
              value={titleRw}
              onChange={(e) => setTitleRw(e.target.value)}
              placeholder="e.g. Inzozi Zikomeye (Series)"
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Poster Image URL & Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
            <div className="sm:col-span-3 space-y-1.5">
              <label className="block text-zinc-300 font-semibold">Poster / Cover Image URL</label>
              <input
                type="text"
                value={poster}
                onChange={(e) => setPoster(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-zinc-500">Vertical show cover poster</p>
            </div>
            <div className="sm:col-span-1 flex justify-center">
              {poster ? (
                <img
                  src={poster}
                  alt="Preview"
                  className="w-16 h-24 object-cover rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-24 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-600">
                  <Tv className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>

          {/* Backdrop Image URL */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1.5">Backdrop / Banner Image URL (Optional)</label>
            <input
              type="text"
              value={backdrop}
              onChange={(e) => setBackdrop(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Genre, Year, Interpreter */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Drama">Drama</option>
                <option value="Agasobanuye Series">Agasobanuye Series</option>
                <option value="Action">Action</option>
                <option value="Crime & Mystery">Crime & Mystery</option>
                <option value="Thriller">Thriller</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Comedy">Comedy</option>
                <option value="Anime & Animation">Anime</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Release Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Agasobanuye Voice</label>
              <input
                type="text"
                value={interpreter}
                onChange={(e) => setInterpreter(e.target.value)}
                placeholder="Junior Giti / Rocky"
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Rating & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Rating (1 - 10)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Publish Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5">Description / Synopsis</label>
            <textarea
              rows={2}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Enter series overview..."
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* VIP Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="seriesVipCheck"
              checked={isPremiumOnly}
              onChange={(e) => setIsPremiumOnly(e.target.checked)}
              className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
            />
            <label htmlFor="seriesVipCheck" className="text-zinc-300 font-semibold cursor-pointer">
              Requires VIP Subscription
            </label>
          </div>

          {/* Server-managed Notice */}
          <div className="p-2.5 bg-zinc-900/50 rounded-xl border border-zinc-800/50 flex items-center space-x-2 text-[11px] text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>
              After saving this series, you can manage its Seasons, Episodes, and Multi-Parts using the structure manager.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-extrabold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-lg shadow-blue-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{editingSeries ? 'Save Changes' : 'Create Series'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
