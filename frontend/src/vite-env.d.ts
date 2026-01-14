/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PREPROD_API_URL?: string;
  readonly VITE_RECAPTCHA_SITE_KEY?: string;
  readonly VITE_RECAPTCHA_ENTERPRISE?: string;
  readonly VITE_RECAPTCHA_ENABLED?: string;
  readonly VITE_ENABLE_PERFORMANCE_MONITORING?: string;
  readonly VITE_PERFORMANCE_SAMPLE_RATE?: string;
  readonly NODE_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend NodeJS global process
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV?: string;
    readonly VITE_ENABLE_PERFORMANCE_MONITORING?: string;
    readonly VITE_PERFORMANCE_SAMPLE_RATE?: string;
  }
}
