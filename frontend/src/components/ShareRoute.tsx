import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Location as AppLocation } from '../types';
import '../styles/share-route.css';

interface ShareRouteProps {
  bus: Bus;
  fromLocation: AppLocation;
  toLocation: AppLocation;
  onClose?: () => void;
}

interface ShareOption {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  color: string;
}

/**
 * Share Route Component
 * Allows users to share route details via WhatsApp, SMS, copy, or native share
 */
const ShareRoute: React.FC<ShareRouteProps> = ({
  bus,
  fromLocation,
  toLocation,
  onClose
}) => {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Get display name based on language
  const getDisplayName = (location: AppLocation): string => {
    if (i18n.language === 'ta' && location.translatedName) {
      return location.translatedName;
    }
    return location.name;
  };

  // Generate share text
  const generateShareText = useCallback((): string => {
    const from = getDisplayName(fromLocation);
    const to = getDisplayName(toLocation);
    const busInfo = bus.busName || bus.busNumber || t('share.bus', 'Bus');
    
    const lines = [
      `🚌 ${t('share.busRoute', 'Bus Route Information')}`,
      ``,
      `📍 ${t('share.from', 'From')}: ${from}`,
      `🎯 ${t('share.to', 'To')}: ${to}`,
      `🚍 ${t('share.bus', 'Bus')}: ${busInfo}`,
      `⏰ ${t('share.departure', 'Departure')}: ${bus.departureTime}`,
      `⏱️ ${t('share.arrival', 'Arrival')}: ${bus.arrivalTime}`,
    ];

    if (bus.fare) {
      lines.push(`💰 ${t('share.fare', 'Fare')}: ₹${bus.fare}`);
    }

    if (bus.duration) {
      lines.push(`⏳ ${t('share.duration', 'Duration')}: ${bus.duration}`);
    }

    lines.push(``);
    lines.push(`📱 ${t('share.via', 'Shared via')} Perundhu - Tamil Nadu Bus Tracker`);
    lines.push(`🔗 ${window.location.origin}`);

    return lines.join('\n');
  }, [bus, fromLocation, toLocation, t, i18n.language]);

  // Generate URL for sharing
  const generateShareUrl = useCallback((): string => {
    const params = new URLSearchParams({
      from: fromLocation.id.toString(),
      to: toLocation.id.toString(),
    });
    return `${window.location.origin}?${params.toString()}`;
  }, [fromLocation, toLocation]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generateShareText();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generateShareText]);

  // Share via WhatsApp
  const handleWhatsAppShare = useCallback(() => {
    const text = encodeURIComponent(generateShareText());
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [generateShareText]);

  // Share via SMS
  const handleSMSShare = useCallback(() => {
    const text = encodeURIComponent(generateShareText());
    const url = `sms:?body=${text}`;
    window.location.href = url;
  }, [generateShareText]);

  // Share via Telegram
  const handleTelegramShare = useCallback(() => {
    const text = encodeURIComponent(generateShareText());
    const url = `https://t.me/share/url?url=${encodeURIComponent(generateShareUrl())}&text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [generateShareText, generateShareUrl]);

  // Share via Email
  const handleEmailShare = useCallback(() => {
    const subject = encodeURIComponent(
      `${t('share.busRoute', 'Bus Route')}: ${getDisplayName(fromLocation)} → ${getDisplayName(toLocation)}`
    );
    const body = encodeURIComponent(generateShareText());
    const url = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = url;
  }, [generateShareText, fromLocation, toLocation, t]);

  // Native share API
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${t('share.busRoute', 'Bus Route')}: ${getDisplayName(fromLocation)} → ${getDisplayName(toLocation)}`,
          text: generateShareText(),
          url: generateShareUrl(),
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
          setShowModal(true);
        }
      }
    } else {
      setShowModal(true);
    }
  }, [generateShareText, generateShareUrl, fromLocation, toLocation, t]);

  // Check if native share is supported
  const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Share options
  const shareOptions: ShareOption[] = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: '📱',
      action: handleWhatsAppShare,
      color: '#25D366',
    },
    {
      id: 'sms',
      label: t('share.sms', 'SMS'),
      icon: '💬',
      action: handleSMSShare,
      color: '#3B82F6',
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: '✈️',
      action: handleTelegramShare,
      color: '#0088CC',
    },
    {
      id: 'email',
      label: t('share.email', 'Email'),
      icon: '📧',
      action: handleEmailShare,
      color: '#6B7280',
    },
    {
      id: 'copy',
      label: copied ? t('share.copied', 'Copied!') : t('share.copy', 'Copy'),
      icon: copied ? '✅' : '📋',
      action: handleCopy,
      color: copied ? '#10B981' : '#3B82F6',
    },
  ];

  return (
    <>
      {/* Share Button */}
      <button
        className="share-route-button"
        onClick={handleNativeShare}
        aria-label={t('share.shareRoute', 'Share route')}
        title={t('share.shareRoute', 'Share route')}
      >
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span className="share-button-text">{t('share.share', 'Share')}</span>
      </button>

      {/* Share Modal */}
      {showModal && (
        <div 
          className="share-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="share-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="share-modal-header">
              <h3>{t('share.shareRoute', 'Share Route')}</h3>
              <button 
                className="share-modal-close"
                onClick={() => {
                  setShowModal(false);
                  onClose?.();
                }}
                aria-label={t('common.close', 'Close')}
              >
                ✕
              </button>
            </div>

            <div className="share-modal-preview">
              <div className="preview-route">
                <span className="preview-from">📍 {getDisplayName(fromLocation)}</span>
                <span className="preview-arrow">→</span>
                <span className="preview-to">🎯 {getDisplayName(toLocation)}</span>
              </div>
              <div className="preview-bus">
                🚌 {bus.busName || bus.busNumber} • {bus.departureTime} - {bus.arrivalTime}
              </div>
            </div>

            <div className="share-options">
              {shareOptions.map((option) => (
                <button
                  key={option.id}
                  className="share-option-button"
                  onClick={() => {
                    option.action();
                    if (option.id !== 'copy') {
                      setShowModal(false);
                    }
                  }}
                  style={{ '--option-color': option.color } as React.CSSProperties}
                >
                  <span className="option-icon">{option.icon}</span>
                  <span className="option-label">{option.label}</span>
                </button>
              ))}
            </div>

            {supportsNativeShare && (
              <button 
                className="share-native-button"
                onClick={() => {
                  setShowModal(false);
                  handleNativeShare();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
                {t('share.moreOptions', 'More sharing options...')}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(ShareRoute);
