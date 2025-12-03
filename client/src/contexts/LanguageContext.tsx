'use client';

// Temporary no-op implementation so imports don't break.
// Components now use hard-coded English text, so this hook
// is just here to avoid runtime errors.
export function useLanguage() {
  return {
    language: 'en' as 'en',
    setLanguage: () => {},
    t: (key: string) => key,
  };
}