'use client';

type SortOption = 'newest' | 'oldest' | 'file_size_asc' | 'file_size_desc' | 'name_asc' | 'name_desc';

interface MediaSortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  productGroupsMode?: boolean;
}

const MEDIA_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',        label: 'Newest first' },
  { value: 'oldest',        label: 'Oldest first' },
  { value: 'name_asc',      label: 'Name A–Z' },
  { value: 'name_desc',     label: 'Name Z–A' },
  { value: 'file_size_desc', label: 'Largest first' },
  { value: 'file_size_asc', label: 'Smallest first' },
];

const PRODUCT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',   label: 'Recently updated' },
  { value: 'oldest',   label: 'Oldest updated' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
];

export default function MediaSortSelect({ value, onChange, productGroupsMode }: MediaSortSelectProps) {
  const options = productGroupsMode ? PRODUCT_OPTIONS : MEDIA_OPTIONS;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
