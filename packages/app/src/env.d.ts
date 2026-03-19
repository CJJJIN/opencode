import "solid-js"

declare global {
  /** Injected by Vite define — see vite.js and vite.config.ts */
  const __OPENCODE_EDITION__: string

  interface ImportMetaEnv {
    readonly VITE_OPENCODE_SERVER_HOST: string
    readonly VITE_OPENCODE_SERVER_PORT: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      sortable: true
    }
  }
}

export {}
