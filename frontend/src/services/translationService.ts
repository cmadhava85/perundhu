import i18next from 'i18next';
import { fetchWithLang } from './api';

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