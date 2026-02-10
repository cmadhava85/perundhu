/**
 * Vite plugin to inject development-specific CSP meta tag
 * This allows localhost connections during development without modifying the production HTML
 */

export default function viteCspDevPlugin() {
  return {
    name: 'vite-csp-dev',
    transformIndexHtml(html) {
      // Only inject dev CSP in development mode
      if (process.env.NODE_ENV === 'development') {
        // Replace the production CSP with a dev-friendly version that allows localhost
        const devCsp = `default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://pagead2.googlesyndication.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https: http://localhost:* blob:; font-src 'self'; connect-src 'self' https: http://localhost:* ws://localhost:*; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self';`;
        
        return html.replace(
          /<meta http-equiv="Content-Security-Policy" content="[^"]*">/,
          `<meta http-equiv="Content-Security-Policy" content="${devCsp}">`
        );
      }
      return html;
    }
  };
}
