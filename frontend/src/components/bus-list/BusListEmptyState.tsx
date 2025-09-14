import React from 'react';
import { useTranslation } from 'react-i18next';

interface BusListEmptyStateProps {
  onSearchAgain?: () => void;
  className?: string;
}

const BusListEmptyState: React.FC<BusListEmptyStateProps> = ({
  onSearchAgain,
  className = ''
}) => {
  const { t } = useTranslation();

  return (
    <div className={`card ${className}`}>
      <div className="card-body text-center py-12">
        <div className="text-6xl mb-4">🚌</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {t('busList.noBuses', 'No buses found')}
        </h3>
        <p className="text-gray-600 mb-6">
          {t('busList.noBusesDesc', 'Try adjusting your search criteria or search for a different route.')}
        </p>
        {onSearchAgain && (
          <button className="btn btn-primary" onClick={onSearchAgain}>
            {t('busList.searchAgain', 'Search Again')}
          </button>
        )}
      </div>
    </div>
  );
};

export default BusListEmptyState;