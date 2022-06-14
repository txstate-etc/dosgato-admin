import { Store } from '@txstate-mws/svelte-store'
import type { FullRole } from '$lib/queries'

interface IRoleDetailStore {
  role: FullRole
}

const initialValue: FullRole = {
  id: '',
  name: '',
  directUsers: [],
  usersThroughGroups: [],
  permissions: { delete: false, createRules: false, rename: false },
  directGroups: [],
  indirectGroups: [],
  assetRules: [],
  dataRules: [],
  globalRules: [],
  pageRules: [],
  siteRules: [],
  templateRules: []
}

export class RoleDetailStore extends Store<IRoleDetailStore> {
  constructor (public fetchRole: (id: string) => Promise<FullRole>) {
    super({ role: initialValue })
  }

  async refresh (id: string) {
    const role = await this.fetchRole(id)
    this.set({ role })
  }

  roleFetched () {
    return this.value.role.id.length > 0
  }
}
