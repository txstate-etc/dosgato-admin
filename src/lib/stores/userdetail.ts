import { Store } from '@txstate-mws/svelte-store'
import type { FullUser } from '$lib/queries'


interface IUserDetailStore {
  user: FullUser
}

const initialValue: FullUser = { id: '', name: '', email: '', disabled: false, directGroups: [], indirectGroups: [], directRoles: [], indirectRoles: [] }

export class UserDetailStore extends Store<IUserDetailStore> {
  constructor (public fetchUser: (id: string) => Promise<FullUser>) {
    super({ user: initialValue })
  }

  async refresh (id: string) {
    const user = await this.fetchUser(id)
    this.set({ user })
  }

  userFetched () {
    return this.value.user.id.length > 0
  }
}

