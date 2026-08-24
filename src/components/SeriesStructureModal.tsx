import React, { useState } from 'react';
import {
  Tv,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Play,
  Check,
  X,
  FolderPlus,
  Sparkles,
  Film,
  Video,
  ListPlus,
  Clock,
  ExternalLink
} from 'lucide-react';
import { MediaItem, Season, Episode, MediaPart, ContentStatus } from '../types';
import { CatalogItemPickerModal } from './CatalogItemPickerModal';

interface SeriesStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  series: MediaItem;
  catalog: MediaItem[];
  onSaveSeries: (updatedSeries: MediaItem) => void;
  onTestPlayback?: (media: MediaItem, episode?: Episode) => void;
}

export const SeriesStructureModal: React.FC<SeriesStructureModalProps> = ({
  isOpen,
  onClose,
  series,
  catalog,
  onSaveSeries,
  onTestPlayback
}) => {
  const [currentSeries, setCurrentSeries] = useState<MediaItem>(() => ({
    ...series,
    seasons: series.seasons && series.seasons.length > 0
      ? series.seasons
      : [
          {
            id: `sea_${Date.now()}_1`,
            seasonNumber: 1,
            title: 'Season 1',
            description: `${series.title} Season 1`,
            status: 'published',
            createdAt: series.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            episodes: series.episodes || []
          }
        ],
    parts: series.parts || []
  }));

  const [activeTab, setActiveTab] = useState<'seasons' | 'parts'>('seasons');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(() => {
    return currentSeries.seasons?.[0]?.id || '';
  });

  // Modals inside structure
  const [showAddSeasonModal, setShowAddSeasonModal] = useState(false);
  const [newSeasonTitle, setNewSeasonTitle] = useState('');
  const [newSeasonDesc, setNewSeasonDesc] = useState('');

  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [epTitle, setEpTitle] = useState('');
  const [epDesc, setEpDesc] = useState('');
  const [epVideoUrl, setEpVideoUrl] = useState('');
  const [epDuration, setEpDuration] = useState('45m');
  const [epThumbnail, setEpThumbnail] = useState('');
  const [epIsVIP, setEpIsVIP] = useState(false);

  const [showCatalogPicker, setShowCatalogPicker] = useState(false);

  const [showPartModal, setShowPartModal] = useState(false);
  const [editingPart, setEditingPart] = useState<MediaPart | null>(null);
  const [partTitle, setPartTitle] = useState('');
  const [partDesc, setPartDesc] = useState('');
  const [partVideoUrl, setPartVideoUrl] = useState('');
  const [partDuration, setPartDuration] = useState('1h 30m');
  const [partPoster, setPartPoster] = useState('');

  if (!isOpen) return null;

  const currentSeason = currentSeries.seasons?.find((s) => s.id === selectedSeasonId) || currentSeries.seasons?.[0];

  // Helper to persist series updates
  const updateAndSaveSeries = (updated: MediaItem) => {
    const now = new Date().toISOString();
    // Keep a FLAT episodes mirror in sync with seasons so playback, grids,
    // and Continue Watching always see every episode, each stamped with its
    // season number and inheriting the series artwork when it has none.
    const flatEpisodes: Episode[] = (updated.seasons || []).flatMap((s) =>
      (s.episodes || []).map((ep) => ({
        ...ep,
        season: ep.season || s.seasonNumber,
        thumbnail: ep.thumbnail || ep.poster || updated.backdrop || updated.poster || '',
        poster: ep.poster || ep.thumbnail || updated.poster || updated.backdrop || ''
      }))
    );
    const clean: MediaItem = {
      ...updated,
      updatedAt: now,
      seasonsCount: updated.seasons?.length || 0,
      episodesCount: updated.seasons?.reduce((sum, s) => sum + (s.episodes?.length || 0), 0) || 0,
      partsCount: updated.parts?.length || 0,
      episodes: flatEpisodes.length > 0 ? flatEpisodes : undefined
    };
    setCurrentSeries(clean);
    onSaveSeries(clean);
  };

  // 1. ADD SEASON
  const handleAddSeason = (e: React.FormEvent) => {
    e.preventDefault();
    const nextSeasonNum = (currentSeries.seasons?.length || 0) + 1;
    const newSeason: Season = {
      id: `sea_${Date.now()}_${nextSeasonNum}`,
      seasonNumber: nextSeasonNum,
      title: newSeasonTitle.trim() || `Season ${nextSeasonNum}`,
      description: newSeasonDesc.trim() || `${currentSeries.title} Season ${nextSeasonNum}`,
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      episodes: []
    };

    const updatedSeasons = [...(currentSeries.seasons || []), newSeason];
    const updated = {
      ...currentSeries,
      seasons: updatedSeasons
    };
    updateAndSaveSeries(updated);
    setSelectedSeasonId(newSeason.id);
    setShowAddSeasonModal(false);
    setNewSeasonTitle('');
    setNewSeasonDesc('');
  };

  const handleDeleteSeason = (seasonId: string) => {
    if (!currentSeries.seasons || currentSeries.seasons.length <= 1) {
      alert('A series must have at least one season.');
      return;
    }
    const updatedSeasons = currentSeries.seasons.filter((s) => s.id !== seasonId);
    const updated = {
      ...currentSeries,
      seasons: updatedSeasons
    };
    updateAndSaveSeries(updated);
    setSelectedSeasonId(updatedSeasons[0].id);
  };

  // 2. EPISODES
  const openAddEpisodeModal = () => {
    if (!currentSeason) return;
    const nextEpNum = (currentSeason.episodes?.length || 0) + 1;
    setEditingEpisode(null);
    setEpTitle(`Episode ${nextEpNum}`);
    setEpDesc('');
    setEpVideoUrl('');
    setEpDuration('45m');
    // Episodes inherit the series artwork so season & episode cards stay consistent
    setEpThumbnail(currentSeries.backdrop || currentSeries.poster || '');
    setEpIsVIP(false);
    setShowEpisodeModal(true);
  };

  const openEditEpisodeModal = (ep: Episode) => {
    setEditingEpisode(ep);
    setEpTitle(ep.title);
    setEpDesc(ep.synopsis || ep.description || '');
    setEpVideoUrl(ep.videoUrl);
    setEpDuration(ep.duration || '45m');
    setEpThumbnail(ep.thumbnail || ep.poster || '');
    setEpIsVIP(Boolean(ep.isPremium));
    setShowEpisodeModal(true);
  };

  const handleSaveEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSeason) return;

    const now = new Date().toISOString();
    let updatedEpisodes: Episode[] = [];

    if (editingEpisode) {
      updatedEpisodes = (currentSeason.episodes || []).map((ep) => {
        if (ep.id === editingEpisode.id) {
          return {
            ...ep,
            title: epTitle.trim(),
            synopsis: epDesc.trim(),
            description: epDesc.trim(),
            videoUrl: epVideoUrl.trim(),
            duration: epDuration.trim() || '45m',
            thumbnail: epThumbnail.trim() || currentSeries.backdrop || currentSeries.poster,
            poster: epThumbnail.trim() || currentSeries.poster || currentSeries.backdrop,
            isPremium: epIsVIP,
            updatedAt: now
          };
        }
        return ep;
      });
    } else {
      const nextEpNum = (currentSeason.episodes?.length || 0) + 1;
      const newEp: Episode = {
        id: `ep_${Date.now()}_${nextEpNum}`,
        season: currentSeason.seasonNumber,
        episodeNumber: nextEpNum,
        title: epTitle.trim() || `Episode ${nextEpNum}`,
        synopsis: epDesc.trim(),
        description: epDesc.trim(),
        videoUrl: epVideoUrl.trim(),
        duration: epDuration.trim() || '45m',
        thumbnail: epThumbnail.trim() || currentSeries.backdrop || currentSeries.poster,
        poster: epThumbnail.trim() || currentSeries.poster || currentSeries.backdrop,
        isPremium: epIsVIP,
        status: 'published',
        createdAt: now,
        updatedAt: now
      };
      updatedEpisodes = [...(currentSeason.episodes || []), newEp];
    }

    const updatedSeasons = (currentSeries.seasons || []).map((s) =>
      s.id === currentSeason.id ? { ...s, episodes: updatedEpisodes, updatedAt: now } : s
    );

    updateAndSaveSeries({
      ...currentSeries,
      seasons: updatedSeasons
    });

    setShowEpisodeModal(false);
  };

  const handleDeleteEpisode = (episodeId: string) => {
    if (!currentSeason) return;
    const updatedEpisodes = (currentSeason.episodes || []).filter((ep) => ep.id !== episodeId);
    const updatedSeasons = (currentSeries.seasons || []).map((s) =>
      s.id === currentSeason.id ? { ...s, episodes: updatedEpisodes } : s
    );
    updateAndSaveSeries({
      ...currentSeries,
      seasons: updatedSeasons
    });
  };

  // Attach from catalog
  const handleSelectFromCatalog = (catalogItem: MediaItem) => {
    if (!currentSeason) return;
    const now = new Date().toISOString();
    const nextEpNum = (currentSeason.episodes?.length || 0) + 1;

    const referencedEp: Episode = {
      id: `ep_cat_${Date.now()}_${catalogItem.id}`,
      season: currentSeason.seasonNumber,
      episodeNumber: nextEpNum,
      title: catalogItem.title,
      titleRw: catalogItem.titleRw,
      synopsis: catalogItem.synopsis,
      description: catalogItem.synopsis,
      videoUrl: catalogItem.videoUrl,
      duration: catalogItem.duration || '1h 30m',
      thumbnail: catalogItem.poster,
      poster: catalogItem.poster,
      catalogRefId: catalogItem.id,
      isPremium: catalogItem.isPremiumOnly,
      status: 'published',
      createdAt: now,
      updatedAt: now
    };

    const updatedEpisodes = [...(currentSeason.episodes || []), referencedEp];
    const updatedSeasons = (currentSeries.seasons || []).map((s) =>
      s.id === currentSeason.id ? { ...s, episodes: updatedEpisodes, updatedAt: now } : s
    );

    updateAndSaveSeries({
      ...currentSeries,
      seasons: updatedSeasons
    });
  };

  // 3. PARTS
  const openAddPartModal = () => {
    const nextPartNum = (currentSeries.parts?.length || 0) + 1;
    setEditingPart(null);
    setPartTitle(`Part ${nextPartNum}`);
    setPartDesc('');
    setPartVideoUrl('');
    setPartDuration('1h 30m');
    setPartPoster(currentSeries.poster || '');
    setShowPartModal(true);
  };

  const openEditPartModal = (part: MediaPart) => {
    setEditingPart(part);
    setPartTitle(part.title);
    setPartDesc(part.description || '');
    setPartVideoUrl(part.videoUrl);
    setPartDuration(part.duration || '1h 30m');
    setPartPoster(part.poster || currentSeries.poster || '');
    setShowPartModal(true);
  };

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    let updatedParts: MediaPart[] = [];

    if (editingPart) {
      updatedParts = (currentSeries.parts || []).map((p) => {
        if (p.id === editingPart.id) {
          return {
            ...p,
            title: partTitle.trim(),
            description: partDesc.trim(),
            videoUrl: partVideoUrl.trim(),
            duration: partDuration.trim() || '1h 30m',
            poster: partPoster.trim() || currentSeries.poster,
            updatedAt: now
          };
        }
        return p;
      });
    } else {
      const nextPartNum = (currentSeries.parts?.length || 0) + 1;
      const newPart: MediaPart = {
        id: `part_${Date.now()}_${nextPartNum}`,
        partNumber: nextPartNum,
        title: partTitle.trim() || `Part ${nextPartNum}`,
        description: partDesc.trim(),
        videoUrl: partVideoUrl.trim(),
        duration: partDuration.trim() || '1h 30m',
        poster: partPoster.trim() || currentSeries.poster,
        status: 'published',
        createdAt: now,
        updatedAt: now
      };
      updatedParts = [...(currentSeries.parts || []), newPart];
    }

    updateAndSaveSeries({
      ...currentSeries,
      parts: updatedParts
    });

    setShowPartModal(false);
  };

  const handleDeletePart = (partId: string) => {
    const updatedParts = (currentSeries.parts || []).filter((p) => p.id !== partId);
    updateAndSaveSeries({
      ...currentSeries,
      parts: updatedParts
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#111111] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh] my-auto flex flex-col space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3.5 min-w-0">
            <img
              src={currentSeries.poster}
              alt={currentSeries.title}
              className="w-12 h-16 object-cover rounded-xl border border-zinc-800 bg-zinc-900 flex-shrink-0 shadow"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase">
                  Series Structure
                </span>
                <span className="text-zinc-500 text-xs">•</span>
                <span className="text-zinc-400 text-xs">
                  {currentSeries.seasons?.length || 0} Seasons • {currentSeries.episodesCount || 0} Episodes • {currentSeries.parts?.length || 0} Parts
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight truncate mt-0.5">
                {currentSeries.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {/* View Mode Tabs */}
            <div className="flex p-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <button
                onClick={() => setActiveTab('seasons')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'seasons'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Seasons & Episodes
              </button>
              <button
                onClick={() => setActiveTab('parts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'parts'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Multi-Parts ({currentSeries.parts?.length || 0})
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ---------------- SEASONS & EPISODES TAB ---------------- */}
        {activeTab === 'seasons' && (
          <div className="space-y-4">
            {/* Season Selector Bar */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center space-x-2 overflow-x-auto">
                {(currentSeries.seasons || []).map((s) => {
                  const isSel = s.id === selectedSeasonId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeasonId(s.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
                        isSel
                          ? 'border-blue-500 bg-blue-500/15 text-blue-400 shadow-sm'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <span>{s.title || `Season ${s.seasonNumber}`}</span>
                      <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-300">
                        {s.episodes?.length || 0} eps
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => setShowAddSeasonModal(true)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-blue-500 text-blue-400 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Season</span>
                </button>
              </div>
            </div>

            {/* Current Season Details & Actions */}
            {currentSeason ? (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                      <span>{currentSeason.title || `Season ${currentSeason.seasonNumber}`}</span>
                      <span className="text-zinc-500 text-xs font-normal">
                        ({currentSeason.episodes?.length || 0} Episodes Published)
                      </span>
                    </h4>
                    {currentSeason.description && (
                      <p className="text-xs text-zinc-400 mt-0.5">{currentSeason.description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 flex-wrap">
                    {/* Add From Catalog */}
                    <button
                      onClick={() => setShowCatalogPicker(true)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-green-500 text-green-400 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all"
                      title="Link existing catalog video without re-uploading"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Add From Catalog</span>
                    </button>

                    {/* Add New Episode */}
                    <button
                      onClick={openAddEpisodeModal}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Episode</span>
                    </button>

                    {/* Delete Season */}
                    {(currentSeries.seasons || []).length > 1 && (
                      <button
                        onClick={() => handleDeleteSeason(currentSeason.id)}
                        className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer"
                        title="Delete Season"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Episode List */}
                <div className="space-y-2.5">
                  {(!currentSeason.episodes || currentSeason.episodes.length === 0) ? (
                    <div className="py-10 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-2xl">
                      No episodes added yet for {currentSeason.title || `Season ${currentSeason.seasonNumber}`}.
                      <div className="mt-2 flex justify-center space-x-3">
                        <button
                          onClick={openAddEpisodeModal}
                          className="text-blue-400 font-bold hover:underline"
                        >
                          + Add First Episode
                        </button>
                        <span>or</span>
                        <button
                          onClick={() => setShowCatalogPicker(true)}
                          className="text-green-400 font-bold hover:underline"
                        >
                          Select From Catalog
                        </button>
                      </div>
                    </div>
                  ) : (
                    currentSeason.episodes.map((ep) => (
                      <div
                        key={ep.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#111111] border border-zinc-800/90 hover:border-zinc-700 transition-all gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {ep.thumbnail ? (
                            <img
                              src={ep.thumbnail}
                              alt={ep.title}
                              className="w-14 h-10 object-cover rounded-lg bg-zinc-900 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-600 flex-shrink-0">
                              <Video className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300">
                                S{ep.season || currentSeason.seasonNumber} • EP{ep.episodeNumber}
                              </span>
                              <h5 className="text-xs font-bold text-white truncate">{ep.title}</h5>
                              {ep.catalogRefId && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-green-500/20 text-green-400 font-medium">
                                  Catalog Link
                                </span>
                              )}
                              {ep.isPremium && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-green-500 text-black font-black">
                                  VIP
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-[10px] text-zinc-500 mt-1 font-mono truncate">
                              <span>⏱️ {ep.duration || '45m'}</span>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">{ep.videoUrl}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 self-end sm:self-auto flex-shrink-0">
                          {onTestPlayback && (
                            <button
                              onClick={() => onTestPlayback(currentSeries, ep)}
                              className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-green-400 text-xs flex items-center space-x-1 cursor-pointer"
                              title="Test Episode Stream"
                            >
                              <Play className="w-3 h-3" />
                              <span className="text-[10px]">Test</span>
                            </button>
                          )}

                          <button
                            onClick={() => openEditEpisodeModal(ep)}
                            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
                            title="Edit Episode"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteEpisode(ep.id)}
                            className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                            title="Delete Episode"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ---------------- MULTI-PARTS TAB ---------------- */}
        {activeTab === 'parts' && (
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div>
                <h4 className="text-sm font-extrabold text-white">Multi-Part Management</h4>
                <p className="text-xs text-zinc-400">Add sequential chapters (Part 1, Part 2, Part 3...)</p>
              </div>
              <button
                onClick={openAddPartModal}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Part</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {(!currentSeries.parts || currentSeries.parts.length === 0) ? (
                <div className="py-12 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-2xl">
                  No parts created yet.
                  <div className="mt-2">
                    <button onClick={openAddPartModal} className="text-blue-400 font-bold hover:underline">
                      + Add Part 1
                    </button>
                  </div>
                </div>
              ) : (
                currentSeries.parts.map((part) => (
                  <div
                    key={part.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#111111] border border-zinc-800 hover:border-zinc-700 transition-all gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {part.poster ? (
                        <img
                          src={part.poster}
                          alt={part.title}
                          className="w-14 h-10 object-cover rounded-lg bg-zinc-900 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-600 flex-shrink-0">
                          <Film className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase">
                            PART {part.partNumber}
                          </span>
                          <h5 className="text-xs font-bold text-white truncate">{part.title}</h5>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-zinc-500 mt-1 font-mono truncate">
                          <span>⏱️ {part.duration || '1h 30m'}</span>
                          <span>•</span>
                          <span className="truncate max-w-[220px]">{part.videoUrl}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 self-end sm:self-auto flex-shrink-0">
                      {onTestPlayback && (
                        <button
                          onClick={() =>
                            onTestPlayback({
                              id: part.id,
                              title: `${currentSeries.title} - ${part.title}`,
                              type: 'movie',
                              poster: part.poster || currentSeries.poster,
                              videoUrl: part.videoUrl,
                              year: currentSeries.year,
                              rating: currentSeries.rating,
                              genres: currentSeries.genres,
                              synopsis: part.description || currentSeries.synopsis,
                              viewsCount: 0,
                              createdAt: new Date().toISOString()
                            })
                          }
                          className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-green-400 text-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          <span className="text-[10px]">Test</span>
                        </button>
                      )}

                      <button
                        onClick={() => openEditPartModal(part)}
                        className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
                        title="Edit Part"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeletePart(part.id)}
                        className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                        title="Delete Part"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div className="text-[11px] text-zinc-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Changes are synchronized live to the NetStudio central database.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold text-xs hover:bg-zinc-800 cursor-pointer"
          >
            Done Managing
          </button>
        </div>
      </div>

      {/* ---------------- ADD SEASON SUB-MODAL ---------------- */}
      {showAddSeasonModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm bg-[#181818] border border-zinc-700 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white">Add New Season</h4>
            <form onSubmit={handleAddSeason} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Season Title (Auto: Season {(currentSeries.seasons?.length || 0) + 1})
                </label>
                <input
                  type="text"
                  value={newSeasonTitle}
                  onChange={(e) => setNewSeasonTitle(e.target.value)}
                  placeholder={`Season ${(currentSeries.seasons?.length || 0) + 1}`}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newSeasonDesc}
                  onChange={(e) => setNewSeasonDesc(e.target.value)}
                  placeholder="e.g. The Tokyo Heist Chapter"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSeasonModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Create Season
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- ADD/EDIT EPISODE SUB-MODAL ---------------- */}
      {showEpisodeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-[#181818] border border-zinc-700 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white">
              {editingEpisode ? 'Edit Episode' : 'Add New Episode'}
            </h4>
            <form onSubmit={handleSaveEpisode} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Episode Title *</label>
                <input
                  type="text"
                  required
                  value={epTitle}
                  onChange={(e) => setEpTitle(e.target.value)}
                  placeholder="e.g. Episode 1 - The Plan"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Video Stream URL *</label>
                <input
                  type="text"
                  required
                  value={epVideoUrl}
                  onChange={(e) => setEpVideoUrl(e.target.value)}
                  placeholder="https://.../ep1.mp4 or .m3u8"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Duration</label>
                  <input
                    type="text"
                    value={epDuration}
                    onChange={(e) => setEpDuration(e.target.value)}
                    placeholder="45m"
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Thumbnail / Cover URL</label>
                  <input
                    type="text"
                    value={epThumbnail}
                    onChange={(e) => setEpThumbnail(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Episode Synopsis (Optional)</label>
                <textarea
                  rows={2}
                  value={epDesc}
                  onChange={(e) => setEpDesc(e.target.value)}
                  placeholder="Brief episode plot..."
                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white resize-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="epVip"
                  checked={epIsVIP}
                  onChange={(e) => setEpIsVIP(e.target.checked)}
                  className="w-4 h-4 accent-green-500 rounded"
                />
                <label htmlFor="epVip" className="text-zinc-300 font-semibold">
                  Requires VIP Subscription
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEpisodeModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Save Episode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- ADD/EDIT PART SUB-MODAL ---------------- */}
      {showPartModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-[#181818] border border-zinc-700 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white">
              {editingPart ? 'Edit Part' : 'Add New Multi-Part'}
            </h4>
            <form onSubmit={handleSavePart} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Part Title *</label>
                <input
                  type="text"
                  required
                  value={partTitle}
                  onChange={(e) => setPartTitle(e.target.value)}
                  placeholder="e.g. Part 1"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Video Stream URL *</label>
                <input
                  type="text"
                  required
                  value={partVideoUrl}
                  onChange={(e) => setPartVideoUrl(e.target.value)}
                  placeholder="https://.../part1.mp4"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Duration</label>
                  <input
                    type="text"
                    value={partDuration}
                    onChange={(e) => setPartDuration(e.target.value)}
                    placeholder="1h 30m"
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Cover Poster URL</label>
                  <input
                    type="text"
                    value={partPoster}
                    onChange={(e) => setPartPoster(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={partDesc}
                  onChange={(e) => setPartDesc(e.target.value)}
                  placeholder="Brief part plot..."
                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPartModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Save Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Catalog Selector Modal */}
      <CatalogItemPickerModal
        isOpen={showCatalogPicker}
        onClose={() => setShowCatalogPicker(false)}
        catalog={catalog}
        onSelect={handleSelectFromCatalog}
      />
    </div>
  );
};
