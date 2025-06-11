import i18next from 'i18next';
import { api } from './api';

/**
 * Helper function to make API calls with language context
 */
const fetchWithLang = async <T>(url: string, options?: RequestInit): Promise<T> => {
  try {
    const lang = i18next.language || 'en';
    const fullUrl = url.startsWith('/') ? `/api${url}` : `/api/${url}`;
    
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
 * Get translations for a specific entity
 */
export const getTranslations = async (entityType: string, entityId: number, languageCode?: string) => {
  const lang = languageCode || i18next.language || 'en';
  return fetchWithLang<Record<string, string>>(
    `/v1/translations/${entityType}/${entityId}?languageCode=${lang}`
  );
};

/**
 * Save a translation for a specific entity field
 */
export const saveTranslation = async (
  entityType: string, 
  entityId: number, 
  fieldName: string, 
  translatedValue: string,
  languageCode?: string
) => {
  const lang = languageCode || i18next.language || 'en';
  return fetchWithLang<void>(
    `/v1/translations/${entityType}/${entityId}/${fieldName}`, 
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        languageCode: lang,
        value: translatedValue
      }),
    }
  );
};

/**
 * Delete a translation for a specific entity field
 */
export const deleteTranslation = async (
  entityType: string, 
  entityId: number, 
  fieldName: string,
  languageCode?: string
) => {
  const lang = languageCode || i18next.language || 'en';
  return fetchWithLang<void>(
    `/v1/translations/${entityType}/${entityId}/${fieldName}?languageCode=${lang}`, 
    {
      method: 'DELETE',
    }
  );
};

/**
 * Get available languages
 */
export const getAvailableLanguages = async () => {
  return fetchWithLang<Array<{code: string, name: string}>>(
    `/v1/translations/languages`
  );
};