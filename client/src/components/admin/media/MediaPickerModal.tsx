'use client';

import { useEffect, useState } from 'react';
import { MediaItemWithVariants } from '@/lib/media/types';
import MediaLibrary from './MediaLibrary';

interface MediaPickerModalBaseProps {
  open: boolean;
  onClose: () => void;
  defaultFolderId?: string | null;
  title?: string;
}

interface SingleSelectProps extends MediaPickerModalBaseProps {
  multiSelect?: false;
  onSelect: (item: MediaItemWithVariants) => void;
  onSelectMultiple?: never;
}

interface MultiSelectProps extends MediaPickerModalBaseProps {
  multiSelect: true;
  onSelectMultiple: (items: MediaItemWithVariants[]) => void;
  onSelect?: never;
}

type MediaPickerModalProps = SingleSelectProps | MultiSelectProps;

function formatBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const VARIANT_LABELS: Record<string, string> = {
  original: 'Original',
  tiny: 'Tiny',
  thumb: 'Thumb',
  xs: 'XS',
  small: 'Small',
  card: 'Card',
  medium: 'Medium',
  large: 'Large',
  xl: 'XL',
  hero: 'Hero',
  svg_preview: 'Preview',
};

export default function MediaPickerModal(props: MediaPickerModalProps) {
  const {
    open,
    onClose,
    defaultFolderId,
    title = 'Select from Media Library',
    multiSelect = false,
  } = props;

  const [staged, setStaged] = useState<MediaItemWithVariants | null>(null);
  const [stagedItems, setStagedItems] = useState<MediaItemWithVariants[]>([]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!multiSelect && staged) {
          setStaged(null);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, staged, multiSelect]);

  useEffect(() => {
    if (open) {
      setStaged(null);
      setStagedItems([]);
    }
  }, [open]);

  if (!open) return null;

  const toggleMultiSelect = (item: MediaItemWithVariants) => {
    setStagedItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      return [...prev, item];
    });
  };

  const confirmSingle = () => {
    if (!staged || props.multiSelect) return;
    props.onSelect(staged);
    onClose();
  };

  const confirmMultiple = () => {
    if (!props.multiSelect || stagedItems.length === 0) return;
    props.onSelectMultiple(stagedItems);
    onClose();
  };

  const previewUrl =
    staged?.variants.find((v) => v.variant === 'medium')?.publicUrl ??
    staged?.variants.find((v) => v.variant === 'small')?.publicUrl ??
    staged?.publicUrl ??
    null;

  const hasFooter = multiSelect ? stagedItems.length > 0 : !!staged;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden"
        style={{ height: hasFooter ? '90vh' : '80vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            {multiSelect && (
              <p className="text-xs text-gray-500 mt-0.5">
                Click images to select multiple, then add them to the product.
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0">
          {multiSelect ? (
            <MediaLibrary
              selectMode
              multiSelect
              selectedIds={stagedItems.map((i) => i.id)}
              onToggleSelect={toggleMultiSelect}
              defaultFolderId={defaultFolderId}
              hideDetails
            />
          ) : (
            <MediaLibrary
              selectMode
              onSelect={(item) => setStaged(item)}
              defaultFolderId={defaultFolderId}
              hideDetails
            />
          )}
        </div>

        {multiSelect && stagedItems.length > 0 && (
          <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex -space-x-2">
                  {stagedItems.slice(0, 5).map((item) => {
                    const url =
                      item.variants.find((v) => v.variant === 'thumb')?.publicUrl ?? item.publicUrl;
                    return (
                      <div
                        key={item.id}
                        className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white bg-gray-200"
                      >
                        {url && <img src={url} alt="" className="w-full h-full object-cover" />}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{stagedItems.length}</span> image
                  {stagedItems.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setStagedItems([])}
                  className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  Clear
                </button>
                <button
                  onClick={confirmMultiple}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Add {stagedItems.length} image{stagedItems.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {!multiSelect && staged && (
          <div className="shrink-0 border-t border-gray-200 bg-gray-50">
            <div className="flex items-start gap-4 px-5 py-4">
              <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-200 border border-gray-300">
                {previewUrl ? (
                  <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate mb-1">
                  {staged.title || staged.originalFileName}
                </p>
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                  {staged.format} · {staged.fileSizeBytes > 0 ? formatBytes(staged.fileSizeBytes) : ''}
                  {staged.width && staged.height ? ` · ${staged.width}×${staged.height}` : ''}
                </p>

                {staged.variants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {staged.variants.map((v) => (
                      <a
                        key={v.id}
                        href={v.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${v.width ?? '?'}×${v.height ?? '?'} · ${formatBytes(v.fileSizeBytes ?? 0)}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white border border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition"
                      >
                        <span>{VARIANT_LABELS[v.variant] ?? v.variant}</span>
                        {v.width && v.height && (
                          <span className="text-gray-400">{v.width}×{v.height}</span>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setStaged(null)}
                  className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSingle}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Use this image
                </button>
              </div>
            </div>
          </div>
        )}

        {!hasFooter && (
          <div className="shrink-0 px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            {multiSelect
              ? 'Click images to select one or more, then confirm to add them to this product.'
              : 'Click any image to preview its variants, then confirm selection.'}
          </div>
        )}
      </div>
    </div>
  );
}
