/**
 * Keyboard Shortcuts - Phase 2 Enhancement
 * Global keyboard shortcuts for improved navigation
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
}

interface KeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ shortcuts }) => {
  const [showHelp, setShowHelp] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show/hide help with ? key
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      // Check each shortcut
      for (const shortcut of shortcuts) {
        const modifiersMatch = 
          (!shortcut.modifiers || shortcut.modifiers.length === 0) ||
          shortcut.modifiers.every(mod => {
            if (mod === 'ctrl') return event.ctrlKey || event.metaKey;
            if (mod === 'shift') return event.shiftKey;
            if (mod === 'alt') return event.altKey;
            if (mod === 'meta') return event.metaKey;
            return false;
          });

        if (event.key.toLowerCase() === shortcut.key.toLowerCase() && modifiersMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  if (!showHelp) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 'var(--space-4)',
      }}
      onClick={() => setShowHelp(false)}
    >
      <div
        style={{
          background: 'var(--transit-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-4)',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--transit-text-primary)',
              margin: 0,
            }}
          >
            ⌨️ {t('shortcuts.title', 'Keyboard Shortcuts')}
          </h2>
          <button
            onClick={() => setShowHelp(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--transit-text-secondary)',
              padding: '4px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={t('common.close', 'Close')}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'var(--transit-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--transit-divider)',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  color: 'var(--transit-text-primary)',
                  fontWeight: '500',
                }}
              >
                {shortcut.description}
              </span>
              <kbd
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              >
                {shortcut.modifiers?.map((mod) => (
                  <span key={mod}>
                    {mod === 'ctrl' && '⌃'}
                    {mod === 'shift' && '⇧'}
                    {mod === 'alt' && '⌥'}
                    {mod === 'meta' && '⌘'}
                  </span>
                ))}
                {shortcut.key.toUpperCase()}
              </kbd>
            </div>
          ))}

          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              background: 'var(--semantic-info-bg)',
              border: '1px solid var(--semantic-info-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--semantic-info)',
            }}
          >
            💡 {t('shortcuts.tip', 'Press ? to toggle this help dialog')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
