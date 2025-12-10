import React from 'react';
import { useTranslation } from 'react-i18next';
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
            <a href="#" className="footer-link">{t('footer.aboutUs', 'About Us')}</a>
            <a href="#" className="footer-link">{t('footer.contactUs', 'Contact Us')}</a>
            <a href="#" className="footer-link">{t('footer.privacyPolicy', 'Privacy Policy')}</a>
            <a href="#" className="footer-link">{t('footer.termsOfService', 'Terms of Service')}</a>
          </div>
          <p className="footer-copyright">{t('footer.copyright', 'Tamil Nadu Bus Scheduler')}. {t('footer.allRightsReserved', 'All Rights Reserved.')}</p>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);