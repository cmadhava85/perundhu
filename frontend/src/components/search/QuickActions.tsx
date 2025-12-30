import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/search-form.css';

interface QuickActionsProps {
  onViewMap?: () => void;
  onScheduleView?: () => void;
  onSuggestions?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onViewMap,
  onScheduleView,
  onSuggestions
}) => {
  const { t } = useTranslation();

  return (
    <div className="quick-actions">
      {onViewMap && (
        <button className="quick-button" onClick={onViewMap}>
          <span>🗺️</span>
          <span>{t('search.viewMap', 'View on Map')}</span>
        </button>
      )}
      {onScheduleView && (
        <button className="quick-button" onClick={onScheduleView}>
          <span>🕐</span>
          <span>{t('search.scheduleView', 'Schedule View')}</span>
        </button>
      )}
      {onSuggestions && (
        <button className="quick-button" onClick={onSuggestions}>
          <span>💡</span>
          <span>{t('search.suggestions', 'Suggestions')}</span>
        </button>
      )}
    </div>
  );
};

export default QuickActions;