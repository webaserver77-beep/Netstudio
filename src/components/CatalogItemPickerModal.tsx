import React, { useState } from 'react';
import { Search, Film, Check, X, Play } from 'lucide-react';
import { MediaItem } from '../types';

interface CatalogItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: MediaItem[];
  onSelect: (item: MediaItem) => void;
}

export const CatalogItemPickerModal: React.FC<CatalogItemPickerModalProps> = ({
  isOpen,
  onClose,
  catalog,
  onSelect
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredItems = catalog.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      (item.titleRw && item.titleRw.toLowerCase().includes(q)) ||
      (item.interpreter && item.interpreter.toLowerCase().includes(q)) ||
      item.genres?.some((g) => g.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-[#111111] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">Add Episode From Catalog</h3>
            <p className="text-xs text-zinc-400">Select an existing video to reference without re-uploading</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog by title, interpreter, or genre..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
            autoFocus
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px] max-h-[350px]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No matching content found in catalog.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="group flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-green-500 hover:bg-green-500/5 transition-all cursor-pointer space-x-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded-xl bg-zinc-900 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600 flex-shrink-0">
                      <Film className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-green-400 truncate">
                      {item.title}
                    </h4>
                    {item.titleRw && (
                      <p className="text-[11px] text-zinc-400 truncate">{item.titleRw}</p>
                    )}
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-500 mt-0.5">
                      <span>{item.year}</span>
                      <span>•</span>
                      <span>{item.type.toUpperCase()}</span>
                      {item.interpreter && (
                        <>
                          <span>•</span>
                          <span className="text-green-400">{item.interpreter}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 group-hover:bg-green-500 group-hover:text-black text-zinc-300 text-xs font-bold transition-colors flex items-center space-x-1 flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Select</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
