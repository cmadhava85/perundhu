import React from 'react';
import { useTranslation } from 'react-i18next';

interface SearchButtonProps {
  onClick: () => void;
  disabled: boolean;
}

/**
 * Search button component with enabled/disabled state
 */
const SearchButton: React.FC<SearchButtonProps> = ({
  onClick,
  disabled
}) => {
  const { t } = useTranslation();
  
  return (
    <button 
      className="search-button"
      onClick={onClick}
      disabled={disabled}
    >
      {t('searchForm.searchButton', 'Search Buses')}
    </button>
  );
};

export default SearchButton;