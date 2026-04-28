import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/home-page-content.css';

/**
 * Static content section rendered below the search form on the home page.
 * Provides rich text content so Google AdSense reviewers and search crawlers
 * see a content-rich page, not just a utility search widget.
 */
const HomePageContent: React.FC = () => {
  const { t } = useTranslation();

  const routes: Array<{ from: string; to: string; desc: string }> = t('homeContent.popularRoutes.routes', { returnObjects: true });
  const busTypes: Array<{ type: string; operator: string; desc: string }> = t('homeContent.busTypes.types', { returnObjects: true });
  const faqItems: Array<{ q: string; a: string }> = t('homeContent.faq.items', { returnObjects: true });

  return (
    <div className="home-page-content">

      {/* How It Works */}
      <section className="hpc-section" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="hpc-section-title">
          {t('homeContent.howTo.title')}
        </h2>
        <div className="hpc-steps">
          <div className="hpc-step">
            <span className="hpc-step-number">1</span>
            <div>
              <h3>{t('homeContent.howTo.step1Title')}</h3>
              <p>{t('homeContent.howTo.step1Desc')}</p>
            </div>
          </div>
          <div className="hpc-step">
            <span className="hpc-step-number">2</span>
            <div>
              <h3>{t('homeContent.howTo.step2Title')}</h3>
              <p>{t('homeContent.howTo.step2Desc')}</p>
            </div>
          </div>
          <div className="hpc-step">
            <span className="hpc-step-number">3</span>
            <div>
              <h3>{t('homeContent.howTo.step3Title')}</h3>
              <p>{t('homeContent.howTo.step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="hpc-section" aria-labelledby="popular-routes-heading">
        <h2 id="popular-routes-heading" className="hpc-section-title">
          {t('homeContent.popularRoutes.title')}
        </h2>
        <p className="hpc-intro-text">
          {t('homeContent.popularRoutes.intro')}
        </p>
        <div className="hpc-routes-grid">
          {Array.isArray(routes) && routes.map((route) => (
            <div key={`${route.from}-${route.to}`} className="hpc-route-card">
              <div className="hpc-route-header">
                <span className="hpc-route-from">{route.from}</span>
                <span className="hpc-route-arrow">→</span>
                <span className="hpc-route-to">{route.to}</span>
              </div>
              <p className="hpc-route-desc">{route.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About the Service */}
      <section className="hpc-section" aria-labelledby="about-service-heading">
        <h2 id="about-service-heading" className="hpc-section-title">
          {t('homeContent.about.title')}
        </h2>
        <p>{t('homeContent.about.p1')}</p>
        <p>{t('homeContent.about.p2')}</p>
        <p>{t('homeContent.about.p3')}</p>
        <div className="hpc-cta-links">
          <Link to="/about" className="hpc-link">{t('homeContent.about.learnMore')}</Link>
          <Link to="/faq" className="hpc-link">{t('homeContent.about.readFaq')}</Link>
          <Link to="/contribute" className="hpc-link">{t('homeContent.about.contribute')}</Link>
        </div>
      </section>

      {/* Cities Covered */}
      <section className="hpc-section" aria-labelledby="cities-heading">
        <h2 id="cities-heading" className="hpc-section-title">
          {t('homeContent.cities.title')}
        </h2>
        <p className="hpc-intro-text">
          {t('homeContent.cities.intro')}
        </p>
        <div className="hpc-cities-grid">
          {[
            'Chennai', 'Coimbatore', 'Madurai', 'Trichy (Tiruchirappalli)',
            'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi (Tuticorin)',
            'Dindigul', 'Thanjavur', 'Ranipet', 'Kancheepuram', 'Sivakasi',
            'Ooty (Udhagamandalam)', 'Hosur', 'Nagercoil', 'Kumbakonam',
            'Karur', 'Virudhunagar', 'Namakkal', 'Dharmapuri', 'Krishnagiri',
            'Perambalur', 'Ariyalur', 'Nagapattinam', 'Ramanathapuram',
            'Pudukkottai', 'Sivaganga', 'Tiruvannamalai', 'Villupuram',
            'Cuddalore', 'Mayiladuthurai', 'Tiruvarur', 'Tenkasi', 'Chengalpattu',
          ].map((city) => (
            <span key={city} className="hpc-city-tag">{city}</span>
          ))}
        </div>
      </section>

      {/* Bus Types Guide */}
      <section className="hpc-section" aria-labelledby="bus-types-heading">
        <h2 id="bus-types-heading" className="hpc-section-title">
          {t('homeContent.busTypes.title')}
        </h2>
        <div className="hpc-bus-types">
          {Array.isArray(busTypes) && busTypes.map((bus) => (
            <div key={bus.type} className="hpc-bus-type-card">
              <h3 className="hpc-bus-type-name">{bus.type}</h3>
              <span className="hpc-bus-operator">{bus.operator}</span>
              <p>{bus.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="hpc-section" aria-labelledby="faq-teaser-heading">
        <h2 id="faq-teaser-heading" className="hpc-section-title">
          {t('homeContent.faq.title')}
        </h2>
        <div className="hpc-faq-list">
          {Array.isArray(faqItems) && faqItems.map((item) => (
            <div key={item.q} className="hpc-faq-item">
              <h3 className="hpc-faq-q">{item.q}</h3>
              <p className="hpc-faq-a">{item.a}</p>
            </div>
          ))}
        </div>
        <div className="hpc-cta-links">
          <Link to="/faq" className="hpc-link">{t('homeContent.faq.viewAll')}</Link>
        </div>
      </section>

    </div>
  );
};

export default HomePageContent;
