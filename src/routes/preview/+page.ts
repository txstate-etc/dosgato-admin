import { api, environmentConfig } from '$lib'
import { error, redirect, type Load } from '@sveltejs/kit'
import { isNotBlank } from 'txstate-utils'

export const load: Load = async input => {
  await input.parent()
  if (api.token && isNotBlank(input.url.searchParams.get('url'))) {
    const rBase = new URL(environmentConfig.renderBase, location.protocol + '//' + location.host).toString()
    const requestedUrl = new URL(input.url.searchParams.get('url')!, rBase).toString()
    const preview = new URL('.preview', rBase).toString()
    const compare = new URL('.compare', rBase).toString()
    if (
      !requestedUrl.startsWith(preview) &&
      !requestedUrl.startsWith(compare)
    ) throw error(400, 'This path only helps with preview and compare links.')
    const parsedUrl = new URL(requestedUrl, input.url)
    parsedUrl.searchParams.append('token', api.token)
    throw redirect(302, parsedUrl.toString())
  }
}
