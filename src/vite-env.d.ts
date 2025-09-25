/// <reference types="vite/client" />

declare const __BUILD_TIME__: string | undefined;

interface ImportMetaEnv {
  readonly VITE_BUILD_TIME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
