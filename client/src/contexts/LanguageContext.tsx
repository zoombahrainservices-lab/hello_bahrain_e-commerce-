'use client';

// Temporary no-op implementation so imports don't break.
// Components now use hard-coded English text, so this hook
// is just here to avoid runtime errors.
// We still type `language` as 'en' | 'ar' so existing comparisons
// like `language === 'ar'` remain type-safe.
export function useLanguage() {
  return {
    language: 'en' as 'en' | 'ar',
    // Accept the language argument for type-safety, but ignore it at runtime.
    setLanguage: (_lang: 'en' | 'ar') => {},
    t: (key: string) => key,
  };
}