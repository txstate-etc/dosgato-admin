import { Store } from '@txstate-mws/svelte-store'
import type { FullRole } from '$lib/queries'
import { set } from 'txstate-utils'

interface IRoleDetailStore {
  role: FullRole
  editing?: {
    id: string
    type: 'asset' | 'data' | 'global' | 'page' | 'site' | 'template'
  }
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

  setRuleEditing (id: string, type: 'asset' | 'data' | 'global' | 'page' | 'site' | 'template') {
    this.update(v => {
      return set(v, 'editing', { id, type })
    })
  }

  resetRuleEditing () {
    this.update(v => {
      return set(v, 'editing', undefined)
    })
  }
}
