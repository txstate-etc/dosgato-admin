import type { LoadInput } from '@sveltejs/kit/types/internal'

export function handleUnauthorized () {
  location.assign(process.env.AUTH_REDIRECT)
}

export function getToken ({ url }: LoadInput) {
  const { searchParams } = url
  return searchParams.get('unifiedJwt')
}
