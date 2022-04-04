export async function get () {
  return {
    body: {
      apiBase: process.env.API_BASE,
      authRedirect: process.env.AUTH_REDIRECT
    }
  }
}
