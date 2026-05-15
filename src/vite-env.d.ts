/// <reference types="vite/client" />
/// <reference types="twin.macro" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SSR_API_URL?: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_UPLOAD_PUBLIC_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
