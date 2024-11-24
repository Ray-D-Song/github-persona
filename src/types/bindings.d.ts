import { D1Database } from '@cloudflare/workers-types/experimental'

interface Bindings {
  DB: D1Database
  AI: Ai
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  REDIRECT_URI: string
}
