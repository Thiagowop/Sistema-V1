/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLICKUP_API_TOKEN: string;
  readonly VITE_CLICKUP_LIST_IDS: string;
  readonly VITE_CLICKUP_TEAM_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
