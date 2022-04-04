import { base } from '$app/paths'

class API {
  public token: string
  public fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>
  protected savedConfig: Record<string, string>

  async query (query: string, variables?: any, querySignature?: string) {
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
        return location.assign(authRedirect)
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
}

export const api = new API()
