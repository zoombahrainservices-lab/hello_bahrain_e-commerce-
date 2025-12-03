import { Suspense } from 'react';
import OrdersClient from './OrdersClient';

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <OrdersClient />
    </Suspense>
  );
}