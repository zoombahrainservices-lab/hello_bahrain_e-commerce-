'use client';

import { MediaFolder } from '@/lib/media/types';

interface MediaFiltersProps {
  folders: MediaFolder[];
  selectedFolderId: string | null;
  selectedMimeType: string | null;
  onFolderChange: (folderId: string | null) => void;
  onMimeTypeChange: (mimeType: string | null) => void;
}

const MIME_OPTIONS = [
  { value: '',              label: 'All types' },
  { value: 'image/jpeg',   label: 'JPEG' },
  { value: 'image/png',    label: 'PNG' },
  { value: 'image/webp',   label: 'WebP' },
  { value: 'image/svg+xml', label: 'SVG' },
];

export default function MediaFilters({
  folders,
  selectedFolderId,
  selectedMimeType,
  onFolderChange,
  onMimeTypeChange,
}: MediaFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedMimeType ?? ''}
        onChange={(e) => onMimeTypeChange(e.target.value || null)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        {MIME_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
