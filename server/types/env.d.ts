declare namespace NodeJS {
  export interface ProcessEnv {
    WSS_PORT?: number;
    WSS_SSL_KEY?: string;
    WSS_SSL_CERT?: string;
    WSS_REDIS_URL: string;
    WSS_REDIS_CHANNEL: string;
    WSS_KEYCLOAK_PK: string;
  }
}
