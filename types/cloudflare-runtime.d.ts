/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */

interface Fetcher {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
}

interface D1Database {}

declare module "cloudflare:workers" {
  export const env: {
    DB: any;
  };
}
