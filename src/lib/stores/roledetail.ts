import { Store } from '@txstate-mws/svelte-store'
import type { FullRole } from '$lib/queries'
import { set } from 'txstate-utils'

interface IRoleDetailStore {
  role: FullRole
  editing?: {
    id: string
    type: 'asset' | 'data' | 'global' | 'page' | 'site' | 'template'
    data: any
  }
  userRemoving?: {
    id: string
    name: string
  }
  groupRemoving?: {
    id: string
    name: string
  }
}

const initialValue: FullRole = {
  id: '',
  name: '',
  directUsers: [],
  usersThroughGroups: [],
  permissions: { delete: false, createRules: false, rename: false, assign: false },
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
    if (id !== this.value.role.id) this.set({ role: initialValue })
    const role = await this.fetchRole(id)
    this.set({ role })
  }

  roleFetched () {
    return this.value.role.id.length > 0
  }

  setRuleEditing (id: string, type: 'asset' | 'data' | 'global' | 'page' | 'site' | 'template', rule?: any) {
    this.update(v => {
      return set(v, 'editing', { id, type, data: rule })
    })
  }

  resetRuleEditing () {
    this.update(v => {
      return set(v, 'editing', undefined)
    })
  }

  setUserRemoving (id: string, name: string) {
    this.update(v => {
      return set(v, 'userRemoving', { id, name })
    })
  }

  resetUserRemoving () {
    this.update(v => {
      return set(v, 'userRemoving', undefined)
    })
  }

  setGroupRemoving (id: string, name: string) {
    this.update(v => {
      return set(v, 'groupRemoving', { id, name })
    })
  }

  resetGroupRemoving () {
    this.update(v => {
      return set(v, 'groupRemoving', undefined)
    })
  }
}
