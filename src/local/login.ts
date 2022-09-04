import { type LoadEvent, redirect } from '@sveltejs/kit'

export function handleUnauthorized (environmentConfig: any, response: any) {
  const authRedirect = new URL(environmentConfig.authRedirect)
  authRedirect.searchParams.set('returnUrl', location.href)
  throw redirect(301, authRedirect.toString())
}

export function getToken ({ url }: LoadEvent) {
  const { searchParams } = url
  return searchParams.get('unifiedJwt') ?? undefined
}
