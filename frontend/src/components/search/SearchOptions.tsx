import React from 'react';
import { useTranslation } from 'react-i18next';

interface SearchOptionsProps {
  includeIntermediateStops: boolean;
  toggleIncludeIntermediateStops: () => void;
}

/**
 * Component for search option toggles and filters
 */
const SearchOptions: React.FC<SearchOptionsProps> = ({
  includeIntermediateStops,
  toggleIncludeIntermediateStops
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="toggle-row">
      <label className="toggle">
        <input
          type="checkbox"
          checked={includeIntermediateStops}
          onChange={toggleIncludeIntermediateStops}
        />
        <span className="toggle-slider"></span>
        <span className="toggle-label">
          {t('searchForm.includeIntermediateStops', 'Include buses passing via these locations')}
        </span>
      </label>
    </div>
  );
};

export default SearchOptions;