import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Upload, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import '../styles/static-pages.css';

/**
 * About Us Page
 */
export const AboutUs: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="static-page">
      <div className="static-page-container">
        <h1>{t('pages.about.title', 'About Us')}</h1>
        
        <section className="content-section">
          <h2>{t('pages.about.missionTitle', 'Our Mission')}</h2>
          <p>{t('pages.about.missionText', 'Perundhu is dedicated to making bus travel in Tamil Nadu easier and more accessible for everyone. We provide accurate, real-time bus schedule information to help you plan your journeys efficiently.')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.about.whatWeDoTitle', 'What We Do')}</h2>
          <ul>
            <li>{t('pages.about.feature1', 'Comprehensive bus schedule database for Tamil Nadu')}</li>
            <li>{t('pages.about.feature2', 'Real-time bus tracking powered by people contributions')}</li>
            <li>{t('pages.about.feature3', 'Easy-to-use search to find the best routes')}</li>
            <li>{t('pages.about.feature4', 'Support for multiple languages including Tamil and English')}</li>
          </ul>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.about.peopleTitle', 'People Powered')}</h2>
          <p>{t('pages.about.peopleText', 'Our platform is powered by contributions from travelers like you. By sharing route information, bus timings, and real-time location updates, people like you help keep the data accurate and up-to-date.')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.about.teamTitle', 'Our Team')}</h2>
          <p>{t('pages.about.teamText', 'Perundhu is built by a passionate team of developers and transit enthusiasts who believe in making public transportation accessible to all.')}</p>
        </section>
        
        <div className="back-link">
          <Link to="/">← {t('common.backToHome', 'Back to Home')}</Link>
        </div>
      </div>
    </div>
  );
};

/**
 * Contact Us Page with Feedback Form
 */
