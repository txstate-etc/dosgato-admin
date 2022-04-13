import { base } from '$app/paths'
import { GET_ROOT_PAGES, GET_TREE_PAGES, type TreePage } from './queries'

class API {
  public token: string
  public fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>
  protected savedConfig: Record<string, string>

  async query <ReturnType> (query: string, variables?: any, querySignature?: string): Promise<ReturnType> {
    const { apiBase, authRedirect } = await this.config()
    const response = await this.fetch(apiBase + '/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables,
        extensions: {
          querySignature
        }
      })
    })
    if (!response.ok) {
      if (response.status === 401) {
        return location.assign(authRedirect) as any
      }
      throw new Error(`${response.status} ${response.statusText}`)
    }
    const gqlresponse = await response.json()
    if (gqlresponse.errors?.length) throw new Error(JSON.stringify(gqlresponse.errors))
    return gqlresponse.data
  }

  async config () {
    this.savedConfig ??= await (await this.fetch(base + '/config')).json()
    return this.savedConfig
  }

  async getRootPages () {
    const { sites } = await this.query<{ sites: { pageroot: TreePage }[] }>(GET_ROOT_PAGES)
    return sites.map(s => s.pageroot)
  }

  async getSubPages (pageId: string) {
    const { pages } = await this.query<{ pages: [{ id: string, children: TreePage[] }] }>(GET_TREE_PAGES, { ids: [pageId] })
    return pages[0].children
  }
}

export const api = new API()
