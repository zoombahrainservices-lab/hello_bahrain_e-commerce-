'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface ToolResult {
  status: 'idle' | 'running' | 'success' | 'error';
  message?: string;
  details?: unknown;
}

interface ToolCardProps {
  title: string;
  description: string;
  actionLabel: string;
  warningLabel?: string;
  result: ToolResult;
  onRun: () => void;
}

function ToolCard({ title, description, actionLabel, warningLabel, result, onRun }: ToolCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      {result.status !== 'idle' && (
        <div
          className={`rounded-lg p-3 text-sm ${
            result.status === 'running'
              ? 'bg-blue-50 text-blue-700'
              : result.status === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {result.status === 'running' && (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Running…
            </span>
          )}
          {result.status !== 'running' && (
            <div>
              <p className="font-medium">{result.message}</p>
              {result.details !== undefined && (
                <pre className="mt-2 text-xs overflow-auto max-h-40 whitespace-pre-wrap break-words">
                  {typeof result.details === 'string'
                    ? result.details
                    : JSON.stringify(result.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto">
        {warningLabel && result.status === 'idle' && (
          <p className="text-xs text-amber-600 mb-2">{warningLabel}</p>
        )}
        <button
          onClick={onRun}
          disabled={result.status === 'running'}
          className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {result.status === 'running' ? 'Running…' : actionLabel}
        </button>
      </div>
    </div>
  );
}

export default function MediaToolsPage() {
  const [importResult, setImportResult] = useState<ToolResult>({ status: 'idle' });
  const [migrateResult, setMigrateResult] = useState<ToolResult>({ status: 'idle' });
  const [organizeResult, setOrganizeResult] = useState<ToolResult>({ status: 'idle' });
  const [backfillResult, setBackfillResult] = useState<ToolResult>({ status: 'idle' });
  const [retryResult, setRetryResult] = useState<ToolResult>({ status: 'idle' });
  const [purgeResult, setPurgeResult] = useState<ToolResult>({ status: 'idle' });

  const run = async (
    setter: (r: ToolResult) => void,
    method: 'get' | 'post',
    url: string,
    params?: Record<string, unknown>,
  ) => {
    setter({ status: 'running' });
    try {
      const res =
        method === 'get'
          ? await api.get(url, { params })
          : await api.post(url, params);
      setter({
        status: 'success',
        message: res.data?.message ?? 'Done.',
        details: res.data,
      });
    } catch (err: any) {
      setter({
        status: 'error',
        message: err?.response?.data?.message ?? err?.message ?? 'An error occurred.',
        details: err?.response?.data,
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Media Tools</h1>
        <p className="text-sm text-gray-500 mt-1">
          One-time migration and maintenance utilities for the media library.
          These operations are safe to re-run; they are idempotent where possible.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ToolCard
          title="Import Existing Images"
          description="Scans all products and banners in the database and registers any R2 image URLs that are not yet tracked in media_items. Does not re-upload files."
          actionLabel="Run Import"
          warningLabel="This may take a minute if there are many products."
          result={importResult}
          onRun={() => run(setImportResult, 'get', '/api/admin/import-existing-images')}
        />

        <ToolCard
          title="Migrate Image URLs"
          description="Previews and applies URL normalisation — converts legacy storage URLs to the canonical media library path format."
          actionLabel="Run Migration"
          result={migrateResult}
          onRun={() => run(setMigrateResult, 'get', '/api/admin/migrate-image-urls')}
        />

        <ToolCard
          title="Organize Product Media"
          description="Links imported media_items back to products via the product_media junction table. Run after Import Existing Images to connect records."
          actionLabel="Run Organize"
          result={organizeResult}
          onRun={() => run(setOrganizeResult, 'post', '/api/admin/products/organize-media')}
        />

        <ToolCard
          title="Backfill Variants"
          description="Generates missing WebP responsive variants (tiny, thumb, small, medium, large, hero, etc.) for all active media items that lack them."
          actionLabel="Run Backfill"
          warningLabel="This is CPU-intensive. Run during low-traffic periods."
          result={backfillResult}
          onRun={() => run(setBackfillResult, 'post', '/api/admin/media/backfill-variants')}
        />

        <ToolCard
          title="Retry Failed Items"
          description="Finds media items stuck in 'processing' or 'failed' status and retries variant generation for them. Use after a server error interrupted an upload."
          actionLabel="Retry Failed"
          result={retryResult}
          onRun={() => run(setRetryResult, 'post', '/api/admin/media/retry-failed')}
        />

        <ToolCard
          title="Purge Trash"
          description="Permanently deletes all items in the trash that have been there for 60 or more days, freeing R2 storage. Items under 60 days are left in trash."
          actionLabel="Purge Old Trash"
          warningLabel="This is permanent and cannot be undone."
          result={purgeResult}
          onRun={() => run(setPurgeResult, 'post', '/api/admin/media/purge-trash')}
        />
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <p className="font-semibold mb-1">Recommended order for a fresh migration</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Import Existing Images — registers all legacy URLs as media_items</li>
          <li>Organize Product Media — links them to products via product_media</li>
          <li>Backfill Variants — generates responsive WebP variants for imported items</li>
          <li>Migrate Image URLs — normalises any remaining legacy URL formats</li>
        </ol>
      </div>
    </div>
  );
}