export const ContactUs: React.FC = () => {
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
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('pages.contact.fileTooLarge', 'Screenshot must be less than 5MB'));
        return;
      }
      // Validate file type
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
      setError(t('pages.contact.messageRequired', 'Please enter your feedback'));
      return;
    }

    if (!feedbackData.email.trim()) {
      setError(t('pages.contact.emailRequired', 'Please enter your email'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Prepare FormData for file upload
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

      // Send feedback to backend
      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      setFeedbackData({
        category: 'suggestion',
        message: '',
        email: '',
        screenshot: null,
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setShowFeedbackForm(false);
      }, 3000);
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error) ? (err as Error).message : t('pages.contact.submitError', 'Failed to submit feedback');
      setError(String(errorMessage));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="static-page">
      <div className="static-page-container">
        <h1>{t('pages.contact.title', 'Contact Us')}</h1>
        
        <section className="content-section">
          <p>{t('pages.contact.intro', 'We would love to hear from you! Whether you have questions, feedback, or suggestions, please reach out to us.')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.contact.emailTitle', 'Email')}</h2>
          <p>
            <a href="mailto:support@perundhu.com" className="contact-link">
              support@perundhu.com
            </a>
          </p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.contact.supportTitle', 'Support Hours')}</h2>
          <p>{t('pages.contact.supportHours', 'Monday to Friday: 9:00 AM - 6:00 PM IST')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.contact.feedbackTitle', 'Feedback')}</h2>
          
          {!showFeedbackForm ? (
            <div className="feedback-intro">
              <p>{t('pages.contact.feedbackText', 'Have suggestions to improve our service? We are always looking for ways to enhance your experience. Share your ideas through the contribution feature in the app.')}</p>
              <button 
                className="btn-primary feedback-btn"
                onClick={() => setShowFeedbackForm(true)}
              >
                {t('pages.contact.sendFeedback', 'Send Feedback')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="feedback-form">
              {submitted && (
                <div className="feedback-success">
                  <CheckCircle sx={{ fontSize: 24 }} />
                  <p>{t('pages.contact.thankYou', 'Thank you for your feedback!')}</p>
                </div>
              )}
              
              {error && (
                <div className="feedback-error">
                  <ErrorIcon sx={{ fontSize: 24 }} />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="category">{t('pages.contact.feedbackType', 'Feedback Type')}</label>
                <select
                  id="category"
                  name="category"
                  value={feedbackData.category}
                  onChange={handleFeedbackChange}
                  className="form-control"
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
                />
                <small>{feedbackData.message.length}/500</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">{t('pages.contact.yourEmail', 'Your Email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={feedbackData.email}
                  onChange={handleFeedbackChange}
                  placeholder={t('pages.contact.emailPlaceholder', 'your.email@example.com')}
                  className="form-control"
                  disabled={submitting}
                />
                <small>{t('pages.contact.emailNote', 'So we can follow up with you')}</small>
              </div>
              
              <div className="form-group">
                <label>{t('pages.contact.uploadScreenshot', 'Upload Screenshot (Optional)')}</label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleScreenshotSelect}
                    accept="image/*"
                    className="file-input-hidden"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="btn-secondary file-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                  >
                    <Upload sx={{ fontSize: 18 }} />
                    {feedbackData.screenshot 
                      ? feedbackData.screenshot.name 
                      : t('pages.contact.chooseFile', 'Choose File')}
                  </button>
                  <small>{t('pages.contact.screenshotNote', 'Max 5MB • PNG, JPG, GIF')}</small>
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
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? t('pages.contact.sending', 'Sending...') : t('pages.contact.submit', 'Submit Feedback')}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowFeedbackForm(false)}
                  disabled={submitting}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </form>
          )}
        </section>
        
        <section className="content-section">
          <h2>{t('pages.contact.reportIssueTitle', 'Report an Issue')}</h2>
          <p>{t('pages.contact.reportIssueText', 'Found incorrect bus timings or route information? Use the "Report Issue" feature on any bus route to let us know, and our team will verify and update the information.')}</p>
        </section>
        
        <div className="back-link">
          <Link to="/">← {t('common.backToHome', 'Back to Home')}</Link>
        </div>
      </div>
    </div>
  );
};

/**
 * Privacy Policy Page
 */
export const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="static-page">
      <div className="static-page-container">
        <h1>{t('pages.privacy.title', 'Privacy Policy')}</h1>
        
        <section className="content-section">
          <p className="last-updated">{t('pages.privacy.lastUpdated', 'Last Updated: December 2025')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.privacy.introTitle', 'Introduction')}</h2>
          <p>{t('pages.privacy.introText', 'At Perundhu, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our service.')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.privacy.dataCollectionTitle', 'Information We Collect')}</h2>
          <ul>
            <li><strong>{t('pages.privacy.locationData', 'Location Data')}:</strong> {t('pages.privacy.locationDataText', 'When you use the bus tracking feature, we may collect your location to help track bus positions. This is only collected when you actively enable tracking.')}</li>
            <li><strong>{t('pages.privacy.usageData', 'Usage Data')}:</strong> {t('pages.privacy.usageDataText', 'We collect anonymous usage statistics to improve our service, such as popular routes and search patterns.')}</li>
            <li><strong>{t('pages.privacy.contributionData', 'Contribution Data')}:</strong> {t('pages.privacy.contributionDataText', 'Route information, timings, and images you contribute are stored to improve our database.')}</li>
          </ul>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.privacy.howWeUseTitle', 'How We Use Your Information')}</h2>
          <ul>
            <li>{t('pages.privacy.use1', 'To provide and improve bus schedule and tracking services')}</li>
            <li>{t('pages.privacy.use2', 'To verify and validate contributed route information')}</li>
            <li>{t('pages.privacy.use3', 'To analyze usage patterns and improve user experience')}</li>
            <li>{t('pages.privacy.use4', 'To communicate with you about service updates')}</li>
          </ul>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.privacy.dataSharingTitle', 'Data Sharing')}</h2>
          <p>{t('pages.privacy.dataSharingText', 'We do not sell your personal data. We may share anonymized, aggregated data with partners to improve public transportation services.')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.privacy.yourRightsTitle', 'Your Rights')}</h2>
          <p>{t('pages.privacy.yourRightsText', 'You have the right to access, correct, or delete your personal data. Contact us at support@perundhu.com for any privacy-related requests.')}</p>
        </section>
        
        <div className="back-link">
          <Link to="/">← {t('common.backToHome', 'Back to Home')}</Link>
        </div>
      </div>
    </div>
  );
};

/**
 * Terms of Service Page
 */
export const TermsOfService: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="static-page">
      <div className="static-page-container">
        <h1>{t('pages.terms.title', 'Terms of Service')}</h1>
        
        <section className="content-section">
          <p className="last-updated">{t('pages.terms.lastUpdated', 'Last Updated: December 2025')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.terms.acceptanceTitle', 'Acceptance of Terms')}</h2>
          <p>{t('pages.terms.acceptanceText', 'By accessing and using Perundhu, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.terms.serviceDescTitle', 'Service Description')}</h2>
          <p>{t('pages.terms.serviceDescText', 'Perundhu provides bus schedule information, route planning, and real-time tracking services for public buses in Tamil Nadu. Our information is provided as-is and may not always reflect real-time changes.')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.terms.userResponsibilitiesTitle', 'User Responsibilities')}</h2>
          <ul>
            <li>{t('pages.terms.responsibility1', 'Provide accurate information when contributing route data')}</li>
            <li>{t('pages.terms.responsibility2', 'Do not submit false, misleading, or harmful content')}</li>
            <li>{t('pages.terms.responsibility3', 'Respect the intellectual property rights of others')}</li>
            <li>{t('pages.terms.responsibility4', 'Do not attempt to disrupt or misuse the service')}</li>
          </ul>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.terms.contributionsTitle', 'User Contributions')}</h2>
          <p>{t('pages.terms.contributionsText', 'By submitting route information, images, or other content, you grant Perundhu a non-exclusive, royalty-free license to use, modify, and display the content to improve our service.')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.terms.disclaimerTitle', 'Disclaimer')}</h2>
          <p>{t('pages.terms.disclaimerText', 'Bus schedules and timings may change without notice. Perundhu is not responsible for any inconvenience caused by inaccurate or outdated information. Always verify important travel details with official sources.')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.terms.limitationTitle', 'Limitation of Liability')}</h2>
          <p>{t('pages.terms.limitationText', 'Perundhu shall not be liable for any direct, indirect, or consequential damages arising from the use of our service.')}</p>
        </section>
        
        <div className="back-link">
          <Link to="/">← {t('common.backToHome', 'Back to Home')}</Link>
        </div>
      </div>
    </div>
  );
};

/**
 * FAQ Page
 */
export const FAQ: React.FC = () => {
  const { t } = useTranslation();
  
  const faqs = [
    {
      question: t('pages.faq.q1', 'How do I search for bus routes?'),
      answer: t('pages.faq.a1', 'Enter your departure and destination locations in the search form on the home page, then click "Search Buses" to find available routes.')
    },
    {
      question: t('pages.faq.q2', 'Is the bus timing information accurate?'),
      answer: t('pages.faq.a2', 'Our database is updated regularly through official sources and people contributions. However, actual timings may vary due to traffic and other factors. Always allow extra time for your journey.')
    },
    {
      question: t('pages.faq.q3', 'How can I contribute route information?'),
      answer: t('pages.faq.a3', 'Click on "Contribute" in the app to add new route information. You can enter details manually, upload photos of bus schedules, paste text from messages, or use voice input.')
    },
    {
      question: t('pages.faq.q4', 'How does bus tracking work?'),
      answer: t('pages.faq.a4', 'When passengers on a bus enable tracking, their anonymized location helps show the real-time position of the bus on the map. More trackers mean more accurate information.')
    },
    {
      question: t('pages.faq.q5', 'What languages are supported?'),
      answer: t('pages.faq.a5', 'Perundhu currently supports English and Tamil. You can switch languages using the language selector in the header.')
    },
    {
      question: t('pages.faq.q6', 'How do I report incorrect information?'),
      answer: t('pages.faq.a6', 'Use the "Report Issue" option on any bus route to report incorrect timings, wrong stops, or other issues. Our team will review and update the information.')
    },
    {
      question: t('pages.faq.q7', 'Is the app free to use?'),
      answer: t('pages.faq.a7', 'Yes, Perundhu is completely free to use. There are no hidden charges or premium features.')
    },
    {
      question: t('pages.faq.q8', 'Can I use the app offline?'),
      answer: t('pages.faq.a8', 'Some features like searching previously viewed routes work offline. However, real-time tracking and new searches require an internet connection.')
    }
  ];
  
  return (
    <div className="static-page">
      <div className="static-page-container">
        <h1>{t('pages.faq.title', 'Frequently Asked Questions')}</h1>
        
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details key={index} className="faq-item">
              <summary className="faq-question">{faq.question}</summary>
              <p className="faq-answer">{faq.answer}</p>
            </details>
          ))}
        </div>
        
        <section className="content-section">
          <h2>{t('pages.faq.moreHelpTitle', 'Need More Help?')}</h2>
          <p>
            {t('pages.faq.moreHelpText', 'If you could not find the answer to your question, please')}{' '}
            <Link to="/contact">{t('pages.faq.contactLink', 'contact us')}</Link>.
          </p>
        </section>
        
        <div className="back-link">
          <Link to="/">← {t('common.backToHome', 'Back to Home')}</Link>
        </div>
      </div>
    </div>
  );
};

export default { AboutUs, ContactUs, PrivacyPolicy, TermsOfService, FAQ };
