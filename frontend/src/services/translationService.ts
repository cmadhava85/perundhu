import i18next from 'i18next';
import { api } from './api';

/**
 * Frontend Translation Service that mirrors the backend TranslationServiceImpl
 * Updated to match the backend's method signatures and functionality
 */

/**
 * Helper function to make API calls with language context
 */
const fetchWithLang = async <T>(url: string, options?: RequestInit): Promise<T> => {
  try {
    const lang = i18next.language || 'en';
    const fullUrl = url.startsWith('/') ? url : `/api/${url}`;
    
    // Create proper headers for Axios
    const headers: Record<string, string> = { 'Accept-Language': lang };
    if (options?.headers) {
      const originalHeaders = options.headers as Record<string, string>;
      Object.keys(originalHeaders).forEach(key => {
        headers[key] = originalHeaders[key];
      });
    }
    
    const response = await api.request({
      url: fullUrl,
      method: options?.method || 'GET',
      headers,
      data: options?.body ? JSON.parse(options.body as string) : undefined
    });
    
    return response.data;
  } catch (error) {
    console.error('Error in translation API call:', error);
    throw new Error('Failed to fetch translations');
  }
};

/**
 * Get translation for a specific entity field
 * Matches backend: getTranslation(Translatable<T> entity, String fieldName, String languageCode)
 */
export const getTranslation = async (
  entityType: string,
  entityId: number,
  fieldName: string,
  languageCode?: string
): Promise<string | null> => {
  const lang = languageCode || i18next.language || 'en';
  try {
    const response = await api.get(`/api/v1/translations/${entityType}/${entityId}/${fieldName}`, {
      params: { lang }
    });
    return response.data?.translatedValue || null;
  } catch (error) {
    console.error('Error fetching translation:', error);
    return null;
  }
};

/**
 * Get translations for multiple namespaces
 * Matches backend: getTranslationsForNamespaces(String language, List<String> namespaces)
 */
export const getTranslationsForNamespaces = async (
  language: string,
  namespaces: string[]
): Promise<Record<string, Record<string, string>>> => {
  try {
    const response = await api.post('/api/v1/translations/namespaces', {
      language,
      namespaces
    });
    return response.data || {};
  } catch (error) {
    console.error('Error fetching namespace translations:', error);
    return {};
  }
};

/**
 * Get translations for a single namespace
 * Matches backend: getTranslationsForNamespace(String language, String namespace)
 */
export const getTranslationsForNamespace = async (
  language: string,
  namespace: string
): Promise<Record<string, string>> => {
  try {
    const response = await api.get(`/api/v1/translations/namespace/${namespace}`, {
      params: { lang: language }
    });
    return response.data || {};
  } catch (error) {
    console.error('Error fetching namespace translations:', error);
    return {};
  }
};

/**
 * Get all translations for a specific entity
 * Matches backend: getAllTranslations(Translatable<T> entity, String languageCode)
 */
export const getAllTranslations = async (
  entityType: string,
  entityId: number,
  languageCode?: string
): Promise<Record<string, string>> => {
  const lang = languageCode || i18next.language || 'en';
  try {
    const response = await api.get(`/api/v1/translations/${entityType}/${entityId}`, {
      params: { lang }
    });
    return response.data || {};
  } catch (error) {
    console.error('Error fetching all translations:', error);
    return {};
  }
};

/**
 * Get all translations for a language
 * Matches backend: getAllTranslations(String language)
 */
export const getAllTranslationsForLanguage = async (
  language: string
): Promise<Record<string, Record<string, string>>> => {
  try {
    const response = await api.get('/api/v1/translations/language', {
      params: { lang: language }
    });
    return response.data || {};
  } catch (error) {
    console.error('Error fetching language translations:', error);
    return {};
  }
};

/**
 * Save a translation for a specific entity field
 * Matches backend: saveTranslation(Translatable<T> entity, String fieldName, String languageCode, String value)
 */
