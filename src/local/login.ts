import { type LoadEvent, redirect } from '@sveltejs/kit'

export function handleUnauthorized (environmentConfig: any, response: any) {
  const authRedirect = new URL(environmentConfig.authRedirect)
  authRedirect.searchParams.set('returnUrl', `${location.origin}/.admin`)
  authRedirect.searchParams.set('requestedUrl', location.href)
  throw redirect(302, authRedirect.toString())
}

export function getRedirect ({ url }: LoadEvent) {
  const { searchParams } = url
  return searchParams.get('requestedUrl')
}

export function getToken ({ url }: LoadEvent) {
  const { searchParams } = url
  return searchParams.get('unifiedJwt') ?? undefined
}

export function logout (environmentConfig: any, token: string) {
  const url = new URL(location.href)
  url.search = ''
  location.replace(url)
}
