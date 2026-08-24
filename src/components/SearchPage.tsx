import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ContentCard } from './ContentCard';
import { ChannelLogo } from './ChannelLogo';
import { MediaItem, LiveChannel } from '../types';
import {
  Search,
  Filter,
  X,
  Sparkles,
  Volume2,
  Tv,
  Film,
  Radio,
  Play,
  RotateCw
} from 'lucide-react';

export const SearchPage: React.FC = () => {
  const {
    movies,
    channels,
    startChannelPlayback,
    language,
    t,
    searchQuery,
    setSearchQuery
  } = useApp();

  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'series' | 'livetv'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedInterpreter, setSelectedInterpreter] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Backend Search State
  const [isSearchingBackend, setIsSearchingBackend] = useState<boolean>(false);
  const [backendMovies, setBackendMovies] = useState<MediaItem[] | null>(null);
  const [backendChannels, setBackendChannels] = useState<LiveChannel[] | null>(null);

  const genresList = [
    'all',
    'Action',
    'Drama',
    'Horror',
    'Comedy',
    'Korean Drama',
    'African Movies',
    'Sci-Fi',
    'Agasobanuye'
  ];

  const interpretersList = ['all', 'Rocky Kimomo', 'Junior Giti', 'Sankara', 'Yanga'];
  const yearsList = ['all', '2024', '2023', '2022'];

  // Query Backend /api/media/search on input change
  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const fetchBackendResults = async () => {
      setIsSearchingBackend(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append('q', searchQuery.trim());
        if (selectedType !== 'all') params.append('type', selectedType);
        if (selectedGenre !== 'all') params.append('genre', selectedGenre);
        if (selectedInterpreter !== 'all') params.append('interpreter', selectedInterpreter);

        const res = await fetch(`/api/media/search?${params.toString()}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && !isCancelled) {
            setBackendMovies(data.movies);
            setBackendChannels(data.channels);
          }
        }
      } catch {
        // Fallback to local filtering
      } finally {
        if (!isCancelled) {
          setIsSearchingBackend(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchBackendResults();
    }, 200);

    return () => {
      isCancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery, selectedType, selectedGenre, selectedInterpreter]);

  // Source list of movies (prefer backend response, fallback to context state)
  const sourceMovies = backendMovies !== null ? backendMovies : movies;
  const sourceChannels = backendChannels !== null ? backendChannels : channels;

  // Filter movies and series
  const filteredMovies = useMemo(() => {
    return sourceMovies.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.titleRw && item.titleRw.toLowerCase().includes(q)) ||
        (item.interpreter && item.interpreter.toLowerCase().includes(q)) ||
        (item.cast && item.cast.some((c) => c.toLowerCase().includes(q))) ||
        (item.genres && item.genres.some((g) => g.toLowerCase().includes(q)));

      const matchesType = selectedType === 'all' || item.type === selectedType;

      const matchesGenre =
        selectedGenre === 'all' || (item.genres && item.genres.includes(selectedGenre));

      const matchesInterpreter =
        selectedInterpreter === 'all' ||
        (item.interpreter && item.interpreter.toLowerCase() === selectedInterpreter.toLowerCase());

      const matchesYear =
        selectedYear === 'all' || (item.year && item.year.toString() === selectedYear);

      return (
        matchesQuery &&
        matchesType &&
        matchesGenre &&
        matchesInterpreter &&
        matchesYear
      );
    });
  }, [sourceMovies, searchQuery, selectedType, selectedGenre, selectedInterpreter, selectedYear]);

  // Filter and sort channels alphabetically
  const filteredChannels = useMemo(() => {
    if (selectedType === 'movie' || selectedType === 'series') return [];
    return sourceChannels
      .filter((ch) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          !q ||
          ch.name.toLowerCase().includes(q) ||
          ch.category.toLowerCase().includes(q) ||
          (ch.categoryRw && ch.categoryRw.toLowerCase().includes(q)) ||
          ch.country.toLowerCase().includes(q) ||
          (ch.countryCode && ch.countryCode.toLowerCase().includes(q)) ||
          (ch.currentProgram && ch.currentProgram.toLowerCase().includes(q)) ||
          (ch.currentProgramRw && ch.currentProgramRw.toLowerCase().includes(q)) ||
          (ch.nextProgram && ch.nextProgram.toLowerCase().includes(q)) ||
          (ch.nextProgramRw && ch.nextProgramRw.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
  }, [sourceChannels, searchQuery, selectedType]);

  const totalCount =
    (selectedType !== 'livetv' ? filteredMovies.length : 0) +
    (selectedType === 'all' || selectedType === 'livetv' ? filteredChannels.length : 0);

  const clearAllFilters = () => {
    setSelectedType('all');
    setSelectedGenre('all');
    setSelectedInterpreter('all');
    setSelectedYear('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedType !== 'all' ||
    selectedGenre !== 'all' ||
    selectedInterpreter !== 'all' ||
    selectedYear !== 'all' ||
    searchQuery !== '';

  return (
    <div className="space-y-6 pb-12">
      {/* Search Header Bar */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-[#111111] p-5 sm:p-6">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            autoFocus
            className="w-full pl-12 pr-12 py-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Badges Row */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center mr-1">
            <Filter className="w-3 h-3 mr-1" />
            {t('filters')}:
          </span>

          {/* Type Buttons */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: t('tabAll') },
              { id: 'movie', label: t('tabMovies') },
              { id: 'series', label: t('tabSeries') },
              { id: 'livetv', label: t('tabLiveTV') }
            ].map((tp) => (
              <button
                key={tp.id}
                onClick={() => setSelectedType(tp.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedType === tp.id
                    ? 'border-green-500 bg-green-500 text-black font-bold'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                {tp.label}
              </button>
            ))}
          </div>

          {/* Interpreter Pills (Agasobanuye) */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            {interpretersList.map((interp) => (
              <button
                key={interp}
                onClick={() => setSelectedInterpreter(interp)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center space-x-1 ${
                  selectedInterpreter === interp
                    ? 'border-green-500 bg-green-500/20 text-green-400 font-bold'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                {interp !== 'all' && <Volume2 className="w-2.5 h-2.5" />}
                <span>{interp === 'all' ? 'All Interpreters' : interp}</span>
              </button>
            ))}
          </div>

          {/* Genre Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            {genresList.slice(0, 6).map((gen) => (
              <button
                key={gen}
                onClick={() => setSelectedGenre(gen)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedGenre === gen
                    ? 'border-green-500 bg-green-500/20 text-green-400 font-bold'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                {gen === 'all' ? 'All Genres' : gen}
              </button>
            ))}
          </div>

          {/* Clear Filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm sm:text-base font-bold text-zinc-300 flex items-center space-x-2">
          <span>
            <span className="text-green-400 font-extrabold">{totalCount}</span> {t('resultsCount')}
          </span>
          {isSearchingBackend && (
            <RotateCw className="w-3.5 h-3.5 text-zinc-500 animate-spin" />
          )}
        </h2>
      </div>

      {/* No Results Fallback */}
      {totalCount === 0 && !isSearchingBackend && (
        <div className="text-center py-16 px-4 bg-[#111111] border border-zinc-800 rounded-3xl">
          <Search className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">{t('noResults')}</h3>
          <p className="text-xs text-zinc-400 mb-4 max-w-sm mx-auto">
            {language === 'rw'
              ? 'Gerageza gushakisha izina rya filme, uwasobanuye nka Rocky cyangwa Junior, cyangwa uhitemo ibindi byiciro.'
              : 'Try searching for movie titles, Rwandan interpreters (Rocky, Junior, Sankara), or adjusting your filter categories.'}
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 rounded-xl bg-green-500 text-black text-xs font-bold cursor-pointer"
          >
            {t('clearFilters')}
          </button>
        </div>
      )}

      {/* Movies & Series Grid */}
      {selectedType !== 'livetv' && filteredMovies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-zinc-400 uppercase">
            <Film className="w-3.5 h-3.5 text-green-400" />
            <span>{t('tabMovies')} & {t('tabSeries')} ({filteredMovies.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredMovies.map((item) => (
              <ContentCard key={item.id} media={item} />
            ))}
          </div>
        </div>
      )}

      {/* Live TV Channels Grid (if matches) */}
      {(selectedType === 'all' || selectedType === 'livetv') && filteredChannels.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-zinc-900">
          <div className="flex items-center space-x-2 text-xs font-bold text-zinc-400 uppercase">
            <Tv className="w-3.5 h-3.5 text-red-500" />
            <span>{t('liveChannels')} ({filteredChannels.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredChannels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => startChannelPlayback(channel)}
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#111111] border border-zinc-800 hover:border-green-500/60 transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <ChannelLogo
                      channel={channel}
                      size="sm"
                      className="w-full h-full rounded-xl"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-green-400 transition-colors">
                      {channel.name}
                    </h4>
                    <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400 mt-0.5">
                      <span>{channel.country}</span>
                      <span>•</span>
                      <span>{channel.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded-md bg-red-600/20 text-red-500 border border-red-500/30 text-[9px] font-black uppercase flex items-center space-x-1">
                    <Radio className="w-2 h-2" />
                    <span>LIVE</span>
                  </span>
                  <div className="w-7 h-7 rounded-full bg-zinc-900 group-hover:bg-green-500 group-hover:text-black text-white flex items-center justify-center transition-colors">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
