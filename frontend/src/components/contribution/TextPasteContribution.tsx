import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import HoneypotFields from '../common/HoneypotFields';
import { useSubmissionSecurity } from '../../hooks/useSubmissionSecurity';
import './TextPasteContribution.css';

interface ExtractedData {
  busNumber: string | null;
  fromLocation: string | null;
  toLocation: string | null;
  timings: string[];
  stops: string[];
}

interface ValidationResponse {
  isValid: boolean;
  reason?: string;
  warnings: string[];
  formatDetected: string;
  confidence: number;
  extracted: ExtractedData;
}

interface TextPasteContributionProps {
  onSubmit: (contributionId: string) => void;
  onError: (error: string) => void;
}

export const TextPasteContribution: React.FC<TextPasteContributionProps> = ({ onSubmit, onError }) => {
  const { t } = useTranslation();
  const { prepareSubmission, isLoading: isSecurityLoading } = useSubmissionSecurity();
  
  const [pastedText, setPastedText] = useState('');
  const [sourceAttribution, setSourceAttribution] = useState('');
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Example templates
  const exampleTexts = [
    {
      label: t('paste.examples.whatsapp', 'WhatsApp Format'),
      text: `Bus 27D from Chennai to Madurai
Departure: 6:00 AM
Arrival: 2:00 PM
Stops: Tambaram, Chengalpattu, Villupuram, Trichy`,
    },
    {
      label: t('paste.examples.simple', 'Simple Format'),
      text: `Route 123A
Coimbatore → Salem
Morning 7:30 AM, Evening 5:00 PM`,
    },
    {
      label: t('paste.examples.tamil', 'Tamil Format'),
      text: `பஸ் 45G
மதுரை லிருந்து திருச்சி க்கு
காலை 10:00 மணி`,
    },
  ];

  const handleTextChange = (text: string) => {
    setPastedText(text);
    setValidation(null); // Clear previous validation
  };

  const handleValidate = async () => {
    if (!pastedText.trim()) {
      onError(t('paste.errors.emptyText', 'Please paste some text'));
      return;
    }

    setIsValidating(true);
    
    try {
      const response = await api.post('/contributions/paste/validate', {
        text: pastedText,
      });

      setValidation(response.data);
      
      if (!response.data.isValid) {
        onError(response.data.reason || t('paste.errors.invalidText', 'Text validation failed'));
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      onError(axiosError.response?.data?.message || t('paste.errors.validationFailed', 'Validation failed'));
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!validation || !validation.isValid) {
      onError(t('paste.errors.validateFirst', 'Please validate text first'));
      return;
    }

    if (!agreedToTerms) {
      onError(t('paste.errors.agreeTerms', 'Please agree to the terms'));
      return;
    }

    if (validation.confidence < 0.3) {
      onError(t('paste.errors.lowConfidence', 'Extracted information has low confidence. Please add more details.'));
      return;
    }

    setIsSubmitting(true);

    // Validate security (honeypot, reCAPTCHA)
    const submissionData = {
      text: pastedText,
      sourceAttribution: sourceAttribution || 'Not specified',
    };
    
    const securePayload = await prepareSubmission(submissionData);
    if (!securePayload.isValid) {
      onError(t('paste.errors.securityFailed', 'Security validation failed. Please try again.'));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/contributions/paste', securePayload.data, {
        headers: securePayload.headers
      });

      if (response.data.success) {
        onSubmit(response.data.contributionId);
      } else {
        onError(response.data.message || t('paste.errors.submitFailed', 'Submission failed'));
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      
      if (axiosError.response?.status === 429) {
        onError(t('paste.errors.rateLimit', 'Too many submissions. Please try again later.'));
      } else if (axiosError.response?.status === 401) {
        onError(t('paste.errors.loginRequired', 'Please login to submit paste contributions'));
      } else {
        onError(axiosError.response?.data?.message || t('paste.errors.submitFailed', 'Submission failed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const _getConfidenceLevel = (confidence: number): string => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#22c55e';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="text-paste-contribution">
      {/* Hidden honeypot fields for bot detection */}
      <HoneypotFields />
      
      <div className="instructions-section">
        <div className="do-section">
          <h3>✅ {t('paste.good.title', 'Good Examples to Paste:')}</h3>
          <ul>
            <li>{t('paste.good.official', 'Official bus schedules')}</li>
            <li>{t('paste.good.tnstc', 'Route information from TNSTC website')}</li>
            <li>{t('paste.good.whatsapp', 'WhatsApp messages about bus routes')}</li>
            <li>{t('paste.good.social', 'Facebook/Twitter route announcements')}</li>
          </ul>
        </div>

        <div className="dont-section">
          <h3>❌ {t('paste.bad.title', "Don't Paste:")}</h3>
          <ul>
            <li>{t('paste.bad.personal', 'Personal travel plans ("I\'m going to...")')}</li>
            <li>{t('paste.bad.conversations', 'Entire WhatsApp conversations')}</li>
            <li>{t('paste.bad.spam', 'Spam or advertisements')}</li>
            <li>{t('paste.bad.questions', 'Questions about routes')}</li>
          </ul>
        </div>
      </div>

      <div className="examples-section">
        <h4>{t('paste.examples.title', 'Click to use example:')}</h4>
        <div className="example-buttons">
          {exampleTexts.map((ex, i) => (
            <button
              key={i}
              className="example-btn"
              onClick={() => handleTextChange(ex.text)}
              type="button"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="paste-area">
        <label htmlFor="pasteText">
          {t('paste.label', 'Paste route information here:')}
        </label>
        <textarea
          id="pasteText"
          className="paste-textarea"
          placeholder={t('paste.placeholder', 'Paste bus route information here...\n\nExample:\nBus 27D from Chennai to Madurai\nDeparts 6:00 AM, arrives 2:00 PM\nStops: Tambaram, Chengalpattu, Villupuram')}
          value={pastedText}
          onChange={(e) => handleTextChange(e.target.value)}
          maxLength={1000}
          rows={8}
        />
        <div className="character-count">
          {pastedText.length}/1000 {t('paste.characters', 'characters')}
        </div>
      </div>

      <button
        className="validate-btn"
        onClick={handleValidate}
        disabled={!pastedText.trim() || isValidating}
        type="button"
      >
        {isValidating ? t('paste.validating', 'Analyzing...') : t('paste.validate', '🔍 Analyze Text')}
      </button>

      {validation && (
        <div className={`validation-result ${validation.isValid ? 'valid' : 'invalid'}`}>
          {!validation.isValid ? (
            <div className="validation-error">
              <h4>❌ {t('paste.validation.failed', 'Validation Failed')}</h4>
              <p>{validation.reason}</p>
            </div>
          ) : (
            <div className="validation-success">
              <h4>📋 {t('paste.validation.extracted', 'Extracted Information')}</h4>
              
              <div className="confidence-badge" style={{ backgroundColor: getConfidenceColor(validation.confidence) }}>
                {t('paste.confidence', 'Confidence')}: {(validation.confidence * 100).toFixed(0)}%
              </div>

              <div className="format-detected">
                {t('paste.formatDetected', 'Format Detected')}: {validation.formatDetected}
              </div>

              <table className="extracted-data-table">
                <tbody>
                  <tr>
                    <td>{t('paste.fields.busNumber', 'Bus Number')}:</td>
                    <td className={validation.extracted.busNumber ? 'found' : 'not-found'}>
                      {validation.extracted.busNumber || '❌ Not found'}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('paste.fields.from', 'From')}:</td>
                    <td className={validation.extracted.fromLocation ? 'found' : 'not-found'}>
                      {validation.extracted.fromLocation || '❌ Not found'}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('paste.fields.to', 'To')}:</td>
                    <td className={validation.extracted.toLocation ? 'found' : 'not-found'}>
                      {validation.extracted.toLocation || '❌ Not found'}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('paste.fields.timings', 'Timings')}:</td>
                    <td className={validation.extracted.timings.length > 0 ? 'found' : 'not-found'}>
                      {validation.extracted.timings.length > 0 
                        ? validation.extracted.timings.join(', ') 
                        : t('paste.fields.none', 'None')}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('paste.fields.stops', 'Stops')}:</td>
                    <td className={validation.extracted.stops.length > 0 ? 'found' : 'not-found'}>
                      {validation.extracted.stops.length > 0 
                        ? validation.extracted.stops.join(', ') 
                        : t('paste.fields.none', 'None')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {validation.confidence < 0.6 && (
                <div className="low-confidence-warning">
                  ⚠️ {t('paste.warnings.lowConfidence', 'Low confidence - likely to be rejected by admin. Consider adding more details.')}
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="warnings-list">
                  <h5>⚠️ {t('paste.warnings.title', 'Warnings:')}</h5>
                  <ul>
                    {validation.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {validation && validation.isValid && (
        <>
          <div className="source-attribution">
            <label htmlFor="sourceAttribution">
              {t('paste.source.label', 'Where did you get this information?')} *
            </label>
            <input
              id="sourceAttribution"
              type="text"
              placeholder={t('paste.source.placeholder', 'e.g., TNSTC WhatsApp group, Facebook page, official website')}
              value={sourceAttribution}
              onChange={(e) => setSourceAttribution(e.target.value)}
              maxLength={200}
            />
            <small>{t('paste.source.help', 'This helps us verify the information')}</small>
          </div>

          <div className="terms-checkbox">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <label htmlFor="agreeTerms">
              {t('paste.terms', 'I confirm this information is publicly available, not copyrighted, and accurate to the best of my knowledge')}
            </label>
          </div>

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!agreedToTerms || isSubmitting || isSecurityLoading || validation.confidence < 0.3}
            type="button"
          >
            {isSubmitting || isSecurityLoading
              ? t('paste.submitting', 'Submitting...') 
              : t('paste.submit', '✅ Submit for Review')}
          </button>
        </>
      )}
    </div>
  );
};

export default TextPasteContribution;
