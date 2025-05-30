import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <p>© {year} {t('footer.copyright', 'Tamil Nadu Bus Scheduler')}</p>
    </footer>
  );
};

export default Footer;