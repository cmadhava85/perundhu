import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

interface PlatformStats {
  routeCount: number;
  contributorCount: number;
  cityCount: number;
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
        const response = await fetch('/api/v1/bus-schedules/public-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
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
      {/* Wave decoration at top */}
      <div className="footer-wave">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
        </svg>
      </div>
      
      <div className="footer-container">
        {/* Stats Section */}
        <div className="footer-stats">
          <div className="stat-item">
            <span className="stat-icon">🚌</span>
            <span className="stat-number">
              {statsLoading ? '...' : formatNumber(stats?.routeCount ?? 0)}
            </span>
            <span className="stat-label">{t('footer.stats.routes', 'Bus Routes')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">👥</span>
            <span className="stat-number">
              {statsLoading ? '...' : formatNumber(stats?.contributorCount ?? 0)}
            </span>
            <span className="stat-label">{t('footer.stats.contributors', 'Contributors')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🏙️</span>
            <span className="stat-number">
              {statsLoading ? '...' : formatNumber(stats?.cityCount ?? 0)}
            </span>
            <span className="stat-label">{t('footer.stats.cities', 'Cities Covered')}</span>
          </div>
        </div>
        
        <div className="footer-main">
          {/* Brand Column */}
          <div className="footer-brand">
            <div className="footer-logo-container">
              <span className="footer-logo-icon">🚌</span>
              <div>
                <h2 className="footer-logo">பேருந்து</h2>
                <span className="footer-logo-sub">Perundhu</span>
              </div>
            </div>
            <p className="footer-description">
              {t('footer.description', 'Community-powered bus schedule platform for Tamil Nadu. Helping commuters find accurate bus timings.')}
            </p>
            
            {/* Social Links */}
            <div className="social-links">
              <a href="https://twitter.com/perundhu" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">
                <span className="social-icon">𝕏</span>
              </a>
              <a href="https://facebook.com/perundhu" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                <span className="social-icon">f</span>
              </a>
              <a href="https://instagram.com/perundhu" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <span className="social-icon">📷</span>
              </a>
              <a href="mailto:support@perundhu.in" className="social-link" aria-label="Email">
                <span className="social-icon">✉️</span>
              </a>
            </div>
          </div>
          
          {/* Quick Links Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">{t('footer.quickLinks', 'Quick Links')}</h3>
            <div className="footer-links-vertical">
              <Link to="/about" className="footer-link">
                <span className="link-icon">ℹ️</span>
                {t('footer.aboutUs', 'About Us')}
              </Link>
              <Link to="/faq" className="footer-link">
                <span className="link-icon">❓</span>
                {t('footer.faq', 'FAQ')}
              </Link>
              <Link to="/contact" className="footer-link">
                <span className="link-icon">📧</span>
                {t('footer.contactUs', 'Contact Us')}
              </Link>
            </div>
          </div>
          
          {/* Legal Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">{t('footer.legal', 'Legal')}</h3>
            <div className="footer-links-vertical">
              <Link to="/privacy" className="footer-link">
                <span className="link-icon">🔒</span>
                {t('footer.privacyPolicy', 'Privacy Policy')}
              </Link>
              <Link to="/terms" className="footer-link">
                <span className="link-icon">📋</span>
                {t('footer.termsOfService', 'Terms of Service')}
              </Link>
            </div>
          </div>
          
          {/* Contribute Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">{t('footer.contribute', 'Contribute')}</h3>
            <div className="footer-links-vertical">
              <Link to="/?tab=contribute" className="footer-link">
                <span className="link-icon">➕</span>
                {t('footer.addRoute', 'Add Bus Route')}
              </Link>
              <Link to="/?tab=contribute" className="footer-link">
                <span className="link-icon">🎙️</span>
                {t('footer.voiceContribute', 'Voice Contribution')}
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
            {t('footer.madeWith', 'Made with')} <span className="heart">❤️</span> {t('footer.inTamilNadu', 'in Tamil Nadu')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);