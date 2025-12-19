import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Bus, Clock, MapPin } from 'lucide-react';
import type { MatchedBusInfo } from '../../services/duplicateCheckService';
import { getMatchTypeLabel, getConfidenceLabel } from '../../services/duplicateCheckService';
import './DuplicateMatchAlert.css';

interface DuplicateMatchAlertProps {
  matches: MatchedBusInfo[];
  message: string;
  onConfirmExisting: (busId: number) => void;
  onAddAnyway: () => void;
  onCancel: () => void;
}

export const DuplicateMatchAlert: React.FC<DuplicateMatchAlertProps> = ({
  matches,
  message,
  onConfirmExisting,
  onAddAnyway,
  onCancel
}) => {
  const { t } = useTranslation();

  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="duplicate-match-alert">
      <div className="duplicate-match-alert__header">
        <AlertTriangle className="duplicate-match-alert__icon" size={24} />
        <h3 className="duplicate-match-alert__title">
          {t('contribution.duplicateFound', 'Similar Route Found')}
        </h3>
      </div>

      <p className="duplicate-match-alert__message">{message}</p>

      <div className="duplicate-match-alert__matches">
        {matches.map((match, index) => {
          const confidence = getConfidenceLabel(match.confidenceScore);
          
          return (
            <div key={index} className="duplicate-match-card">
              <div className="duplicate-match-card__header">
                <Bus size={20} />
                <span className="duplicate-match-card__bus-number">
                  {match.busNumber || t('contribution.unknownBus', 'Unknown Bus')}
                </span>
                <span className={`duplicate-match-card__confidence ${confidence.color}`}>
                  {confidence.label} ({match.confidenceScore}%)
                </span>
              </div>

              <div className="duplicate-match-card__route">
                <MapPin size={16} />
                <span>{match.fromLocation}</span>
                <span className="duplicate-match-card__arrow">→</span>
                <span>{match.toLocation}</span>
              </div>

              {match.departureTime && (
                <div className="duplicate-match-card__time">
                  <Clock size={16} />
                  <span>{t('contribution.departure', 'Departure')}: {match.departureTime}</span>
                </div>
              )}

              <div className="duplicate-match-card__match-type">
                <CheckCircle size={16} />
                <span>{getMatchTypeLabel(match.matchType)}</span>
              </div>

              <p className="duplicate-match-card__details">{match.details}</p>

              {match.busId && (
                <button
                  className="duplicate-match-card__confirm-btn"
                  onClick={() => onConfirmExisting(match.busId!)}
                >
                  {t('contribution.confirmThisBus', 'Yes, this is the same bus')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="duplicate-match-alert__actions">
        <button
          className="duplicate-match-alert__btn duplicate-match-alert__btn--secondary"
          onClick={onCancel}
        >
          {t('common.cancel', 'Cancel')}
        </button>
        <button
          className="duplicate-match-alert__btn duplicate-match-alert__btn--primary"
          onClick={onAddAnyway}
        >
          {t('contribution.addAnyway', 'Add as new bus anyway')}
        </button>
      </div>
    </div>
  );
};
