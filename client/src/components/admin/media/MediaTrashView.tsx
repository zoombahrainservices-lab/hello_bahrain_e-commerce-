'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { MediaItemWithVariants } from '@/lib/media/types';

interface TrashedItem extends MediaItemWithVariants {
  deletedAt: string;
  daysRemaining: number;
}

interface MediaTrashViewProps {
  onRestored: () => void; // refresh main library count
}

function getThumbnailUrl(item: TrashedItem): string | null {
  const thumb = item.variants.find((v) => v.variant === 'thumb');
  if (thumb) return thumb.publicUrl;
  return item.publicUrl;
}

function daysColor(days: number): string {
  if (days <= 7) return 'bg-red-100 text-red-700 border-red-200';
  if (days <= 20) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

export default function MediaTrashView({ onRestored }: MediaTrashViewProps) {
  const [items, setItems] = useState<TrashedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [emptying, setEmptying] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/media/trash');
      setItems(res.data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const restore = async (item: TrashedItem) => {
    setActionId(item.id);
    try {
      await api.post(`/api/admin/media/${item.id}/restore`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onRestored();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to restore.');
    } finally {
      setActionId(null);
    }
  };

  const permanentDelete = async (item: TrashedItem) => {
    if (!confirm(`Permanently delete "${item.title ?? item.originalFileName}"? This cannot be undone.`)) return;
    setActionId(item.id);
    try {
      await api.delete(`/api/admin/media/${item.id}/permanent-delete`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to delete.');
    } finally {
      setActionId(null);
    }
  };

  const emptyTrash = async () => {
    setEmptying(true);
    setConfirmEmpty(false);
    try {
      await api.delete('/api/admin/media/trash');
      setItems([]);
      onRestored();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to empty trash.');
    } finally {
      setEmptying(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Trash
            {items.length > 0 && (
              <span className="text-sm font-normal text-gray-400">
                · {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Items are permanently deleted after 60 days.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            {confirmEmpty ? (
              <>
                <span className="text-xs text-gray-500">Are you sure?</span>
                <button
                  onClick={emptyTrash}
                  disabled={emptying}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {emptying ? 'Emptying…' : 'Yes, empty trash'}
                </button>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmEmpty(true)}
                className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
              >
                Empty Trash
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border-2 border-gray-100 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-t-lg" />
                <div className="p-2 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <p className="text-lg font-medium text-gray-500">Trash is empty</p>
            <p className="text-sm mt-1">Deleted images will appear here for 60 days.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {items.map((item) => {
              const thumb = getThumbnailUrl(item);
              const busy = actionId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-lg overflow-hidden border-2 border-gray-200 bg-white group flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="aspect-square relative bg-gray-50 overflow-hidden">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.title ?? item.originalFileName}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Days remaining badge */}
                    <span className={`absolute top-1.5 left-1.5 text-xs px-1.5 py-0.5 rounded border font-medium ${daysColor(item.daysRemaining)}`}>
                      {item.daysRemaining}d left
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-2 flex-1">
                    <p className="text-xs font-medium text-gray-700 truncate" title={item.title ?? item.originalFileName}>
                      {item.title ?? item.originalFileName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Deleted {new Date(item.deletedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-gray-100">
                    <button
                      onClick={() => restore(item)}
                      disabled={busy}
                      title="Restore"
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-blue-600 hover:bg-blue-50 transition disabled:opacity-40"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Restore
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button
                      onClick={() => permanentDelete(item)}
                      disabled={busy}
                      title="Delete permanently"
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
