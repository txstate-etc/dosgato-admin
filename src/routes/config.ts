export async function GET () {
  return {
    body: {
      apiBase: process.env.API_BASE,
      authRedirect: process.env.AUTH_REDIRECT,
      renderBase: process.env.RENDER_BASE
    }
  }
}
