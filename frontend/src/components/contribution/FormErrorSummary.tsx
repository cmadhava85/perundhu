import React from 'react';
import { useTranslation } from 'react-i18next';

interface FormError {
  field: string;
  message: string;
}

interface FormErrorSummaryProps {
  errors: FormError[];
  show: boolean;
}

/**
 * Component to display form validation errors in a consolidated format
 */
const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  show
}) => {
  const { t } = useTranslation();

  if (!show || errors.length === 0) return null;

  return (
    <div className="errors-summary">
      <div className="errors-header">
        <span className="error-icon">⚠</span>
        {t('contribution.errorSummary', 'Please correct the following issues:')}
      </div>
      <div className="errors-grid">
        {errors.map((error, index) => (
          <div className="error-category" key={index}>
            <div className="error-field">{error.field}</div>
            <div className="error-message">{error.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormErrorSummary;