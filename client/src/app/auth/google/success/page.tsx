'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function GoogleAuthSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchMe } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Store token in localStorage and cookie
      localStorage.setItem('token', token);
      document.cookie = `token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      
      // Fetch user data using AuthContext's fetchMe
      fetchMe()
        .then(() => {
          // Redirect to home after successful auth
          router.push('/');
        })
        .catch((error) => {
          console.error('Error fetching user:', error);
          router.push('/auth/login');
        });
    } else {
      router.push('/auth/login');
    }
  }, [searchParams, router, fetchMe]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing sign in...</h1>
        <p className="text-gray-600">Please wait while we sign you in.</p>
      </div>
    </div>
  );
}

export default function GoogleAuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <GoogleAuthSuccessClient />
    </Suspense>
  );
}

