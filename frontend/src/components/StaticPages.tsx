import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptic';
import '../styles/static-pages.css';

/**
 * About Us Page
 */
export const AboutUs: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="static-page">
      <Helmet>
        <title>About Perundhu - Tamil Nadu Community Bus Route Finder</title>
        <meta name="description" content="Learn about Perundhu, the people-powered bus schedule platform for Tamil Nadu. Over 10,000+ TNSTC, MTC and SETC routes across 200+ cities." />
        <link rel="canonical" href="https://www.perundhu.com/about" />
      </Helmet>
      <div className="static-page-container">
        <h1>{t('pages.about.title', 'About Perundhu')}</h1>
        
        <section className="content-section">
          <h2>{t('pages.about.missionTitle', 'Our Mission')}</h2>
          <p>{t('pages.about.missionText', 'Perundhu (பேருந்து - meaning "bus" in Tamil) is dedicated to making public bus travel across Tamil Nadu easier, more accessible, and reliable for everyone. We believe that accurate, real-time transit information should be free and available to all.')}</p>
          <p>{t('pages.about.missionText2', 'Our platform combines official government data with crowd-sourced contributions to provide the most comprehensive and up-to-date bus schedule information across Tamil Nadu.')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.about.whatWeDoTitle', 'What We Do')}</h2>
          <ul>
            <li><strong>{t('pages.about.feature1Title', 'Comprehensive Schedule Database')}:</strong> {t('pages.about.feature1', 'Over 10,000+ bus routes covering 200+ cities and towns across Tamil Nadu')}</li>
            <li><strong>{t('pages.about.feature2Title', 'Real-Time Bus Tracking')}:</strong> {t('pages.about.feature2', 'Live location tracking powered by voluntary community contributions from passengers')}</li>
            <li><strong>{t('pages.about.feature3Title', 'Smart Route Search')}:</strong> {t('pages.about.feature3', 'Easy-to-use search with autocomplete, filter options, and multi-leg journey planning')}</li>
            <li><strong>{t('pages.about.feature4Title', 'Multilingual Support')}:</strong> {t('pages.about.feature4', 'Full support for Tamil and English with location names in both languages')}</li>
            <li><strong>{t('pages.about.feature5Title', 'Community Contributions')}:</strong> {t('pages.about.feature5', 'Anyone can add missing routes, report issues, and help keep information accurate')}</li>
          </ul>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.about.peopleTitle', 'Powered by People')}</h2>
          <p>{t('pages.about.peopleText', 'Perundhu is a community-driven platform. Our data quality depends on contributions from travelers like you who share route information, bus timings, and real-time location updates.')}</p>
          <p>{t('pages.about.peopleText2', 'Every route you contribute, every timing you verify, and every tracking session you run helps thousands of commuters plan their journeys better. Together, we are building the most comprehensive public transit information system for Tamil Nadu.')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.about.impactTitle', 'Our Impact')}</h2>
          <ul>
            <li>{t('pages.about.impact1', '200,000+ monthly users across Tamil Nadu')}</li>
            <li>{t('pages.about.impact2', '10,000+ bus routes documented and verified')}</li>
            <li>{t('pages.about.impact3', '1,500+ active community contributors')}</li>
            <li>{t('pages.about.impact4', '50,000+ searches performed daily')}</li>
            <li>{t('pages.about.impact5', 'Available in 2 languages: English and Tamil')}</li>
          </ul>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.about.teamTitle', 'Our Story')}</h2>
          <p>{t('pages.about.teamText', 'Perundhu was started by passionate developers and transit enthusiasts who experienced firsthand the challenges of finding reliable bus information in Tamil Nadu.')}</p>
          <p>{t('pages.about.teamText2', 'What began as a weekend project to help commuters in Chennai has grown into a statewide platform serving hundreds of thousands of users. We are committed to keeping Perundhu free, open, and community-driven.')}</p>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.about.technologyTitle', 'Technology & Infrastructure')}</h2>
          <p>{t('pages.about.technologyText', 'Perundhu is built using modern web technologies with a focus on performance, accessibility, and mobile-first design:')}</p>
          <ul>
            <li>{t('pages.about.tech1', 'React-based progressive web app (PWA) for offline capability')}</li>
            <li>{t('pages.about.tech2', 'Spring Boot backend with optimized database queries')}</li>
            <li>{t('pages.about.tech3', 'Deployed on Google Cloud Platform with cost-optimized infrastructure')}</li>
            <li>{t('pages.about.tech4', 'Real-time tracking using GPS and anonymous location sharing')}</li>
            <li>{t('pages.about.tech5', 'OpenStreetMap integration for accurate location search')}</li>
          </ul>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.about.futureTitle', 'What\'s Next')}</h2>
          <p>{t('pages.about.futureText', 'We are constantly working to improve Perundhu. Upcoming features include:')}</p>
          <ul>
            <li>{t('pages.about.future1', 'Direct ticket booking integration with official portals')}</li>
            <li>{t('pages.about.future2', 'Push notifications for favorite routes and delays')}</li>
            <li>{t('pages.about.future3', 'Enhanced analytics and travel patterns')}</li>
            <li>{t('pages.about.future4', 'Expansion to neighboring states')}</li>
            <li>{t('pages.about.future5', 'API access for third-party developers')}</li>
          </ul>
        </section>
        
        <section className="content-section">
          <h2>{t('pages.about.contactTitle', 'Get Involved')}</h2>
          <p>{t('pages.about.contactText', 'Want to help improve public transit information in Tamil Nadu? Join our community!')}</p>
          <ul>
            <li><Link to="/contribute" style={{color: '#667eea', fontWeight: 600}}>{t('pages.about.contribute', 'Contribute route information')}</Link></li>
            <li><Link to="/contact" style={{color: '#667eea', fontWeight: 600}}>{t('pages.about.feedback', 'Share feedback and suggestions')}</Link></li>
            <li>{t('pages.about.spread', 'Spread the word to fellow commuters')}</li>
            <li>{t('pages.about.follow', 'Follow us on social media for updates')}</li>
          </ul>
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
      triggerHaptic('error');
      const errorMessage = (err instanceof Error) ? (err as Error).message : t('pages.contact.submitError', 'Failed to submit feedback');
      setError(String(errorMessage));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="static-page">
      <Helmet>
        <title>Contact Us - Perundhu Tamil Nadu Bus Route Finder</title>
        <meta name="description" content="Contact the Perundhu team for help with Tamil Nadu bus routes and timings. Email us at perundhu@gmail.com. We respond within 24-48 hours." />
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
            <a href="mailto:perundhu@gmail.com" className="contact-link">
              perundhu@gmail.com
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
                onClick={() => {
                  triggerHaptic('medium');
                  setShowFeedbackForm(true);
                }}
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
                  onChange={(e) => {
                    triggerHaptic('light');
                    handleFeedbackChange(e);
                  }}
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
                    onClick={() => {
                      triggerHaptic('light');
                      fileInputRef.current?.click();
                    }}
                    disabled={submitting}
                    aria-label={t('pages.contact.chooseFile', 'Choose File')}
                  >
                    <Upload size={18} aria-hidden="true" />
                    {feedbackData.screenshot 
                      ? feedbackData.screenshot.name 
                      : t('pages.contact.chooseFile', 'Choose File')}
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
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  aria-busy={submitting}
                >
                  {submitting ? t('pages.contact.sending', 'Sending...') : t('pages.contact.submit', 'Submit Feedback')}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    triggerHaptic('light');
                    setShowFeedbackForm(false);
                  }}
                  disabled={submitting}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </form>
          )}
        </section>
        
        {/* TODO: Enable later - Report an Issue feature
        <section className="content-section">
          <h2>{t('pages.contact.reportIssueTitle', 'Report an Issue')}</h2>
          <p>{t('pages.contact.reportIssueText', 'Found incorrect bus timings or route information? Use the "Report Issue" feature on any bus route to let us know, and our team will verify and update the information.')}</p>
        </section>
        */}
        
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
      <Helmet>
        <title>Privacy Policy - Perundhu Tamil Nadu Bus Routes</title>
        <meta name="description" content="Perundhu privacy policy. We do not sell your data. Anonymous location sharing only during active bus tracking sessions." />
        <link rel="canonical" href="https://www.perundhu.com/privacy" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
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
          <p>{t('pages.privacy.yourRightsText', 'You have the right to access, correct, or delete your personal data. Contact us at perundhu@gmail.com for any privacy-related requests.')}</p>
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
      <Helmet>
        <title>Terms of Service - Perundhu Tamil Nadu Bus Routes</title>
        <meta name="description" content="Terms of service for Perundhu, the free Tamil Nadu bus route and timing finder. Free to use, community powered." />
        <link rel="canonical" href="https://www.perundhu.com/terms" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
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
      answer: t('pages.faq.a1', 'Enter your departure and destination locations in the search form on the home page, then click "Find Buses" to see available routes.')
    },
    {
      question: t('pages.faq.q2', 'Is the bus timing information accurate?'),
      answer: t('pages.faq.a2', 'Our database is updated regularly through official sources and people contributions. However, actual timings may vary due to traffic and other factors. Always allow extra time for your journey.')
    },
    {
      question: t('pages.faq.q3', 'How can I contribute route information?'),
      answer: t('pages.faq.a3', 'Click on "Contribute" in the app to add new route information. Currently, you can enter details manually using the form.')
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
    },
    {
      question: t('pages.faq.q9', 'Which cities and regions are covered?'),
      answer: t('pages.faq.a9', 'Perundhu covers all major cities and towns across Tamil Nadu, including Chennai, Coimbatore, Madurai, Trichy, Salem, and over 200 other locations. We are continuously expanding our coverage.')
    },
    {
      question: t('pages.faq.q10', 'How often is the schedule data updated?'),
      answer: t('pages.faq.a10', 'Official government bus schedules are updated monthly. User contributions are reviewed and added within 24-48 hours. Real-time tracking data is updated every 30 seconds when active.')
    },
    {
      question: t('pages.faq.q11', 'Can I save my favorite routes?'),
      answer: t('pages.faq.a11', 'Yes! Click the bookmark icon on any bus card to save it to your favorites. Access your saved routes quickly from the main menu.')
    },
    {
      question: t('pages.faq.q12', 'What types of buses are included?'),
      answer: t('pages.faq.a12', 'We include all government buses (TNSTC, MTC) and major private operators. This covers regular, express, deluxe, ultra-deluxe, AC, and non-AC services.')
    },
    {
      question: t('pages.faq.q13', 'How do I find buses with specific amenities?'),
      answer: t('pages.faq.a13', 'Use the filter options on the search results page to filter by bus type (AC/Non-AC), operator, and departure time. More advanced filters are coming soon.')
    },
    {
      question: t('pages.faq.q14', 'Can I book tickets through the app?'),
      answer: t('pages.faq.a14', 'Currently, we provide schedule information only. For bookings, you will be directed to official government portals like TNSTC online booking or contact numbers for specific operators.')
    },
    {
      question: t('pages.faq.q15', 'What if my bus route is not listed?'),
      answer: t('pages.faq.a15', 'You can contribute missing routes through the "Contribute" feature. Provide as much detail as possible including bus number, stops, and timings. Our team will verify and add it to the database.')
    },
    {
      question: t('pages.faq.q16', 'How accurate is the real-time tracking?'),
      answer: t('pages.faq.a16', 'Tracking accuracy depends on the number of active users on the bus. With 3+ active trackers, location accuracy is typically within 50-100 meters. GPS signal strength and network coverage also affect accuracy.')
    },
    {
      question: t('pages.faq.q17', 'Does tracking drain my phone battery?'),
      answer: t('pages.faq.a17', 'Our tracking feature is optimized for minimal battery usage. It typically uses less than 5% battery per hour when active. You can stop tracking anytime to conserve battery.')
    },
    {
      question: t('pages.faq.q18', 'How do I contact customer support?'),
      answer: t('pages.faq.a18', 'Visit the Contact Us page or email us at perundhu@gmail.com. We respond to all queries within 24-48 hours during business hours (Mon-Fri, 9 AM - 6 PM IST).')
    },
    {
      question: t('pages.faq.q19', 'Is my location data private?'),
      answer: t('pages.faq.a19', 'Yes. When you enable tracking, only anonymized location data is shared. We do not collect personal information or track you outside of active tracking sessions. See our Privacy Policy for complete details.')
    },
    {
      question: t('pages.faq.q20', 'Can I suggest new features?'),
      answer: t('pages.faq.a20', 'Absolutely! We love hearing from users. Submit your suggestions through the feedback form on the Contact Us page. Popular feature requests are prioritized in our development roadmap.')
    }
  ];
  
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.slice(0, 10).map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="static-page">
      <Helmet>
        <title>FAQ - Tamil Nadu Bus Timings &amp; Routes | Perundhu</title>
        <meta name="description" content="Frequently asked questions about Perundhu bus route finder. Find TNSTC, MTC and SETC bus timings across Tamil Nadu. Chennai, Coimbatore, Madurai and 200+ cities covered." />
        <link rel="canonical" href="https://www.perundhu.com/faq" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
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
