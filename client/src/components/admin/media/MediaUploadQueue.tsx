'use client';

import { useState, useCallback, useEffect } from 'react';
import { PendingFile } from './MediaUploadDropzone';
import { MediaItemWithVariants, UploadStatus } from '@/lib/media/types';

export interface UploadQueueItem {
  pendingId: string;
  file: File;
  previewUrl: string | null;
  status: UploadStatus;
  progress: number;
  error?: string;
  result?: MediaItemWithVariants;
  xhr?: XMLHttpRequest;
}

interface MediaUploadQueueProps {
  pending: PendingFile[];
  folderId?: string | null;
  altText?: string;
  title?: string;
  onUploaded: (item: MediaItemWithVariants) => void;
  onClearCompleted: () => void;
  authToken: string | null;
}

export default function MediaUploadQueue({
  pending,
  folderId,
  altText,
  title,
  onUploaded,
  onClearCompleted,
  authToken,
}: MediaUploadQueueProps) {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);

  // Add newly selected files to queue
  useEffect(() => {
    if (pending.length === 0) return;
    setQueue((prev) => {
      const existingIds = new Set(prev.map((q) => q.pendingId));
      const newItems: UploadQueueItem[] = pending
        .filter((p) => !existingIds.has(p.id))
        .map((p) => ({
          pendingId: p.id,
          file: p.file,
          previewUrl: p.previewUrl,
          status: 'queued',
          progress: 0,
        }));
      return [...prev, ...newItems];
    });
  }, [pending]);

  const uploadItem = useCallback(
    (item: UploadQueueItem) => {
      const formData = new FormData();
      formData.append('file', item.file);
      if (folderId) formData.append('folderId', folderId);
      if (altText) formData.append('altText', altText);
      if (title) formData.append('title', title);

      const xhr = new XMLHttpRequest();

      // Track per-item XHR reference for cancel
      setQueue((prev) =>
        prev.map((q) => (q.pendingId === item.pendingId ? { ...q, xhr, status: 'uploading' } : q)),
      );

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setQueue((prev) =>
            prev.map((q) => (q.pendingId === item.pendingId ? { ...q, progress } : q)),
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText) as MediaItemWithVariants;
            setQueue((prev) =>
              prev.map((q) =>
                q.pendingId === item.pendingId
                  ? { ...q, status: 'success', progress: 100, result }
                  : q,
              ),
            );
            onUploaded(result);
          } catch {
            setQueue((prev) =>
              prev.map((q) =>
                q.pendingId === item.pendingId
                  ? { ...q, status: 'failed', error: 'Invalid response from server.' }
                  : q,
              ),
            );
          }
        } else {
          let msg = 'Upload failed.';
          try {
            const parsed = JSON.parse(xhr.responseText);
            msg = parsed.message ?? msg;
          } catch {}
          setQueue((prev) =>
            prev.map((q) =>
              q.pendingId === item.pendingId ? { ...q, status: 'failed', error: msg } : q,
            ),
          );
        }
      };

      xhr.onerror = () => {
        setQueue((prev) =>
          prev.map((q) =>
            q.pendingId === item.pendingId
              ? { ...q, status: 'failed', error: 'Network error.' }
              : q,
          ),
        );
      };

      xhr.onabort = () => {
        setQueue((prev) =>
          prev.map((q) =>
            q.pendingId === item.pendingId ? { ...q, status: 'cancelled', progress: 0 } : q,
          ),
        );
      };

      // Show "Processing..." once upload bytes reach 100%
      xhr.upload.onloadend = () => {
        setQueue((prev) =>
          prev.map((q) =>
            q.pendingId === item.pendingId && q.status === 'uploading'
              ? { ...q, status: 'processing', progress: 100 }
              : q,
          ),
        );
      };

      xhr.open('POST', '/api/admin/media/upload');
      if (authToken) xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
      xhr.send(formData);
    },
    [folderId, altText, title, authToken, onUploaded],
  );

  // Auto-start queued items (one at a time to avoid rate limits)
  useEffect(() => {
    const queued = queue.find((q) => q.status === 'queued');
    if (queued) uploadItem(queued);
  }, [queue, uploadItem]);

  const cancel = (pendingId: string) => {
    setQueue((prev) =>
      prev.map((q) => {
        if (q.pendingId === pendingId && q.xhr) {
          q.xhr.abort();
        }
        return q;
      }),
    );
  };

  const retry = (pendingId: string) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.pendingId === pendingId ? { ...q, status: 'queued', progress: 0, error: undefined, xhr: undefined } : q,
      ),
    );
  };

  const clearCompleted = () => {
    setQueue((prev) => prev.filter((q) => q.status !== 'success' && q.status !== 'cancelled'));
    onClearCompleted();
  };

  if (queue.length === 0) return null;

  const hasCompleted = queue.some((q) => q.status === 'success' || q.status === 'cancelled');
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <span className="text-sm font-medium text-gray-700">Upload Queue</span>
        {hasCompleted && (
          <button
            onClick={clearCompleted}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear completed
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
        {queue.map((item) => (
          <div key={item.pendingId} className="flex items-center gap-3 px-4 py-3">
            {/* Preview */}
            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 shrink-0">
              {item.previewUrl ? (
                <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-medium">
                  SVG
                </div>
              )}
            </div>

            {/* Info + progress */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{item.file.name}</p>
              {item.status === 'uploading' || item.status === 'processing' ? (
                <div className="mt-1">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-200"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.status === 'processing' ? 'Processing variants...' : `${item.progress}%`}
                  </p>
                </div>
              ) : item.status === 'failed' ? (
                <p className="text-xs text-red-500 mt-0.5">{item.error ?? 'Upload failed.'}</p>
              ) : item.status === 'success' ? (
                <p className="text-xs text-green-600 mt-0.5">Upload complete</p>
              ) : item.status === 'cancelled' ? (
                <p className="text-xs text-gray-400 mt-0.5">Cancelled</p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">Queued</p>
              )}
            </div>

            {/* Actions */}
            <div className="shrink-0">
              {(item.status === 'uploading' || item.status === 'processing') && (
                <button
                  onClick={() => cancel(item.pendingId)}
                  className="text-xs text-gray-500 hover:text-red-500"
                >
                  Cancel
                </button>
              )}
              {item.status === 'failed' && (
                <button
                  onClick={() => retry(item.pendingId)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Retry
                </button>
              )}
              {item.status === 'success' && (
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
