'use client';

import { MediaFolder } from '@/lib/media/types';

interface MediaFolderSidebarProps {
  folders: MediaFolder[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  showingTrash: boolean;
  onTrashClick: () => void;
  trashCount: number;
}

export default function MediaFolderSidebar({
  folders,
  selectedFolderId,
  onSelect,
  showingTrash,
  onTrashClick,
  trashCount,
}: MediaFolderSidebarProps) {
  return (
    <div className="w-52 shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
          Folders
        </p>
        <nav className="space-y-0.5">
          <button
            onClick={() => onSelect(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !showingTrash && selectedFolderId === null
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Media
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onSelect(folder.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                !showingTrash && selectedFolderId === folder.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {folder.name}
            </button>
          ))}

          {/* Trash — sits right below the last folder */}
          <div className="pt-1 mt-1 border-t border-gray-200">
            <button
              onClick={onTrashClick}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                showingTrash
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'text-red-500 hover:bg-red-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Trash
              </span>
              {trashCount > 0 && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                  {trashCount}
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
