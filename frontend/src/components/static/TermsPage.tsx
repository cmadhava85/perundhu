import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import '../../styles/static-pages.css';

const TermsPage: React.FC = () => {
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

export default TermsPage;
