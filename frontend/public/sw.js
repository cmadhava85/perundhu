/* eslint-disable no-restricted-globals */
/**
 * Minimal Service Worker for PWA support.
 * Only handles the install/activate lifecycle.
 * Does NOT cache or intercept any network requests — this ensures third-party
 * scripts (Google AdSense, etc.) are always fetched from the network.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
