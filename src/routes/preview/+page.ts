import { api, environmentConfig } from '$lib'
import { error, redirect, type Load } from '@sveltejs/kit'

export const load: Load = async input => {
  await input.parent()
  if (api.token) {
    const requestedUrl = input.url.searchParams.get('url')
    if (!requestedUrl?.startsWith(environmentConfig.renderBase + '/.preview/')) throw error(400, 'This path only helps with preview links.')
    const parsedUrl = new URL(requestedUrl, input.url)
    parsedUrl.searchParams.append('token', api.token)
    throw redirect(302, parsedUrl.toString())
  }
}
