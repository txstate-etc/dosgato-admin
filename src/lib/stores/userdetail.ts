import { Store } from '@txstate-mws/svelte-store'
import type { FullUser } from '$lib/queries'


interface IUserDetailStore {
  user: FullUser
  sites: Record<string, string[]>
}

const initialValue: FullUser = { id: '', name: '', email: '', disabled: false, directGroups: [], indirectGroups: [], directRoles: [], indirectRoles: [], sitesOwned: [], sitesManaged: [] }

export class UserDetailStore extends Store<IUserDetailStore> {
  constructor (public fetchUser: (id: string) => Promise<FullUser>) {
    super({ user: initialValue, sites: {} })
  }

  async refresh (id: string) {
    const user = await this.fetchUser(id)
    const sites = {}
    for (const site of user.sitesOwned) {
      sites[site.name] = ['owner']
    }
    for (const site of user.sitesManaged) {
      sites[site.name] = sites[site.name] ? [...sites[site.name], 'manager'] : ['manager']
    }
    // TODO: Look at roles to figure out what they can do with other sites
    this.set({ user, sites })
  }

  userFetched () {
    return this.value.user.id.length > 0
  }
}

