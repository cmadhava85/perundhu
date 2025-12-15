import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/LanguageSwitcher.css';

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [isAnimating, setIsAnimating] = useState(false);

  const changeLanguage = (language: string) => {
    if (language !== currentLanguage && !isAnimating) {
      setIsAnimating(true);
      i18n.changeLanguage(language);
      
      // Reset animation state after transition
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Enhanced language data with better visual design
  const languages = [
    { 
      code: 'en', 
      display: t('language.english'), 
      native: 'English', 
      flag: '🇮🇳',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shortCode: 'EN'
    },
    { 
      code: 'ta', 
      display: t('language.tamil'), 
      native: 'தமிழ்', 
      flag: '🇮🇳',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      shortCode: 'TA'
    }
  ];

  return (
    <div className="modern-language-switcher">
      {/* Pill-style toggle switch */}
      <div className="language-pill-container">
        <div className="language-pill">
          {/* Background slider */}
          <div 
            className={`pill-slider ${currentLanguage === 'ta' ? 'slide-right' : 'slide-left'}`}
          />
          
          {/* Language options */}
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`pill-option ${currentLanguage === lang.code ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
              aria-pressed={currentLanguage === lang.code}
              aria-label={`Switch to ${lang.native}`}
            >
              <span className="pill-flag">{lang.flag}</span>
              <span className="pill-text">{lang.shortCode}</span>
              {currentLanguage === lang.code && (
                <div className="active-glow" />
              )}
            </button>
          ))}
        </div>
        
        {/* Animated accent line */}
        <div className="accent-line">
          <div className="line-progress" />
        </div>
      </div>
      
      {/* Language name display */}
      <div className="language-display">
        <span className="current-language">
          {currentLanguage === 'en' ? 'English' : 'தமிழ்'}
        </span>
      </div>
    </div>
  );
};

export default React.memo(LanguageSwitcher);