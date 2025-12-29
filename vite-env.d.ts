/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CLICKUP_API_TOKEN: string
    readonly VITE_CLICKUP_TEAM_ID: string
    readonly VITE_CLICKUP_LIST_ID: string
    readonly VITE_PROXY_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
