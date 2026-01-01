import React from 'react';
import './empty-state.css';

export type EmptyStateType = 
  | 'no-results' 
  | 'no-recent-searches' 
  | 'no-favorites' 
  | 'no-connecting-routes'
  | 'error'
  | 'offline';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultContent: Record<EmptyStateType, { title: string; description: string; icon: React.ReactNode }> = {
  'no-results': {
    title: 'No buses found',
    description: 'Try adjusting your search or selecting different locations',
    icon: (
      <svg viewBox="0 0 200 200" className="empty-state__illustration">
        <defs>
          <linearGradient id="bus-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--transit-primary)" />
            <stop offset="100%" stopColor="var(--transit-primary-dark)" />
          </linearGradient>
        </defs>
        {/* Bus outline */}
        <rect x="50" y="70" width="100" height="60" rx="8" fill="none" stroke="url(#bus-gradient)" strokeWidth="3" opacity="0.3" />
        <circle cx="70" cy="135" r="8" fill="none" stroke="url(#bus-gradient)" strokeWidth="2" opacity="0.3" />
        <circle cx="130" cy="135" r="8" fill="none" stroke="url(#bus-gradient)" strokeWidth="2" opacity="0.3" />
        {/* Search magnifying glass */}
        <circle cx="120" cy="90" r="20" fill="none" stroke="var(--transit-primary)" strokeWidth="3" />
        <line x1="135" y1="105" x2="155" y2="125" stroke="var(--transit-primary)" strokeWidth="3" strokeLinecap="round" />
        {/* Question mark */}
        <text x="120" y="98" fontSize="24" fill="var(--transit-primary)" textAnchor="middle" fontWeight="600">?</text>
      </svg>
    ),
  },
  'no-recent-searches': {
    title: 'No recent searches',
    description: 'Your search history will appear here',
    icon: (
      <svg viewBox="0 0 200 200" className="empty-state__illustration">
        <defs>
          <linearGradient id="history-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-neutral-400)" />
            <stop offset="100%" stopColor="var(--color-neutral-500)" />
          </linearGradient>
        </defs>
        {/* Clock circle */}
        <circle cx="100" cy="100" r="50" fill="none" stroke="url(#history-gradient)" strokeWidth="3" />
        {/* Clock hands */}
        <line x1="100" y1="100" x2="100" y2="70" stroke="url(#history-gradient)" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="100" x2="120" y2="110" stroke="url(#history-gradient)" strokeWidth="2" strokeLinecap="round" />
        {/* Clock center dot */}
        <circle cx="100" cy="100" r="4" fill="var(--color-neutral-500)" />
      </svg>
    ),
  },
  'no-favorites': {
    title: 'No favorites yet',
    description: 'Swipe right on bus cards to save your favorite routes',
    icon: (
      <svg viewBox="0 0 200 200" className="empty-state__illustration">
        <defs>
          <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--semantic-info)" />
            <stop offset="100%" stopColor="var(--transit-primary)" />
          </linearGradient>
        </defs>
        {/* Heart outline */}
        <path
          d="M100,150 C100,150 40,110 40,75 C40,55 55,45 70,45 C85,45 95,55 100,65 C105,55 115,45 130,45 C145,45 160,55 160,75 C160,110 100,150 100,150 Z"
          fill="none"
          stroke="url(#heart-gradient)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Plus sign for "add" */}
        <line x1="100" y1="90" x2="100" y2="110" stroke="var(--transit-primary)" strokeWidth="3" strokeLinecap="round" />
        <line x1="90" y1="100" x2="110" y2="100" stroke="var(--transit-primary)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  'no-connecting-routes': {
    title: 'No connecting routes available',
    description: 'Try selecting different locations or check back later',
    icon: (
      <svg viewBox="0 0 200 200" className="empty-state__illustration">
        <defs>
          <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--transit-primary)" />
            <stop offset="100%" stopColor="var(--transit-primary-dark)" />
          </linearGradient>
        </defs>
        {/* Start point */}
        <circle cx="50" cy="100" r="12" fill="var(--semantic-success)" />
        {/* End point */}
        <circle cx="150" cy="100" r="12" fill="var(--semantic-error)" />
        {/* Broken path */}
        <line x1="62" y1="100" x2="85" y2="100" stroke="url(#route-gradient)" strokeWidth="3" strokeDasharray="5,5" opacity="0.3" />
        <line x1="115" y1="100" x2="138" y2="100" stroke="url(#route-gradient)" strokeWidth="3" strokeDasharray="5,5" opacity="0.3" />
        {/* X mark in middle */}
        <line x1="90" y1="90" x2="110" y2="110" stroke="var(--semantic-error)" strokeWidth="3" strokeLinecap="round" />
        <line x1="110" y1="90" x2="90" y2="110" stroke="var(--semantic-error)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  'error': {
    title: 'Something went wrong',
    description: 'We encountered an error. Please try again.',
    icon: (
      <svg viewBox="0 0 200 200" className="empty-state__illustration">
        <defs>
          <linearGradient id="error-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--semantic-error)" />
            <stop offset="100%" stopColor="var(--semantic-error-dark)" />
          </linearGradient>
        </defs>
        {/* Alert triangle */}
        <path
          d="M100,40 L160,150 L40,150 Z"
          fill="none"
          stroke="url(#error-gradient)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Exclamation mark */}
        <line x1="100" y1="80" x2="100" y2="120" stroke="var(--semantic-error)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="135" r="3" fill="var(--semantic-error)" />
      </svg>
    ),
  },
  'offline': {
    title: 'You\'re offline',
    description: 'Check your internet connection and try again',
    icon: (
      <svg viewBox="0 0 200 200" className="empty-state__illustration">
        <defs>
          <linearGradient id="offline-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-neutral-400)" />
            <stop offset="100%" stopColor="var(--color-neutral-500)" />
          </linearGradient>
        </defs>
        {/* Wifi symbol (disconnected) */}
        <path d="M70,110 Q100,90 130,110" fill="none" stroke="url(#offline-gradient)" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
        <path d="M50,90 Q100,60 150,90" fill="none" stroke="url(#offline-gradient)" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
        <circle cx="100" cy="130" r="5" fill="var(--color-neutral-500)" opacity="0.3" />
        {/* X mark over wifi */}
        <line x1="70" y1="70" x2="130" y2="130" stroke="var(--semantic-error)" strokeWidth="4" strokeLinecap="round" />
        <line x1="130" y1="70" x2="70" y2="130" stroke="var(--semantic-error)" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-results',
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  const content = defaultContent[type];
  const displayTitle = title || content.title;
  const displayDescription = description || content.description;
  const displayIcon = icon || content.icon;

  return (
    <div className={`empty-state ${className}`} role="status" aria-live="polite">
      <div className="empty-state__icon" aria-hidden="true">
        {displayIcon}
      </div>
      
      <h2 className="empty-state__title">{displayTitle}</h2>
      
      <p className="empty-state__description">{displayDescription}</p>
      
      {action && (
        <button
          className="transit-button transit-button--primary empty-state__action"
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
