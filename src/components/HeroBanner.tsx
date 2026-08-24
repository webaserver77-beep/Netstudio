import React from 'react';
import { useApp } from '../context/AppContext';
import { MediaItem } from '../types';
import { Play, Plus, Check, Info, Star, Volume2, Sparkles } from 'lucide-react';

interface HeroBannerProps {
  media: MediaItem;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ media }) => {
  const { language, t, startPlayback, isInWatchlist, toggleWatchlist, setSelectedDetailMedia } = useApp();

  const isSaved = isInWatchlist(media.id);
  const title = language === 'rw' && media.titleRw ? media.titleRw : media.title;
  const synopsis = language === 'rw' && media.synopsisRw ? media.synopsisRw : media.synopsis;
  const genres = language === 'rw' && media.genresRw ? media.genresRw : media.genres;

  // Series always start at Season 1 - Episode 1
  const firstEpisode = React.useMemo(() => {
    const fromSeasons = (media.seasons || []).flatMap((s) =>
      (s.episodes || []).map((ep) => ({ ...ep, season: ep.season || s.seasonNumber }))
    );
    return [...(media.episodes || []), ...fromSeasons]
      .filter((ep, i, arr) => arr.findIndex((e) => e.id === ep.id) === i)
      .sort(
        (a, b) =>
          (a.season || 1) - (b.season || 1) || (a.episodeNumber || 0) - (b.episodeNumber || 0)
      )[0];
  }, [media]);

  const backdropUrl = media.backdrop || media.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&auto=format&fit=crop&q=80';

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-zinc-800 bg-[#111111] mb-8">
      {/* Background Backdrop with Gradient Overlays */}
      <div className="relative w-full h-[400px] sm:h-[480px] md:h-[540px] lg:h-[580px]">
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover object-center"
          />
        )}
        {/* Flat cinematic gradient overlay (without blurry shadows) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
      </div>

      {/* Hero Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-12 z-10">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-lg bg-green-500 text-black text-[11px] font-extrabold uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3 h-3 fill-black" />
            <span>#1 TRENDING</span>
          </span>

          <span className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-700 text-white text-[11px] font-bold">
            {media.quality}
          </span>

          <span className="px-2 py-0.5 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-medium">
            {media.ageRating}
          </span>

          {media.interpreter && (
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-green-500/40 text-green-400 text-[11px] font-semibold flex items-center space-x-1">
              <Volume2 className="w-3 h-3" />
              <span>Agasobanuye: {media.interpreter}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-2xl leading-none mb-3">
          {title}
        </h1>

        {/* Metadata stats */}
        <div className="flex items-center space-x-3 text-xs sm:text-sm text-zinc-300 font-medium mb-3">
          <div className="flex items-center text-amber-400 font-bold">
            <Star className="w-4 h-4 fill-amber-400 mr-1" />
            <span>{media.rating.toFixed(1)}</span>
          </div>
          <span className="text-zinc-600">•</span>
          <span>{media.year}</span>
          <span className="text-zinc-600">•</span>
          <span>{media.type === 'series' ? `${media.seasonsCount || 1} Seasons` : media.duration}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">{genres.slice(0, 2).join(' / ')}</span>
        </div>

        {/* Synopsis snippet */}
        <p className="text-zinc-300 text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-3 max-w-xl mb-6 leading-relaxed">
          {synopsis}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Watch / Play Button — series auto-start at S1 E1 */}
          <button
            onClick={() => startPlayback(media, media.type === 'series' ? firstEpisode : undefined)}
            className="px-6 py-3 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-sm sm:text-base transition-colors flex items-center space-x-2.5 cursor-pointer border border-green-400"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>{t('watchNow')}</span>
          </button>

          {/* My List / Watchlist Button */}
          <button
            onClick={() => toggleWatchlist(media.id)}
            className={`px-5 py-3 rounded-2xl border transition-all text-sm sm:text-base font-semibold flex items-center space-x-2 cursor-pointer ${
              isSaved
                ? 'border-green-500 bg-green-500/15 text-green-400'
                : 'border-zinc-700 bg-zinc-900/80 text-white hover:border-zinc-500 hover:bg-zinc-800'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>{t('inMyList')}</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>{t('myList')}</span>
              </>
            )}
          </button>

          {/* More Info Button */}
          <button
            onClick={() => setSelectedDetailMedia(media)}
            className="px-4 py-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 text-zinc-300 hover:text-white text-sm font-semibold transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">{t('moreInfo')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
