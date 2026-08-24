import React from 'react';
import { useApp } from '../context/AppContext';
import { Play, Clock, ChevronRight } from 'lucide-react';

export const ContinueWatchingRow: React.FC = () => {
  const { continueWatching, startPlayback, language, t } = useApp();

  if (!continueWatching || continueWatching.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-green-500" />
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            {t('continueWatching')}
          </h2>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar py-1">
        {continueWatching.map((item) => {
          const media = item.media;
          const title = language === 'rw' && media.titleRw ? media.titleRw : media.title;

          // Look up episode across both flat and season-nested layouts
          const allEpisodes = [
            ...(media.episodes || []),
            ...(media.seasons || []).flatMap((s) =>
              (s.episodes || []).map((ep) => ({ ...ep, season: ep.season || s.seasonNumber }))
            )
          ];
          const episode = item.episodeId
            ? allEpisodes.find((ep) => ep.id === item.episodeId)
            : undefined;

          // Prefer persisted metadata, fall back to the resolved episode record
          const seasonNum = item.seasonNumber ?? episode?.season;
          const episodeNum = item.episodeNumber ?? episode?.episodeNumber;

          const imageSrc =
            (episode && episode.thumbnail && episode.thumbnail.trim() !== '' ? episode.thumbnail : null) ||
            (media.backdrop && media.backdrop.trim() !== '' ? media.backdrop : null) ||
            (media.poster && media.poster.trim() !== '' ? media.poster : null) ||
            'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';

          return (
            <div
              key={`${item.mediaId}-${item.episodeId || 'root'}`}
              onClick={() => startPlayback(media, episode, item.progressSeconds)}
              className="group flex-shrink-0 w-[240px] sm:w-[280px] bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:border-green-500/60 transition-all"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                <img
                  src={imageSrc}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Dark overlay with Play button */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-black flex items-center justify-center transform group-hover:scale-110 transition-transform border border-green-400">
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  </div>
                </div>

                {/* Episode Badge if Series */}
                {seasonNum && episodeNum && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 border border-zinc-700 text-white text-[10px] font-bold">
                    S{seasonNum} : E{episodeNum}
                  </div>
                )}

                {/* Watched % Tag */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 text-green-400 text-[10px] font-bold">
                  {item.progressPercentage}%
                </div>

                {/* Bottom Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${item.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Title & Info */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-green-400 transition-colors">
                    {title}
                  </h4>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white flex-shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                  {episode ? episode.title : media.genres.slice(0, 2).join(' • ')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
