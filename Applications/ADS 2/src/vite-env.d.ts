/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PEGA_SERVER_URL: string;
  readonly VITE_PEGA_AUTH_METHOD: string;
  readonly VITE_PEGA_USERNAME: string;
  readonly VITE_PEGA_PASSWORD: string;
  readonly VITE_PEGA_CLIENT_ID: string;
  readonly VITE_PEGA_CLIENT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
