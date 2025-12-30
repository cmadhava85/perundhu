import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/search-form.css';

interface SearchButtonProps {
  onClick: () => void;
  disabled: boolean;
}

/**
 * Search button component with enabled/disabled state
 * Matches design-prototype/components/search-form.html
 */
const SearchButton: React.FC<SearchButtonProps> = ({
  onClick,
  disabled
}) => {
  const { t } = useTranslation();
  
  return (
    <>
      <button 
        className="search-button"
        onClick={onClick}
        disabled={disabled}
      >
        <span>🔍</span>
        <span>{t('searchForm.searchButton', 'Find Buses')}</span>
      </button>
      <div className="keyboard-hint">
        💡 {t('searchForm.keyboardHint', 'Press')} <kbd className="kbd">Enter</kbd> {t('searchForm.toSearch', 'to search')}
      </div>
    </>
  );
};

export default SearchButton;