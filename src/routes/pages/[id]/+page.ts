import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'
import { api, environmentConfig, pageEditorStore, type PageEditorPage } from '$lib'

export async function getTempToken (page: PageEditorPage, skfetch = fetch) {
  const resp = await skfetch(environmentConfig.renderBase + '/token' + page.path, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${api.token ?? ''}`
    }
  })
  return await resp.text()
}

export const load: PageLoad = async ({ params, fetch }) => {
  const page = await api.getEditorPage(params.id)
  if (!page) throw error(404)
  const temptoken = await getTempToken(page, fetch)
  pageEditorStore.open(page)
  return { temptoken }
}
