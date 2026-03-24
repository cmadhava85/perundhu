import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BusIcon, UsersIcon, CityIcon, TwitterIcon, FacebookIcon, InstagramIcon, MailIcon, InfoIcon, QuestionIcon, MailIcon as ContactIcon, LockIcon, FileIcon, HeartIcon } from './icons';
import '../styles/Footer.css';

interface PlatformStats {
  routeCount: number;
  contributorCount: number;
  cityCount: number;
  dailyUsers?: number;
}

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch platform stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiUrl}/v1/bus-schedules/public-stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.warn('Failed to fetch stats: response not ok', response.status);
        }
      } catch (error) {
        console.warn('Failed to fetch platform stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Format number with K suffix for large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${Math.floor(num / 1000)}K+`;
    }
    return num > 0 ? `${num}+` : '0';
  };
  
  return (
    <footer className="app-footer">
      <div className="footer-container">
        {/* Stats Section */}
        <div className="footer-stats">
          <div className="stat-item">
            <span className="stat-icon"><BusIcon size={24} /></span>
            <span className="stat-number">
              {statsLoading ? '...' : formatNumber(stats?.routeCount ?? 0)}
            </span>
            <span className="stat-label">{t('footer.stats.routes', 'Bus Routes')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon"><UsersIcon size={24} /></span>
            <span className="stat-number">
              {statsLoading ? '...' : formatNumber(stats?.contributorCount ?? 0)}
            </span>
            <span className="stat-label">{t('footer.stats.contributors', 'Contributors')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon"><CityIcon size={24} /></span>
            <span className="stat-number">
              {statsLoading ? '...' : formatNumber(stats?.cityCount ?? 0)}
            </span>
            <span className="stat-label">{t('footer.stats.cities', 'Cities Covered')}</span>
          </div>
          {stats?.dailyUsers !== undefined && (
            <div className="stat-item">
              <span className="stat-icon">👥</span>
              <span className="stat-number">
                {statsLoading ? '...' : formatNumber(stats?.dailyUsers ?? 0)}
              </span>
              <span className="stat-label">{t('footer.stats.dailyUsers', 'Daily Users')}</span>
            </div>
          )}
        </div>

        {/* Main Footer Content - Multi Column Layout */}
        <div className="footer-main">
          {/* Brand Column */}
          <div className="footer-brand">
            <div className="footer-logo-container">
              <img src="/favicon.svg" alt="Perundhu Logo" className="footer-logo-icon" loading="lazy" />
              <div>
                <h2 className="footer-logo">பேருந்து</h2>
                <span className="footer-logo-sub">Perundhu</span>
              </div>
            </div>
            <p className="footer-description">
              {t('footer.description', 'People-powered bus schedule platform for Tamil Nadu. Helping commuters find accurate bus timings.')}
            </p>
            
            {/* Social Links */}
            <div className="social-links">
              <a href="https://twitter.com/perundhu" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">
                <span className="social-icon"><TwitterIcon size={20} /></span>
              </a>
              <a href="https://facebook.com/perundhu" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                <span className="social-icon"><FacebookIcon size={20} /></span>
              </a>
              <a href="https://instagram.com/perundhu" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <span className="social-icon"><InstagramIcon size={20} /></span>
              </a>
              <a href="mailto:perundhu@gmail.com" className="social-link" aria-label="Email">
                <span className="social-icon"><MailIcon size={20} /></span>
              </a>
            </div>
          </div>
          
          {/* Quick Links Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">{t('footer.quickLinks', 'Quick Links')}</h3>
            <div className="footer-links-vertical">
              <Link to="/about" className="footer-link">
                <span className="link-icon"><InfoIcon size={16} /></span>
                {t('footer.aboutUs', 'About Us')}
              </Link>
              <Link to="/faq" className="footer-link">
                <span className="link-icon"><QuestionIcon size={16} /></span>
                {t('footer.faq', 'FAQ')}
              </Link>
              <Link to="/contact" className="footer-link">
                <span className="link-icon"><ContactIcon size={16} /></span>
                {t('footer.contactUs', 'Contact Us')}
              </Link>
            </div>
          </div>
          
          {/* Legal Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">{t('footer.legal', 'Legal')}</h3>
            <div className="footer-links-vertical">
              <Link to="/privacy" className="footer-link">
                <span className="link-icon"><LockIcon size={16} /></span>
                {t('footer.privacyPolicy', 'Privacy Policy')}
              </Link>
              <Link to="/terms" className="footer-link">
                <span className="link-icon"><FileIcon size={16} /></span>
                {t('footer.termsOfService', 'Terms of Service')}
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {year} {t('footer.title', 'Perundhu')}. {t('footer.allRightsReserved', 'All Rights Reserved.')}
          </p>
          <p className="footer-made-with">
            {t('footer.madeWith', 'Made with')} <span className="heart"><HeartIcon size={16} color="#EF4444" filled /></span> {t('footer.inTamilNadu', 'in Tamil Nadu')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);