import React from 'react';
import { useTranslation } from 'react-i18next';

interface BusDetailsFormProps {
  busName: string;
  busNumber: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasError: boolean;
}

/**
 * Component for entering bus identification details
 */
const BusDetailsForm: React.FC<BusDetailsFormProps> = ({
  busName,
  busNumber,
  onChange,
  hasError
}) => {
  const { t } = useTranslation();

  return (
    <div className="form-section">
      <h3 className="section-title">
        <span className="section-icon">🚌</span>
        {t('contribution.busDetails', 'Bus Details')}
      </h3>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="busName">
            {t('contribution.busName', 'Bus Name')}
            <span className="field-hint"> {t('contribution.eitherRequired', '(Either name or number required)')}</span>
          </label>
          <input
            type="text"
            id="busName"
            name="busName"
            value={busName}
            onChange={onChange}
            placeholder={t('contribution.busNamePlaceholder', 'e.g. SETC Chennai Express')}
            className={hasError ? "field-error" : ""}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="busNumber">
            {t('contribution.busNumber', 'Bus Number')}
            <span className="field-hint"> {t('contribution.eitherRequired', '(Either name or number required)')}</span>
          </label>
          <input
            type="text"
            id="busNumber"
            name="busNumber"
            value={busNumber}
            onChange={onChange}
            placeholder={t('contribution.busNumberPlaceholder', 'e.g. TN-01-1234')}
            className={hasError ? "field-error" : ""}
          />
        </div>
      </div>
    </div>
  );
};

export default BusDetailsForm;