import { Suspense } from 'react';
import ReturnClient from './ReturnClient';

export const dynamic = 'force-dynamic';

export default function EazyPayReturnPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-12">Loading payment result…</div>}>
      <ReturnClient />
    </Suspense>
  );
}