export const saveTranslation = async (
  entityType: string, 
  entityId: number, 
  fieldName: string, 
  translatedValue: string,
  languageCode?: string
): Promise<void> => {
  const lang = languageCode || i18next.language || 'en';
  try {
    await api.post(`/api/v1/translations/${entityType}/${entityId}/${fieldName}`, {
      languageCode: lang,
      translatedValue: translatedValue
    });
  } catch (error) {
    console.error('Error saving translation:', error);
    throw new Error('Failed to save translation');
  }
};

/**
 * Delete a translation for a specific entity field
 * Matches backend: deleteTranslation(Translatable<T> entity, String fieldName, String languageCode)
 */
export const deleteTranslation = async (
  entityType: string, 
  entityId: number, 
  fieldName: string,
  languageCode?: string
): Promise<void> => {
  const lang = languageCode || i18next.language || 'en';
  try {
    await api.delete(`/api/v1/translations/${entityType}/${entityId}/${fieldName}`, {
      params: { lang }
    });
  } catch (error) {
    console.error('Error deleting translation:', error);
    throw new Error('Failed to delete translation');
  }
};

/**
 * Detect language from text
 * Matches backend: detectLanguage(String text)
 */
export const detectLanguage = async (text: string): Promise<string> => {
  try {
    const response = await api.post('/api/v1/translations/detect-language', {
      text
    });
    return response.data?.language || 'en';
  } catch (error) {
    console.error('Error detecting language:', error);
    // Fallback to simple client-side detection
    return detectLanguageClientSide(text);
  }
};

/**
 * Client-side language detection fallback
 */
const detectLanguageClientSide = (text: string): string => {
  if (!text || text.trim().length === 0) {
    return 'en';
  }

  // Check for Tamil characters (Unicode range U+0B80 to U+0BFF)
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'ta';
  }

  // Check for Hindi/Devanagari characters (Unicode range U+0900 to U+097F)
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }

  // Check for Malayalam characters (Unicode range U+0D00 to U+0D7F)
  if (/[\u0D00-\u0D7F]/.test(text)) {
    return 'ml';
  }

  // Check for Telugu characters (Unicode range U+0C00 to U+0C7F)
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return 'te';
  }

  // Check for Kannada characters (Unicode range U+0C80 to U+0CFF)
  if (/[\u0C80-\u0CFF]/.test(text)) {
    return 'kn';
  }

  // Default to English
  return 'en';
};

/**
 * Check if translation service is available
 * Matches backend: isAvailable()
 */
export const isTranslationServiceAvailable = async (): Promise<boolean> => {
  try {
    const response = await api.get('/api/v1/translations/health');
    return response.status === 200;
  } catch (error) {
    console.error('Translation service availability check failed:', error);
    return false;
  }
};

/**
 * Translate text from source to target language
 * Matches backend: translate(String text, String sourceLanguage, String targetLanguage)
 */
export const translateText = async (
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> => {
  try {
    const response = await api.post('/api/v1/translations/translate', {
      text,
      sourceLanguage,
      targetLanguage
    });
    return response.data?.translatedText || text;
  } catch (error) {
    console.error('Error translating text:', error);
    return text; // Return original text if translation fails
  }
};

/**
 * Get entity translations with metadata
 * Matches backend: getEntityTranslations(String entityType, Long entityId)
 */
export const getEntityTranslations = async (
  entityType: string,
  entityId: number
): Promise<{
  entityType: string;
  entityId: number;
  translations: Record<string, string>;
}> => {
  try {
    const response = await api.get(`/api/v1/translations/entity/${entityType}/${entityId}`);
    return response.data || {
      entityType,
      entityId,
      translations: {}
    };
  } catch (error) {
    console.error('Error fetching entity translations:', error);
    return {
      entityType,
      entityId,
      translations: {}
    };
  }
};

/**
 * Get available languages
 */
export const getAvailableLanguages = async (): Promise<Array<{code: string, name: string}>> => {
  try {
    const response = await api.get('/api/v1/translations/languages');
    return response.data || [
      { code: 'en', name: 'English' },
      { code: 'ta', name: 'தமிழ்' }
    ];
  } catch (error) {
    console.error('Error fetching available languages:', error);
    return [
      { code: 'en', name: 'English' },
      { code: 'ta', name: 'தமிழ்' }
    ];
  }
};

// Backward compatibility exports for existing code
export const getTranslations = getAllTranslations;