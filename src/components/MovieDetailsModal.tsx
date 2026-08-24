import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Episode, MediaPart } from '../types';
import {
  X,
  Play,
  Plus,
  Check,
  Download,
  RotateCw,
  Star,
  Clock,
  Sparkles,
  Volume2,
  Share2,
  Crown,
  Edit2,
  Trash2
} from 'lucide-react';
import { ContentCard } from './ContentCard';

export const MovieDetailsModal: React.FC = () => {
  const {
    selectedDetailMedia,
    setSelectedDetailMedia,
    startPlayback,
    isInWatchlist,
    toggleWatchlist,
    startDownload,
    downloads,
    movies,
    language,
    currentUser,
    setActiveNavTab,
    deleteMedia,
    adminToken,
    t
  } = useApp();

  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingSeason, setDownloadingSeason] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showAdminDeleteConfirm, setShowAdminDeleteConfirm] = useState<boolean>(false);

  // Merged episode catalog across BOTH storage layouts:
  // flat media.episodes AND seasons[].episodes, sorted S1E01 -> SxEx
  const allEpisodes = React.useMemo(() => {
    if (!selectedDetailMedia) return [];
    const fromSeasons = (selectedDetailMedia.seasons || []).flatMap((s) =>
      (s.episodes || []).map((ep) => ({ ...ep, season: ep.season || s.seasonNumber }))
    );
    return [...(selectedDetailMedia.episodes || []), ...fromSeasons]
      .filter((ep, i, arr) => arr.findIndex((e) => e.id === ep.id) === i)
      .sort(
        (a, b) =>
          ((a as Episode).season || 1) - ((b as Episode).season || 1) ||
          (a.episodeNumber || 0) - (b.episodeNumber || 0)
      );
  }, [selectedDetailMedia]);

  // "Watch Now" on a series ALWAYS auto-plays Season 1 - Episode 1
  const firstEpisode = allEpisodes[0];

  const availableSeasons = React.useMemo(
    () =>
      Array.from(
        new Set<number>(allEpisodes.map((ep) => ((ep as Episode).season ?? 1) as number))
      ).sort((a: number, b: number) => a - b),
    [allEpisodes]
  );

  // Opening a series always lands on its FIRST season with Episode 1 on top
  React.useEffect(() => {
    setSelectedSeason(availableSeasons[0] ?? 1);
  }, [selectedDetailMedia?.id]);

  if (!selectedDetailMedia) return null;

  const media = selectedDetailMedia;
  const isSaved = isInWatchlist(media.id);
  const title = language === 'rw' && media.titleRw ? media.titleRw : media.title;
  const synopsis = language === 'rw' && media.synopsisRw ? media.synopsisRw : media.synopsis;
  const genres = language === 'rw' && media.genresRw ? media.genresRw : media.genres;

  const isDownloaded = downloads.some((d) => d.mediaId === media.id);

  const isEpisodeDownloaded = (ep: Episode) =>
    downloads.some((d) => d.mediaId === media.id && d.season === ep.season && d.episodeNumber === ep.episodeNumber);

  // Similar movies
  const similarItems = movies
    .filter((m) => m.id !== media.id && m.genres.some((g) => media.genres.includes(g)))
    .slice(0, 5);

  const handleDownload = async (episode?: Episode) => {
    const idKey = episode ? episode.id : media.id;
    setDownloadingId(idKey);
    try {
      // Multi-part movies: save EVERY part as its own local file
      if (!episode && media.type === 'movie' && media.parts && media.parts.length > 0) {
        for (const part of media.parts) {
          const ok = await startDownload(media, undefined, part, { saveAs: false });
          if (!ok) break;
        }
        return;
      }
      await startDownload(media, episode);
    } finally {
      setTimeout(() => setDownloadingId((prev) => (prev === idKey ? null : prev)), 600);
    }
  };

  // Season download: saves EVERY episode of the selected season to the device
  const handleDownloadSeason = async () => {
    if (currentEpisodes.length === 0) return;
    setDownloadingSeason(`${currentEpisodes.length} files`);
    try {
      for (let i = 0; i < currentEpisodes.length; i++) {
        setDownloadingSeason(`E${currentEpisodes[i].episodeNumber} (${i + 1}/${currentEpisodes.length})`);
        // Batch mode: straight to the Downloads folder, no repeated Save As dialogs
        const ok = await startDownload(media, currentEpisodes[i], undefined, { saveAs: false });
        if (!ok) break;
      }
    } finally {
      setTimeout(() => setDownloadingSeason(null), 800);
    }
  };

  // Single part download (multi-part movies)
  const handlePartDownload = async (part: MediaPart) => {
    setDownloadingId(part.id);
    try {
      await startDownload(media, undefined, part);
    } finally {
      setTimeout(() => setDownloadingId((prev) => (prev === part.id ? null : prev)), 600);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const currentEpisodes = allEpisodes.filter(
    (ep) => ((ep as Episode).season || 1) === selectedSeason
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#111111] border border-zinc-800 rounded-3xl overflow-hidden shadow-none my-auto">
        {/* Close Button */}
        <button
          onClick={() => setSelectedDetailMedia(null)}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/80 hover:bg-black text-white border border-zinc-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Header */}
        <div className="relative w-full h-[260px] sm:h-[340px] md:h-[380px]">
          <img
            src={media.backdrop || media.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&auto=format&fit=crop&q=80'}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/90 via-[#111111]/40 to-transparent" />

          {/* Top Badges */}
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {media.isPremiumOnly && (
                <span className="px-2.5 py-0.5 rounded-lg bg-green-500 text-black text-xs font-black flex items-center space-x-1">
                  <Crown className="w-3 h-3" />
                  <span>VIP ONLY</span>
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-black/80 border border-zinc-700 text-white text-xs font-bold">
                {media.quality}
              </span>
              <span className="px-2 py-0.5 rounded-md border border-zinc-700 text-zinc-300 text-xs font-semibold">
                {media.ageRating}
              </span>
              {media.interpreter && (
                <span className="px-2.5 py-0.5 rounded-lg bg-black/80 border border-green-500/40 text-green-400 text-xs font-bold flex items-center space-x-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Agasobanuye: {media.interpreter}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-zinc-800/80">
            <div className="flex flex-wrap items-center gap-3">
              {/* Play Button — series auto-start at S1 E1 */}
              <button
                onClick={() => {
                  setSelectedDetailMedia(null);
                  startPlayback(media, media.type === 'series' ? firstEpisode : undefined);
                }}
                className="px-6 py-3 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-sm sm:text-base transition-colors flex items-center space-x-2 border border-green-400 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-black" />
                <span>{t('watchNow')}</span>
              </button>

              {/* Watchlist */}
              <button
                onClick={() => toggleWatchlist(media.id)}
                className={`px-4 py-3 rounded-2xl border transition-all text-sm font-semibold flex items-center space-x-2 cursor-pointer ${
                  isSaved
                    ? 'border-green-500 bg-green-500/15 text-green-400'
                    : 'border-zinc-700 bg-zinc-900/90 text-white hover:border-zinc-500'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t('inMyList')}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{t('myList')}</span>
                  </>
                )}
              </button>

              {/* Download — free for ALL users. Movies save every part;
                  series save the whole current season to the device. */}
              <button
                onClick={() => (media.type === 'series' ? handleDownloadSeason() : handleDownload())}
                disabled={downloadingId === media.id || Boolean(downloadingSeason)}
                className={`px-4 py-3 rounded-2xl border transition-all text-sm font-semibold flex items-center space-x-2 cursor-pointer ${
                  isDownloaded
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-400'
                    : 'border-zinc-700 bg-zinc-900/90 text-white hover:border-zinc-500'
                }`}
                title={
                  media.type === 'series'
                    ? 'Download all episodes of this season to your device'
                    : 'Save the movie file to your device'
                }
              >
                {downloadingId === media.id || downloadingSeason ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {media.type === 'series' && downloadingSeason
                    ? `S${String(selectedSeason).padStart(2, '0')} ${downloadingSeason}`
                    : downloadingId === media.id
                    ? t('downloading')
                    : isDownloaded
                    ? t('downloaded')
                    : t('download')}
                </span>
              </button>
            </div>

            {/* Share & Admin Actions */}
            <div className="flex items-center space-x-2">
              {/* Content management is ONLY for the authenticated Master Admin
                  session (role + server-issued token). Regular users never see it. */}
              {currentUser.role === 'admin' && adminToken && (
                <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <button
                    onClick={() => {
                      setSelectedDetailMedia(null);
                      setActiveNavTab('admin');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                    title="Edit in Admin Studio"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit as Admin</span>
                  </button>

                  <button
                    onClick={() => setShowAdminDeleteConfirm(true)}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                    title="Delete Title"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}

              <button
                onClick={handleShare}
                className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all cursor-pointer"
                title={t('share')}
              >
                {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Admin Delete Confirmation Inline Banner */}
          {showAdminDeleteConfirm && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Permanently Delete "{title}"?</h4>
                  <p className="text-xs text-zinc-400">This will remove this title from all mobile & desktop users immediately.</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowAdminDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteMedia(media.id);
                    setSelectedDetailMedia(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-colors cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          )}

          {/* Synopsis & Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center space-x-3 text-sm text-zinc-400">
                <div className="flex items-center text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 mr-1" />
                  <span>{(media.rating ?? 0).toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>{media.year}</span>
                <span>•</span>
                <span>{media.type === 'series' ? `${media.seasonsCount || 1} Seasons` : media.duration}</span>
                <span>•</span>
                <span className="text-zinc-300">{media.country}</span>
              </div>

              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                {synopsis}
              </p>
            </div>

            {/* Right Meta Column */}
            <div className="space-y-2.5 text-xs sm:text-sm bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/80">
              <div>
                <span className="text-zinc-500 font-medium">{t('genres')}: </span>
                <span className="text-zinc-200">{genres.join(', ')}</span>
              </div>
              {media.interpreter && (
                <div>
                  <span className="text-zinc-500 font-medium">{t('interpreter')}: </span>
                  <span className="text-green-400 font-bold">{media.interpreter}</span>
                </div>
              )}
              {media.cast && media.cast.length > 0 && (
                <div>
                  <span className="text-zinc-500 font-medium">{t('cast')}: </span>
                  <span className="text-zinc-300">{media.cast.join(', ')}</span>
                </div>
              )}
              {media.director && (
                <div>
                  <span className="text-zinc-500 font-medium">{t('director')}: </span>
                  <span className="text-zinc-300">{media.director}</span>
                </div>
              )}
            </div>
          </div>

          {/* Episodes List (for TV Series) */}
          {media.type === 'series' && allEpisodes.length > 0 && (
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span>{t('episodes')}</span>
                    <span className="text-xs text-zinc-500">({allEpisodes.length})</span>
                  </h3>

                  {/* Download whole season to device — free for everyone */}
                  {currentEpisodes.length > 0 && (
                    <button
                      onClick={handleDownloadSeason}
                      disabled={Boolean(downloadingSeason)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors flex items-center space-x-1.5 cursor-pointer ${
                        downloadingSeason
                          ? 'border-green-500/50 bg-green-500/10 text-green-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-green-500/50'
                      }`}
                      title={`Download all ${currentEpisodes.length} episodes of Season ${String(selectedSeason).padStart(2, '0')} to your device`}
                    >
                      {downloadingSeason ? (
                        <>
                          <RotateCw className="w-3 h-3 animate-spin" />
                          <span>{downloadingSeason}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" />
                          <span>Season {String(selectedSeason).padStart(2, '0')}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Season Switcher if multiple seasons */}
                {availableSeasons.length > 1 && (
                  <div className="flex items-center space-x-2">
                    {availableSeasons.map((seasonNum) => (
                      <button
                        key={seasonNum}
                        onClick={() => setSelectedSeason(seasonNum)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          selectedSeason === seasonNum
                            ? 'border-green-500 bg-green-500/20 text-green-400 font-bold'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Season {String(seasonNum).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Episodes Grid Cards */}
              <div className="space-y-3">
                {currentEpisodes.map((ep) => {
                  const epTitle = language === 'rw' && ep.titleRw ? ep.titleRw : ep.title;
                  const epSynopsis = language === 'rw' && ep.synopsisRw ? ep.synopsisRw : ep.synopsis;

                  return (
                    <div
                      key={ep.id}
                      onClick={() => {
                        setSelectedDetailMedia(null);
                        startPlayback(media, ep);
                      }}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-2xl bg-[#141414] border border-zinc-800/90 hover:border-green-500/60 transition-all cursor-pointer gap-4"
                    >
                      <div className="flex items-center space-x-4 w-full sm:w-auto">
                        <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0">
                          <img
                            src={ep.thumbnail || media.backdrop || media.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80'}
                            alt={epTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-6 h-6 fill-white text-white" />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-green-400">
                              E{ep.episodeNumber}
                            </span>
                            <h4 className="font-bold text-sm text-white group-hover:text-green-400 transition-colors">
                              {epTitle}
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 max-w-lg">
                            {epSynopsis}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-3 text-xs text-zinc-500 font-mono flex-shrink-0">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {ep.duration}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(ep);
                          }}
                          disabled={downloadingId === ep.id}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            downloadingId === ep.id
                              ? 'border-green-500/50 bg-green-500/10 text-green-400'
                              : isEpisodeDownloaded(ep)
                              ? 'border-green-500/40 bg-zinc-900 text-green-400'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-600'
                          }`}
                          title={
                            downloadingId === ep.id
                              ? 'Saving to device...'
                              : isEpisodeDownloaded(ep)
                              ? 'Saved to device — tap to re-download'
                              : 'Download episode to your device'
                          }
                        >
                          {downloadingId === ep.id ? (
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          ) : isEpisodeDownloaded(ep) ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Parts List (for Multi-Part Movies) */}
          {media.parts && media.parts.length > 0 && (
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Movie Parts</span>
                  <span className="text-xs text-zinc-500">({media.parts.length} parts)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {media.parts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedDetailMedia(null);
                      startPlayback(media, undefined, 0, p);
                    }}
                    className="p-3.5 rounded-2xl bg-[#141414] border border-zinc-800/90 hover:border-green-500/60 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-center font-black text-sm flex-shrink-0 group-hover:bg-green-500 group-hover:text-black transition-colors">
                        P{p.partNumber}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-green-400 transition-colors">
                          {p.title || `Part ${p.partNumber}`}
                        </h4>
                        <span className="text-[11px] text-zinc-500">{p.duration || 'Full Video'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePartDownload(p);
                        }}
                        disabled={downloadingId === p.id}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          downloadingId === p.id
                            ? 'border-green-500/50 bg-green-500/10 text-green-400'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-600'
                        }`}
                        title={
                          downloadingId === p.id
                            ? 'Saving to device...'
                            : 'Download this part to your device'
                        }
                      >
                        {downloadingId === p.id ? (
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <Play className="w-4 h-4 text-zinc-500 group-hover:text-green-400 group-hover:fill-green-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Titles */}
          {similarItems.length > 0 && (
            <div className="pt-4 border-t border-zinc-800">
              <h3 className="text-lg font-bold text-white mb-3">
                {t('similarTitles')}
              </h3>
              <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-1">
                {similarItems.map((item) => (
                  <ContentCard key={item.id} media={item} size="compact" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
