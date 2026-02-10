/* eslint-disable no-console */
/**
 * Service Worker Registration for PWA support
 * Enables offline functionality and app installation on mobile devices
 */

// Type definitions for PWA-related browser APIs
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Register service worker for PWA capabilities
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.warn('❌ Service Worker registration failed:', error);
        });
    });
  }
}

/**
 * Check if app is installed as PWA
 */
export function isPWAInstalled(): boolean {
  // Check if running as PWA on iOS
  if ((window.navigator as NavigatorWithStandalone).standalone === true) {
    return true;
  }
  
  // Check if running as PWA on Android
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check if running in app mode
  const nav = window.navigator as unknown as Record<string, Record<string, unknown>>;
  if (nav.app && nav.app.isPhoneGap) {
    return true;
  }
  
  return false;
}

/**
 * Request app installation prompt (for Android/PWA)
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Store the event for later use
    deferredPrompt = e as BeforeInstallPromptEvent;
    // Show install button
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ App installed as PWA');
    hideInstallButton();
  });
}

function showInstallButton() {
  const button = document.getElementById('install-pwa-button');
  if (button) {
    button.style.display = 'block';
  }
}

function hideInstallButton() {
  const button = document.getElementById('install-pwa-button');
  if (button) {
    button.style.display = 'none';
  }
}

export function requestInstall() {
  if (!deferredPrompt) {
    return;
  }

  deferredPrompt.prompt();

  deferredPrompt.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('✅ User accepted installation');
    } else {
      console.log('❌ User declined installation');
    }
    deferredPrompt = null;
    hideInstallButton();
  });
}
