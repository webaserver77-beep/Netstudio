import React from 'react';
import { useApp } from '../context/AppContext';
import { Download, Play, Trash2, ShieldCheck, Film, HardDrive } from 'lucide-react';

export const DownloadsPage: React.FC = () => {
  const { downloads, deleteDownload, movies, startPlayback, language, t, setActiveNavTab } = useApp();

  const totalSize = downloads.reduce((acc, d) => {
    const sizeInMb = d.fileSize.includes('GB')
      ? parseFloat(d.fileSize) * 1024
      : parseFloat(d.fileSize) || 500;
    return acc + sizeInMb;
  }, 0);

  const formattedTotal = (totalSize / 1024).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-[#111111] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500">
                <Download className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {t('myDownloads')}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">
              {language === 'rw'
                ? 'Filme wamanuye kuri telefone cyangwa mudasobwa yawe zo kureba utari kuri murandasi.'
                : 'Offline storage manager: Watch downloaded movies & series anytime without internet consumption.'}
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-xs">
            <HardDrive className="w-4 h-4 text-green-400" />
            <div>
              <div className="font-bold text-white">{downloads.length} Downloaded</div>
              <div className="text-[10px] text-zinc-400">{formattedTotal} GB stored</div>
            </div>
          </div>
        </div>
      </div>

      {/* Downloads List */}
      {downloads.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#111111] border border-zinc-800 rounded-3xl">
          <Download className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">{t('noDownloadsYet')}</h3>
          <p className="text-xs text-zinc-400 mb-4 max-w-sm mx-auto">
            {language === 'rw'
              ? 'Fungura filme yose wifuza maze ukande kuri "Kuramo (Download)" kugira ngo uyibike hano.'
              : 'Click "Download" on any movie or series to save it for smooth offline playback.'}
          </p>
          <button
            onClick={() => setActiveNavTab('home')}
            className="px-5 py-2.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs transition-colors cursor-pointer"
          >
            Browse Movies
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {downloads.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-[#111111] border border-zinc-800 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={item.poster || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&auto=format&fit=crop&q=80'}
                  alt={item.title}
                  className="w-14 sm:w-16 aspect-[2/3] object-cover rounded-xl bg-zinc-900 flex-shrink-0"
                />
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-white line-clamp-1">{item.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold">
                      {item.quality}
                    </span>
                    <span>{item.fileSize}</span>
                    <span>•</span>
                    <span className="text-zinc-500 font-mono">
                      {new Date(item.downloadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const original = movies.find((m) => m.id === item.mediaId);
                    if (original) {
                      startPlayback(original);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs flex items-center space-x-1.5 cursor-pointer border border-green-400"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>{t('play')}</span>
                </button>

                <button
                  onClick={() => deleteDownload(item.id)}
                  className="p-2.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
                  title="Remove from offline"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
