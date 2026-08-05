/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_POS_BASE_PATH: string
  readonly VITE_API_PROXY_TARGET: string
  readonly VITE_DEV_DEVICE_TOKEN: string
  readonly VITE_DEV_COMPANY_ID: string
  readonly VITE_DEV_STAFF_ID: string
  readonly VITE_DEV_STAFF_PIN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
