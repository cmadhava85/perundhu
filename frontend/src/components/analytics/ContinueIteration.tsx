import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/AnalyticsComponents.css';

interface ContinueIterationProps {
  hasMore: boolean;
  isLoading: boolean;
  onContinue: () => void;
  className?: string;
}

/**
 * Component for loading more data
 */
const ContinueIteration: React.FC<ContinueIterationProps> = ({ 
  hasMore, 
  isLoading, 
  onContinue,
  className 
}) => {
  const { t } = useTranslation();
  
  if (!hasMore) return null;
  
  return (
    <div className={`continue-iteration ${className || ''}`}>
      <button 
        onClick={onContinue} 
        disabled={isLoading}
        className="load-more-button"
      >
        {isLoading ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
      </button>
    </div>
  );
};

export default ContinueIteration;