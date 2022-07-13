import type { LoadEvent } from '@sveltejs/kit'

export function handleUnauthorized () {
  location.assign(process.env.AUTH_REDIRECT!)
}

export function getToken ({ url }: LoadEvent) {
  const { searchParams } = url
  return searchParams.get('unifiedJwt') ?? undefined
}
