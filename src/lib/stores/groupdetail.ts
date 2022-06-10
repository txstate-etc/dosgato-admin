import { Store } from '@txstate-mws/svelte-store'
import type { FullGroup } from '$lib/queries'

interface IGroupDetailStore {
  group: FullGroup
}

const initialValue: FullGroup = { id: '', name: '', sites: [], directMembers: [], indirectMembers: [], subgroups: [], directManagers: [], managersThroughSite: [] }

export class GroupDetailStore extends Store<IGroupDetailStore> {
  constructor (public fetchGroup: (id: string) => Promise<FullGroup>) {
    super({ group: initialValue })
  }

  async refresh (id: string) {
    const group = await this.fetchGroup(id)
    this.set({ group })
  }

  groupFetched () {
    return this.value.group.id.length > 0
  }
}
