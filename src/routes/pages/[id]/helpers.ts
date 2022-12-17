import { type SubNavLink, type PageEditorPage, environmentConfig, api } from '$lib'

export interface PageSubNavLink extends SubNavLink {
  pageId: string
}

export async function getTempToken (page: PageEditorPage, currentToken?: string, skfetch = fetch) {
  const resp = await skfetch(environmentConfig.renderBase + '/.token' + page.path + (currentToken ? `?currentToken=${currentToken}` : ''), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${api.token ?? ''}`
    }
  })
  return await resp.text()
}
