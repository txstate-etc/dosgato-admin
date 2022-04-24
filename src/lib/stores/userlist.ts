import type { UserListUser } from '$lib/queries'
import { Store } from '@txstate-mws/svelte-store'

interface IUserListStore {
  users: UserListUser[]
}

class UserListStore extends Store<IUserListStore> {
  constructor () {
    super({ users: [] })
  }
}

export const userListStore = new UserListStore()
