import React, { useState, useEffect } from 'react';
import { Film, X, Check, Play, AlertCircle, Clock, Star, Sparkles, Plus, Trash2, Layers } from 'lucide-react';
import { MediaItem, MediaPart, ContentStatus } from '../types';

interface MovieFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (movie: Partial<MediaItem>) => void;
  editingMovie?: MediaItem | null;
  onTestPlayback?: (media: MediaItem) => void;
}

const emptyPart = (partNumber: number): MediaPart => ({
  id: `part_${Date.now()}_${partNumber}`,
  partNumber,
  title: '',
  videoUrl: '',
  status: 'published',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const MovieFormModal: React.FC<MovieFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMovie,
  onTestPlayback
}) => {
  const [title, setTitle] = useState('');
  const [titleRw, setTitleRw] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [poster, setPoster] = useState('');
  const [backdrop, setBackdrop] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('1h 45m');
  const [interpreter, setInterpreter] = useState('Rocky Kimomo');
  const [genre, setGenre] = useState('Action');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [rating, setRating] = useState('8.5');
  const [status, setStatus] = useState<ContentStatus>('published');
  const [isPremiumOnly, setIsPremiumOnly] = useState(false);
  const [parts, setParts] = useState<MediaPart[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingMovie) {
      setTitle(editingMovie.title || '');
      setTitleRw(editingMovie.titleRw || '');
      setSynopsis(editingMovie.synopsis || '');
      setPoster(editingMovie.poster || '');
      setBackdrop(editingMovie.backdrop || '');
      setVideoUrl(editingMovie.videoUrl || '');
      setDuration(editingMovie.duration || '1h 45m');
      setInterpreter(editingMovie.interpreter || '');
      setGenre(editingMovie.genres?.[0] || 'Action');
      setYear((editingMovie.year || new Date().getFullYear()).toString());
      setRating((editingMovie.rating || 8.5).toString());
      setStatus(editingMovie.status || 'published');
      setIsPremiumOnly(Boolean(editingMovie.isPremiumOnly));
      setParts(
        (editingMovie.parts || []).map((p, idx) => ({
          ...p,
          partNumber: p.partNumber || idx + 1
        }))
      );
    } else {
      // Defaults for new movie
      setTitle('');
      setTitleRw('');
      setSynopsis('');
      setPoster('');
      setBackdrop('');
      setVideoUrl('');
      setDuration('1h 45m');
      setInterpreter('Rocky Kimomo');
      setGenre('Action');
      setYear(new Date().getFullYear().toString());
      setRating('8.5');
      setStatus('published');
      setIsPremiumOnly(false);
      setParts([]);
    }
    setErrorMsg('');
  }, [editingMovie, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Movie Title is required.');
      return;
    }
    if (!videoUrl.trim()) {
      setErrorMsg('Video Stream URL is required.');
      return;
    }

    // Keep only complete parts (title optional, URL mandatory); re-number sequentially
    const cleanParts = parts
      .filter((p) => p.videoUrl.trim())
      .map((p, idx) => ({
        ...p,
        partNumber: idx + 1,
        title: p.title.trim() || `Part ${idx + 1}`,
        videoUrl: p.videoUrl.trim(),
        updatedAt: new Date().toISOString()
      }));

    const payload: Partial<MediaItem> = {
      ...(editingMovie ? { id: editingMovie.id } : { id: `m_${Date.now()}` }),
      title: title.trim(),
      titleRw: titleRw.trim() || undefined,
      type: 'movie',
      synopsis: synopsis.trim() || `${title.trim()} full movie streaming on NetStudio.`,
      poster: poster.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      backdrop: backdrop.trim() || poster.trim() || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
      videoUrl: cleanParts[0]?.videoUrl || videoUrl.trim(),
      duration: duration.trim() || '1h 45m',
      interpreter: interpreter.trim() || undefined,
      genres: [genre.trim() || 'Action'],
      year: Number(year) || new Date().getFullYear(),
      rating: Number(rating) || 8.5,
      status,
      isPremiumOnly,
      partsCount: cleanParts.length > 1 ? cleanParts.length : undefined,
      viewsCount: editingMovie?.viewsCount || 0,
      ...(cleanParts.length > 0 ? { parts: cleanParts } : {})
    };

    onSave(payload);
    onClose();
  };

  const handleTestPlay = () => {
    if (!videoUrl) {
      setErrorMsg('Enter a video URL first to test streaming playback.');
      return;
    }
    if (onTestPlayback) {
      onTestPlayback({
        id: editingMovie?.id || 'temp_test',
        title: title || 'Stream Test',
        type: 'movie',
        poster: poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600',
        videoUrl,
        year: Number(year) || 2024,
        rating: Number(rating) || 8.5,
        genres: [genre],
        synopsis: synopsis || 'Stream Test',
        viewsCount: 0,
        createdAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-[#111111] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-400 flex-shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingMovie ? `Edit Movie: ${editingMovie.title}` : 'Add New Movie'}
              </h3>
              <p className="text-xs text-zinc-400">Simple and clean movie publishing form</p>
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
          {/* Movie Title */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5">Movie Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inganji mu Birunga / Extraction 2"
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm"
            />
          </div>

          {/* Kinyarwanda Title */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1.5">Translated / Local Title (Optional)</label>
            <input
              type="text"
              value={titleRw}
              onChange={(e) => setTitleRw(e.target.value)}
              placeholder="e.g. Igitego cy'Urukundo (Rwanda release)"
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Video Stream URL + Test */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-zinc-300 font-semibold">
                Video Stream URL (.mp4, .m3u8, YouTube, Vimeo, Direct Embed) *
              </label>
              <button
                type="button"
                onClick={handleTestPlay}
                className="text-[11px] font-bold text-green-400 hover:text-green-300 flex items-center space-x-1 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>Test Video</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Multi-Part Movie Manager */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-green-400" />
                <div>
                  <h4 className="text-zinc-200 font-bold">Movie Parts (Multi-Part)</h4>
                  <p className="text-[10px] text-zinc-500">
                    Add Part 2, Part 3... for split movies. Each part gets its own player tab & auto-play next.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setParts((prev) => [...prev, emptyPart(prev.length + 1)])}
                className="px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors flex-shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>Add Part</span>
              </button>
            </div>

            {parts.length === 0 ? (
              <p className="text-[11px] text-zinc-600 italic px-1">
                No extra parts — this movie plays as a single video.
              </p>
            ) : (
              <div className="space-y-2.5">
                {parts.map((part, idx) => (
                  <div
                    key={part.id}
                    className="p-2.5 rounded-xl bg-[#141414] border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-black">
                        PART {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setParts((prev) => prev.filter((p) => p.id !== part.id))
                        }
                        className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-red-400/80 hover:text-red-400 hover:border-red-500/40 transition-colors cursor-pointer"
                        title={`Remove Part ${idx + 1}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={part.title}
                      onChange={(e) =>
                        setParts((prev) =>
                          prev.map((p) =>
                            p.id === part.id ? { ...p, title: e.target.value } : p
                          )
                        )
                      }
                      placeholder={`Part ${idx + 1} title (e.g. "Part 2 - The Revenge")`}
                      className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                    <input
                      type="text"
                      value={part.videoUrl}
                      onChange={(e) =>
                        setParts((prev) =>
                          prev.map((p) =>
                            p.id === part.id ? { ...p, videoUrl: e.target.value } : p
                          )
                        )
                      }
                      placeholder={`Part ${idx + 1} video URL (.mp4 / .m3u8 / embed link) *`}
                      className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-green-500"
                    />
                  </div>
                ))}
              </div>
            )}
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
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-green-500"
              />
              <p className="text-[10px] text-zinc-500">Vertical movie poster (recommended 2:3 ratio)</p>
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
                  <Film className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>

          {/* Duration, Genre, Year */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="1h 45m"
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
              >
                <option value="Action">Action</option>
                <option value="Agasobanuye">Agasobanuye</option>
                <option value="Drama">Drama</option>
                <option value="Comedy">Comedy</option>
                <option value="Thriller">Thriller</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Romance">Romance</option>
                <option value="Horror">Horror</option>
                <option value="Animation">Animation</option>
                <option value="Documentary">Documentary</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Release Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Interpreter, Rating, Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Agasobanuye Voice</label>
              <input
                type="text"
                value={interpreter}
                onChange={(e) => setInterpreter(e.target.value)}
                placeholder="Rocky Kimomo"
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Rating (1 - 10)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Publish Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500"
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
              placeholder="Enter brief plot synopsis..."
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500 resize-none"
            />
          </div>

          {/* VIP Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="movieVipCheck"
              checked={isPremiumOnly}
              onChange={(e) => setIsPremiumOnly(e.target.checked)}
              className="w-4 h-4 accent-green-500 rounded cursor-pointer"
            />
            <label htmlFor="movieVipCheck" className="text-zinc-300 font-semibold cursor-pointer">
              Requires VIP Subscription
            </label>
          </div>

          {/* Timestamp Notice */}
          <div className="p-2.5 bg-zinc-900/50 rounded-xl border border-zinc-800/50 flex items-center space-x-2 text-[11px] text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <span>
              Server-managed timestamps: <code className="text-zinc-300">createdAt</code> &{' '}
              <code className="text-zinc-300">updatedAt</code> are recorded automatically on the backend.
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
              className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-extrabold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-lg shadow-green-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{editingMovie ? 'Save Changes' : 'Publish Movie'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
