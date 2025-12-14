import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const _year = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <h2 className="footer-logo">{t('footer.title', 'Tamil Nadu Bus Scheduler')}</h2>
          <div className="footer-links">
            <Link to="/about" className="footer-link">{t('footer.aboutUs', 'About Us')}</Link>
            <Link to="/contact" className="footer-link">{t('footer.contactUs', 'Contact Us')}</Link>
            <Link to="/faq" className="footer-link">{t('footer.faq', 'FAQ')}</Link>
            <Link to="/privacy" className="footer-link">{t('footer.privacyPolicy', 'Privacy Policy')}</Link>
            <Link to="/terms" className="footer-link">{t('footer.termsOfService', 'Terms of Service')}</Link>
          </div>
          <p className="footer-copyright">{t('footer.copyright', 'Tamil Nadu Bus Scheduler')}. {t('footer.allRightsReserved', 'All Rights Reserved.')}</p>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);