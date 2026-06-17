'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { MediaItemWithVariants, ProductMedia } from '@/lib/media/types';
import MediaPickerModal from '@/components/admin/media/MediaPickerModal';
import MediaUploadDropzone, { PendingFile } from '@/components/admin/media/MediaUploadDropzone';
import MediaUploadQueue from '@/components/admin/media/MediaUploadQueue';

interface ProductMediaGalleryProps {
  productId: string;
  items: ProductMedia[];
  onItemsChange: (items: ProductMedia[]) => void;
  authToken: string | null;
}

function getThumbUrl(item: MediaItemWithVariants): string | null {
  const thumb = item.variants.find((v) => v.variant === 'thumb');
  if (thumb) return thumb.publicUrl;
  const svgPreview = item.variants.find((v) => v.variant === 'svg_preview');
  if (svgPreview) return svgPreview.publicUrl;
  return item.publicUrl;
}

/** Sort product media: main image first, then gallery by sort_order. */
export function sortProductMediaItems(items: ProductMedia[]): ProductMedia[] {
  const main = items.find((i) => i.role === 'main_image');
  const gallery = items
    .filter((i) => i.role === 'gallery_image')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return [...(main ? [main] : []), ...gallery];
}

export default function ProductMediaGallery({
  productId,
  items,
  onItemsChange,
  authToken,
}: ProductMediaGalleryProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const sortedItems = sortProductMediaItems(items);

  const refreshFromApi = async () => {
    const res = await api.get<ProductMedia[]>(`/api/admin/products/${productId}/media`);
    onItemsChange(res.data);
  };

  const handleAddMultiple = async (selected: MediaItemWithVariants[]) => {
    if (selected.length === 0) return;
    setBusy('add');
    try {
      const res = await api.post(`/api/admin/products/${productId}/media/batch`, {
        mediaIds: selected.map((i) => i.id),
        mainMediaId: sortedItems.length === 0 ? selected[0].id : undefined,
      });
      onItemsChange(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to add images.');
    } finally {
      setBusy(null);
    }
  };

  const handleUploaded = async (uploaded: MediaItemWithVariants) => {
    setBusy('upload');
    try {
      const res = await api.post(`/api/admin/products/${productId}/media/batch`, {
        mediaIds: [uploaded.id],
        mainMediaId: sortedItems.length === 0 ? uploaded.id : undefined,
      });
      onItemsChange(res.data);
      setPendingFiles([]);
      setShowUpload(false);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to attach uploaded image.');
    } finally {
      setBusy(null);
    }
  };

  const handleSetMain = async (item: ProductMedia) => {
    if (item.role === 'main_image') return;
    setBusy(item.mediaId);
    try {
      const reordered = [
        item.mediaId,
        ...sortedItems.filter((i) => i.mediaId !== item.mediaId).map((i) => i.mediaId),
      ];
      const res = await api.put(`/api/admin/products/${productId}/media/order`, {
        orderedMediaIds: reordered,
      });
      onItemsChange(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to set main image.');
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async (item: ProductMedia) => {
    if (!confirm('Remove this image from the product? It will stay in the Media Library.')) return;
    setBusy(item.mediaId);
    try {
      await api.delete(`/api/admin/products/${productId}/media/${item.mediaId}`);
      onItemsChange(items.filter((i) => i.id !== item.id));
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to remove image.');
    } finally {
      setBusy(null);
    }
  };

  const handleDrop = async (dropIndex: number) => {
    if (draggingIndex === null || draggingIndex === dropIndex) {
      setDraggingIndex(null);
      return;
    }

    const reordered = [...sortedItems];
    const [moved] = reordered.splice(draggingIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    const orderedMediaIds = reordered.map((i) => i.mediaId);
    onItemsChange(
      reordered.map((item, index) => ({
        ...item,
        role: index === 0 ? 'main_image' : 'gallery_image',
        sortOrder: index === 0 ? 0 : index * 10,
      })),
    );
    setDraggingIndex(null);

    try {
      const res = await api.put(`/api/admin/products/${productId}/media/order`, {
        orderedMediaIds,
      });
      onItemsChange(res.data);
    } catch {
      alert('Failed to save new order.');
      await refreshFromApi();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Product Image Gallery</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            All images are linked by media ID. The first image is the main product image.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={!!busy}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Add from Library
          </button>
          <button
            type="button"
            onClick={() => setShowUpload((v) => !v)}
            disabled={!!busy}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            Upload New
          </button>
        </div>
      </div>

      {sortedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sortedItems.map((item, index) => {
            const thumbUrl = item.media ? getThumbUrl(item.media) : null;
            const isMain = item.role === 'main_image' || index === 0;
            const isBusy = busy === item.mediaId;

            return (
              <div
                key={item.id}
                draggable={!busy}
                onDragStart={() => setDraggingIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(index);
                }}
                className={`
                  relative group rounded-lg overflow-hidden border-2 aspect-square bg-gray-100
                  cursor-grab active:cursor-grabbing transition-opacity
                  ${isMain ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200'}
                  ${draggingIndex === index ? 'opacity-40' : ''}
                  ${isBusy ? 'opacity-60' : ''}
                `}
              >
                {thumbUrl ? (
                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                <span className="absolute top-1 left-1 text-xs bg-black bg-opacity-60 text-white px-1.5 py-0.5 rounded">
                  {index + 1}
                </span>

                {isMain ? (
                  <span className="absolute bottom-1 left-1 text-[10px] font-semibold uppercase tracking-wide bg-primary-600 text-white px-1.5 py-0.5 rounded">
                    Main
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetMain(item)}
                    disabled={!!busy}
                    className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 text-[10px] font-medium bg-white text-gray-700 border border-gray-300 px-1.5 py-0.5 rounded hover:bg-gray-50 transition-opacity"
                    title="Set as main image"
                  >
                    Set main
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  disabled={!!busy}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-opacity"
                  title="Remove from product"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {item.media && (
                  <p className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.media.title || item.media.originalFileName}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
          <p className="text-sm font-medium">No product images yet</p>
          <p className="text-xs mt-1">
            Select multiple images from the Media Library or upload new ones
          </p>
        </div>
      )}

      {sortedItems.length > 1 && (
        <p className="text-xs text-gray-400">
          Drag to reorder. The first image is always the main product image.
        </p>
      )}

      {showUpload && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <MediaUploadDropzone
            onFilesSelected={(files) => setPendingFiles((prev) => [...prev, ...files])}
          />
          {pendingFiles.length > 0 && (
            <MediaUploadQueue
              pending={pendingFiles}
              folderId={null}
              onUploaded={handleUploaded}
              onClearCompleted={() => setPendingFiles([])}
              authToken={authToken}
            />
          )}
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        multiSelect
        onSelectMultiple={handleAddMultiple}
        title="Add Product Images"
      />
    </div>
  );
}
