import { api, environmentConfig } from '$lib'
import { error, redirect, type Load } from '@sveltejs/kit'
import { isNotBlank } from 'txstate-utils'

export const load: Load = async input => {
  await input.parent()
  if (api.token && isNotBlank(input.url.searchParams.get('url'))) {
    const requestedUrl = new URL(input.url.searchParams.get('url')!, window.location.href).toString()
    if (
      !requestedUrl.startsWith('/.preview/') &&
      !requestedUrl.startsWith('/.compare/') &&
      !requestedUrl.startsWith(environmentConfig.renderBase + '/.preview/') &&
      !requestedUrl.startsWith(environmentConfig.renderBase + '/.compare/')
    ) throw error(400, 'This path only helps with preview and compare links.')
    const parsedUrl = new URL(requestedUrl, input.url)
    parsedUrl.searchParams.append('token', api.token)
    throw redirect(302, parsedUrl.toString())
  }
}
