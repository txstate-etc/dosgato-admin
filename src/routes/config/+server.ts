import { json } from '@sveltejs/kit'

export async function GET () {
  return json({
    apiBase: process.env.API_BASE,
    assetLiveBase: process.env.ASSET_LIVE_BASE,
    authRedirect: process.env.AUTH_REDIRECT,
    renderBase: process.env.RENDER_BASE,
    tracingServer: process.env.TRACING_SERVER
  })
}
