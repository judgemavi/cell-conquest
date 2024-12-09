/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SECURE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
