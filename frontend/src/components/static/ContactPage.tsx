import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptic';
import '../../styles/static-pages.css';

const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    category: 'suggestion',
    message: '',
    email: '',
    screenshot: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFeedbackData(prev => ({ ...prev, [name]: value }));
  };

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('pages.contact.fileTooLarge', 'Screenshot must be less than 5MB'));
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError(t('pages.contact.invalidFileType', 'Please upload an image file'));
        return;
      }
      setFeedbackData(prev => ({ ...prev, screenshot: file }));
      setError('');
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedbackData.message.trim()) {
      triggerHaptic('error');
      setError(t('pages.contact.messageRequired', 'Please enter your feedback'));
      return;
    }

    if (!feedbackData.email.trim()) {
      triggerHaptic('error');
      setError(t('pages.contact.emailRequired', 'Please enter your email'));
      return;
    }

    setSubmitting(true);
    setError('');
    triggerHaptic('medium');

    try {
      const formData = new FormData();
      formData.append('category', feedbackData.category);
      formData.append('message', feedbackData.message);
      formData.append('email', feedbackData.email);
      formData.append('userAgent', navigator.userAgent);
      formData.append('timestamp', (new Date()).toISOString());
      formData.append('pageUrl', window.location.href);

      if (feedbackData.screenshot) {
        formData.append('screenshot', feedbackData.screenshot);
      }

      const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      triggerHaptic('success');
      setSubmitted(true);
      setFeedbackData({ category: 'suggestion', message: '', email: '', screenshot: null });

      setTimeout(() => {
        setSubmitted(false);
        setShowFeedbackForm(false);
      }, 3000);
    } catch (err: unknown) {
      triggerHaptic('error');
      const errorMessage = (err instanceof Error) ? err.message : t('pages.contact.submitError', 'Failed to submit feedback');
      setError(String(errorMessage));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="static-page">
      <Helmet>
        <title>Contact Us - Perundhu Tamil Nadu Bus Route Finder</title>
        <meta name="description" content="Contact the Perundhu team for help with Tamil Nadu bus routes and timings. Email us at perundhutn@gmail.com. We respond within 24-48 hours." />
        <link rel="canonical" href="https://www.perundhu.com/contact" />
      </Helmet>
      <div className="static-page-container">
        <h1>{t('pages.contact.title', 'Contact Us')}</h1>

        <section className="content-section">
          <p>{t('pages.contact.intro', 'We would love to hear from you! Whether you have questions, feedback, or suggestions, please reach out to us.')}</p>
        </section>

        <section className="content-section">
          <h2>{t('pages.contact.emailTitle', 'Email')}</h2>
          <p>
            <a href="mailto:perundhutn@gmail.com" className="contact-link">
              perundhutn@gmail.com
            </a>
          </p>
        </section>

        <section className="content-section">
          <h2>{t('pages.contact.feedbackTitle', 'Feedback')}</h2>

          {!showFeedbackForm ? (
            <div className="feedback-intro">
              <p>{t('pages.contact.feedbackText', 'Have suggestions to improve our service? We are always looking for ways to enhance your experience. Share your ideas through the contribution feature in the app.')}</p>
              <button
                className="btn-primary feedback-btn"
                onClick={() => { triggerHaptic('medium'); setShowFeedbackForm(true); }}
                aria-label={t('pages.contact.sendFeedback', 'Send Feedback')}
              >
                {t('pages.contact.sendFeedback', 'Send Feedback')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="feedback-form">
              {submitted && (
                <div className="feedback-success">
                  <CheckCircle size={24} />
                  <p>{t('pages.contact.thankYou', 'Thank you for your feedback!')}</p>
                </div>
              )}

              {error && (
                <div className="feedback-error">
                  <AlertCircle size={24} />
                  <p>{error}</p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="category">{t('pages.contact.feedbackType', 'Feedback Type')}</label>
                <select
                  id="category"
                  name="category"
                  value={feedbackData.category}
                  onChange={(e) => { triggerHaptic('light'); handleFeedbackChange(e); }}
                  className="form-control"
                  aria-required="true"
                >
                  <option value="suggestion">{t('pages.contact.type.suggestion', 'Suggestion')}</option>
                  <option value="bug">{t('pages.contact.type.bug', 'Bug Report')}</option>
                  <option value="feature">{t('pages.contact.type.feature', 'Feature Request')}</option>
                  <option value="general">{t('pages.contact.type.general', 'General Feedback')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">{t('pages.contact.yourFeedback', 'Your Feedback')}</label>
                <textarea
                  id="message"
                  name="message"
                  value={feedbackData.message}
                  onChange={handleFeedbackChange}
                  placeholder={t('pages.contact.feedbackPlaceholder', 'Tell us what you think...')}
                  rows={5}
                  className="form-control"
                  disabled={submitting}
                  maxLength={500}
                  aria-required="true"
                  aria-describedby="message-help"
                />
                <small id="message-help">{feedbackData.message.length}/500</small>
              </div>

              <div className="form-group">
                <label htmlFor="email">{t('pages.contact.yourEmail', 'Your Email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  value={feedbackData.email}
                  onChange={handleFeedbackChange}
                  placeholder={t('pages.contact.emailPlaceholder', 'your.email@example.com')}
                  className="form-control"
                  disabled={submitting}
                  aria-required="true"
                  aria-describedby="email-help"
                />
                <small id="email-help">{t('pages.contact.emailNote', 'So we can follow up with you')}</small>
              </div>

              <div className="form-group">
                <label htmlFor="screenshot-upload">{t('pages.contact.uploadScreenshot', 'Upload Screenshot (Optional)')}</label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    id="screenshot-upload"
                    ref={fileInputRef}
                    onChange={handleScreenshotSelect}
                    accept="image/*"
                    className="file-input-hidden"
                    disabled={submitting}
                    aria-describedby="screenshot-help"
                  />
                  <button
                    type="button"
                    className="btn-secondary file-upload-btn"
                    onClick={() => { triggerHaptic('light'); fileInputRef.current?.click(); }}
                    disabled={submitting}
                    aria-label={t('pages.contact.chooseFile', 'Choose File')}
                  >
                    <Upload size={18} aria-hidden="true" />
                    {feedbackData.screenshot ? feedbackData.screenshot.name : t('pages.contact.chooseFile', 'Choose File')}
                  </button>
                  <small id="screenshot-help">{t('pages.contact.screenshotNote', 'Max 5MB • PNG, JPG, GIF')}</small>
                </div>
                {feedbackData.screenshot && (
                  <div className="screenshot-preview">
                    <img
                      src={URL.createObjectURL(feedbackData.screenshot)}
                      alt="Preview"
                      style={{ maxWidth: '150px', maxHeight: '150px' }}
                    />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={submitting} aria-busy={submitting}>
                  {submitting ? t('pages.contact.sending', 'Sending...') : t('pages.contact.submit', 'Submit Feedback')}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { triggerHaptic('light'); setShowFeedbackForm(false); }}
                  disabled={submitting}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </form>
          )}
        </section>

        <div className="back-link">
          <Link to="/">← {t('common.backToHome', 'Back to Home')}</Link>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
