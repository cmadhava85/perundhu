import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import '../../styles/static-pages.css';

const PrivacyPage: React.FC = () => {
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
          <p>{t('pages.privacy.yourRightsText', 'You have the right to access, correct, or delete your personal data. Contact us at perundhutn@gmail.com for any privacy-related requests.')}</p>
        </section>

        <div className="back-link">
          <Link to="/">← {t('common.backToHome', 'Back to Home')}</Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
