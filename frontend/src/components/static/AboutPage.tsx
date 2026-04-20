import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import '../../styles/static-pages.css';

const AboutPage: React.FC = () => {
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
          <h2>{t('pages.about.futureTitle', "What's Next")}</h2>
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

export default AboutPage;
