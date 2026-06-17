'use client';

import { useState, useRef, useCallback } from 'react';
import { ALLOWED_EXTENSIONS, MAX_IMAGE_SIZE_MB, MAX_SVG_SIZE_MB } from '@/lib/media/constants';

export interface PendingFile {
  id: string;
  file: File;
  previewUrl: string | null;
}

interface MediaUploadDropzoneProps {
  onFilesSelected: (files: PendingFile[]) => void;
  disabled?: boolean;
  compact?: boolean;
  maxFiles?: number;
  label?: string;
  helperText?: string;
}

let idCounter = 0;
function newId() {
  return `pending-${++idCounter}-${Date.now()}`;
}

export default function MediaUploadDropzone({
  onFilesSelected,
  disabled,
  compact,
  maxFiles = 10,
  label,
  helperText,
}: MediaUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const pending: PendingFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        if (pending.length >= maxFiles) {
          alert('Too many files selected for this upload mode.');
          break;
        }

        const file = fileList[i];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
          alert(`${file.name} — unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
          continue;
        }

        const isSvg = file.type === 'image/svg+xml';
        const limitMb = isSvg ? MAX_SVG_SIZE_MB : MAX_IMAGE_SIZE_MB;
        if (file.size > limitMb * 1024 * 1024) {
          alert(`${file.name} is too large. Max size is ${limitMb}MB.`);
          continue;
        }

        const previewUrl = file.type.startsWith('image/') && file.type !== 'image/svg+xml'
          ? URL.createObjectURL(file)
          : null;

        pending.push({ id: newId(), file, previewUrl });
      }

      if (pending.length > 0) onFilesSelected(pending);
    },
    [onFilesSelected],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) processFiles(e.dataTransfer.files);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => !disabled && fileInputRef.current?.click()}
        disabled={disabled}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.svg"
          onChange={handleInput}
          className="hidden"
          disabled={disabled}
        />
      </button>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-xl p-10 text-center transition-colors select-none
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.svg"
        onChange={handleInput}
        className="hidden"
        disabled={disabled}
      />
      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p className="text-base font-medium text-gray-700 mb-1">
        {isDragging ? 'Drop files here' : (label ?? 'Drag & drop or click to upload')}
      </p>
      <p className="text-sm text-gray-500">
        {helperText ?? `JPG, PNG, WebP, SVG · Max ${MAX_IMAGE_SIZE_MB}MB (SVG: ${MAX_SVG_SIZE_MB}MB)`}
      </p>
    </div>
  );
}
