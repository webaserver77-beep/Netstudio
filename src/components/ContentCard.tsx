import React from 'react';
import { useApp } from '../context/AppContext';
import { MediaItem } from '../types';
import { Play, Plus, Check, Star, Crown, Volume2 } from 'lucide-react';

interface ContentCardProps {
  media: MediaItem;
  size?: 'normal' | 'large' | 'compact';
}

export const ContentCard: React.FC<ContentCardProps> = ({ media, size = 'normal' }) => {
  const { language, startPlayback, setSelectedDetailMedia, toggleWatchlist, isInWatchlist } = useApp();

  const isSaved = isInWatchlist(media.id);
  const title = language === 'rw' && media.titleRw ? media.titleRw : media.title;
  const posterUrl = media.poster && media.poster.trim() !== '' ? media.poster : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&auto=format&fit=crop&q=80';

  // Series: resolve season numbers from seasons or count -> "S01", "S02"...
  const seasonNumbers =
    media.type === 'series'
      ? media.seasons && media.seasons.length > 0
        ? media.seasons.map((s) => s.seasonNumber).sort((a, b) => a - b)
        : Array.from({ length: Math.max(media.seasonsCount || 1, 1) }, (_, i) => i + 1)
      : [];
  const visibleSeasonBadges = seasonNumbers.slice(0, 3);
  const hiddenSeasonCount = seasonNumbers.length - visibleSeasonBadges.length;
  const formatSeason = (n: number) => `S${String(n).padStart(2, '0')}`;

  return (
    <div
      className={`group relative flex-shrink-0 bg-[#111111] border border-zinc-800/90 rounded-2xl overflow-hidden transition-all duration-300 hover:border-green-500/60 ${
        size === 'large'
          ? 'w-[220px] sm:w-[260px]'
          : size === 'compact'
          ? 'w-[150px] sm:w-[170px]'
          : 'w-[170px] sm:w-[195px] md:w-[210px]'
      }`}
    >
      {/* Poster Media */}
      <div
        className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900 cursor-pointer"
        onClick={() => setSelectedDetailMedia(media)}
      >
        <img
          src={posterUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Flat Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Quality / VIP Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {media.isPremiumOnly && (
            <span className="px-2 py-0.5 rounded-lg bg-green-500 text-black text-[10px] font-black flex items-center space-x-1">
              <Crown className="w-2.5 h-2.5" />
              <span>VIP</span>
            </span>
          )}
          {/* Season badges for series: S01, S02... */}
          {visibleSeasonBadges.map((sn) => (
            <span
              key={sn}
              className="px-1.5 py-0.5 rounded-md bg-purple-500/90 text-white text-[9px] font-black tracking-wide"
              title={`Season ${String(sn).padStart(2, '0')}`}
            >
              {formatSeason(sn)}
            </span>
          ))}
          {hiddenSeasonCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-purple-500/90 text-white text-[9px] font-black">
              +{hiddenSeasonCount}
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded-md bg-black/80 border border-zinc-700 text-white text-[9px] font-bold">
            {media.quality || 'HD'}
          </span>
        </div>

        {/* Top Right Rating */}
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 border border-zinc-700 text-amber-400 text-[11px] font-bold flex items-center space-x-1 z-10">
          <Star className="w-3 h-3 fill-amber-400" />
          <span>{(media.rating ?? 0).toFixed(1)}</span>
        </div>

        {/* Quick Play Hover Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            startPlayback(media);
          }}
          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-green-500 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100 cursor-pointer z-20 border border-green-400"
          title="Play"
        >
          <Play className="w-5 h-5 fill-black ml-0.5" />
        </button>

        {/* Bottom Poster Info (Interpreter) */}
        {media.interpreter && (
          <div className="absolute bottom-2 left-2 right-2 z-10">
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-zinc-950/90 border border-green-500/30 text-green-400 text-[10px] font-semibold truncate max-w-full">
              <Volume2 className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{media.interpreter}</span>
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3">
        {/* Title */}
        <h3
          onClick={() => setSelectedDetailMedia(media)}
          className="font-bold text-sm text-white line-clamp-1 cursor-pointer hover:text-green-400 transition-colors"
          title={title}
        >
          {title}
        </h3>

        {/* Card Footer Details */}
        <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400 font-medium">
          <div className="flex items-center space-x-1.5">
            <span>{media.year}</span>
            <span>•</span>
            <span className="truncate max-w-[80px]">
              {media.type === 'series'
                ? `Season ${String(seasonNumbers.length || 1).padStart(2, '0')}`
                : media.duration}
            </span>
          </div>

          {/* Watchlist toggle icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWatchlist(media.id);
            }}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isSaved ? 'text-green-400 bg-green-500/10' : 'text-zinc-500 hover:text-white'
            }`}
            title={isSaved ? 'Remove from list' : 'Add to list'}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
