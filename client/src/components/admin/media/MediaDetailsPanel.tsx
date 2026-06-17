'use client';

import { useState, useEffect } from 'react';
import { MediaItemWithVariants, MediaFolder } from '@/lib/media/types';
import { api } from '@/lib/api';
import { formatBytes, getOriginalFileSize } from '@/lib/media/display-utils';

interface MediaDetailsPanelProps {
  item: MediaItemWithVariants;
  folders: MediaFolder[];
  onUpdate: (updated: MediaItemWithVariants) => void;
  onDelete: () => void;
  onClose: () => void;
}

function getPreviewUrl(item: MediaItemWithVariants): string | null {
  const medium = item.variants.find((v) => v.variant === 'medium');
  if (medium) return medium.publicUrl;
  const small = item.variants.find((v) => v.variant === 'small');
  if (small) return small.publicUrl;
  const svgPreview = item.variants.find((v) => v.variant === 'svg_preview');
  if (svgPreview) return svgPreview.publicUrl;
  return item.publicUrl;
}

function getCopyUrl(item: MediaItemWithVariants): string {
  const medium = item.variants.find((v) => v.variant === 'medium');
  return medium?.publicUrl ?? item.publicUrl ?? '';
}

export default function MediaDetailsPanel({
  item,
  folders,
  onUpdate,
  onDelete,
  onClose,
}: MediaDetailsPanelProps) {
  const [altText, setAltText] = useState(item.altText ?? '');
  const [title, setTitle] = useState(item.title ?? '');
  const [caption, setCaption] = useState(item.caption ?? '');
  const [description, setDescription] = useState(item.description ?? '');
  const [folderId, setFolderId] = useState(item.folderId ?? '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [usages, setUsages] = useState<{ entityType: string; entityId: string; entityName: string; entitySlug?: string; role: string; sortOrder: number }[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Sync form when item changes
  useEffect(() => {
    setAltText(item.altText ?? '');
    setTitle(item.title ?? '');
    setCaption(item.caption ?? '');
    setDescription(item.description ?? '');
    setFolderId(item.folderId ?? '');
    setDeleteError('');
    fetchUsages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const fetchUsages = async () => {
    setLoadingUsages(true);
    try {
      const res = await api.get(`/api/admin/media/${item.id}`);
      setUsages(res.data?.usages ?? res.data?.usedByProducts ?? []);
    } catch {
      setUsages([]);
    }
    setLoadingUsages(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/api/admin/media/${item.id}`, {
        altText: altText || null,
        title: title || null,
        caption: caption || null,
        description: description || null,
        folderId: folderId || null,
      });
      onUpdate(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    const url = getCopyUrl(item);
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    window.open(`/api/admin/media/${item.id}/download`, '_blank');
  };

  const handleDelete = async () => {
    if (!confirm('Move this image to trash?')) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.post(`/api/admin/media/${item.id}/delete`);
      onDelete();
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to delete.';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const previewUrl = getPreviewUrl(item);

  return (
    <div className="w-80 shrink-0 border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
        <span className="text-sm font-semibold text-gray-700">Details</span>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Preview */}
        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          {previewUrl ? (
            <img src={previewUrl} alt={item.altText ?? item.originalFileName} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>

        {/* File info */}
        <div className="text-xs space-y-1 text-gray-600 bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between">
            <span className="text-gray-400">File</span>
            <span className="font-medium truncate max-w-[60%] text-right" title={item.originalFileName}>
              {item.originalFileName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Format</span>
            <span className="font-medium uppercase">{item.format}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Archive size</span>
            <span className="font-medium">
              {getOriginalFileSize(item) ? formatBytes(getOriginalFileSize(item)!) : '—'}
            </span>
          </div>
          {item.width && item.height && (
            <div className="flex justify-between">
              <span className="text-gray-400">Dimensions</span>
              <span className="font-medium">{item.width} × {item.height}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Uploaded</span>
            <span className="font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            <span className={`font-medium capitalize ${item.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
              {item.status}
            </span>
          </div>
        </div>

        {/* Folder */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Folder</label>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* SEO fields */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Alt text</label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe the image..."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Variants */}
        {item.variants.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Available variants</p>
            <div className="flex flex-wrap gap-1.5">
              {item.variants.map((v) => (
                <span
                  key={v.id}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                  title={v.fileSizeBytes ? formatBytes(v.fileSizeBytes) : undefined}
                >
                  {v.variant}
                  {v.fileSizeBytes ? ` · ${formatBytes(v.fileSizeBytes)}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Used by */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Used by</p>
          {loadingUsages ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : usages.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Not used anywhere</p>
          ) : (
            <ul className="space-y-1.5">
              {usages.map((u, i) => (
                <li key={`${u.entityType}-${u.entityId}-${i}`} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-gray-700 truncate max-w-[60%]" title={u.entityName}>
                    {u.entityName}
                  </span>
                  <div className="ml-2 shrink-0 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 capitalize">
                      {u.entityType}
                    </span>
                    {u.role && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                        u.role === 'main_image'
                          ? 'bg-blue-100 text-blue-700'
                          : u.role === 'hero'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {u.role === 'main_image' ? 'Main' : u.role}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Delete error */}
        {deleteError && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {deleteError}
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Move to trash'}
        </button>
      </div>
    </div>
  );
}
