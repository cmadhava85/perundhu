import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CookieConsent.css';

const CONSENT_KEY = 'perundhu_cookie_consent';

/**
 * Cookie consent banner required by Google AdSense EU User Consent Policy.
 * Stores acceptance in localStorage. Banner is never shown again once accepted.
 * Keeps no state on the server — fully client-side.
 */
const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Delay slightly so it doesn't flash on first paint
    const timer = setTimeout(() => {
      if (!localStorage.getItem(CONSENT_KEY)) {
        setVisible(true);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-consent" aria-label="Cookie consent" aria-live="polite">
      <div className="cookie-consent__content">
        <p className="cookie-consent__text">
          We use cookies, including Google AdSense cookies, to personalise content and ads,
          and to analyse our traffic. By clicking <strong>Accept</strong>, you consent to our
          use of cookies.{' '}
          <Link to="/privacy" className="cookie-consent__link">Learn more</Link>.
        </p>
        <div className="cookie-consent__actions">
          <button className="cookie-consent__btn cookie-consent__btn--decline" onClick={decline}>
            Decline
          </button>
          <button className="cookie-consent__btn cookie-consent__btn--accept" onClick={accept}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
