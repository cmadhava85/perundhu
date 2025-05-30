import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  // Language data with display name, native name, and flag - now using Indian flag for both
  const languages = [
    { code: 'en', display: t('language.english'), native: 'English', flag: '🇮🇳' },
    { code: 'ta', display: t('language.tamil'), native: 'தமிழ்', flag: '🇮🇳' }
  ];

  return (
    <div className="language-tabs-container">
      <div className="language-tabs">
        {languages.map(lang => (
          <button
            key={lang.code}
            className={`language-tab ${currentLanguage === lang.code ? 'active' : ''}`}
            onClick={() => changeLanguage(lang.code)}
            aria-selected={currentLanguage === lang.code}
          >
            <span className="language-flag">{lang.flag}</span>
            <span className="language-name">{lang.native}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;