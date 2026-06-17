import MediaLibrary from '@/components/admin/media/MediaLibrary';

export const metadata = {
  title: 'Media Library',
};

export default function MediaLibraryPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="text-sm text-gray-500 mt-1">
            All uploaded files are stored here. Every image across the site comes from this library.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <MediaLibrary />
      </div>
    </div>
  );
}
