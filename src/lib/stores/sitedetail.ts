import { Store } from '@txstate-mws/svelte-store'
import type { FullSite } from '$lib/queries'
import { isNull, sortby, set } from 'txstate-utils'

interface ISiteDetailStore {
  site: FullSite
  globalRoles: SiteRole[] // roles that affect all sites, not just this specific site
  siteRoles: SiteRole[]
  groups: SiteGroup[]
  users: SiteUser[]
  editingPagetree?: {
    id: string
    name: string
  }
  pageTemplates: SiteTemplate[]
  componentTemplates: SiteTemplate[]
}

interface SiteRole {
  id: string
  name: string
  readonly: boolean
}

interface SiteGroup {
  id: string
  name: string
  roles: string
  readonly: boolean
}

interface SiteUser {
  id: string
  name: string
  roles: string
  readonly: boolean
}

interface SiteTemplate {
  id: string
  key: string
  name: string
  universal: boolean
  pagetrees: string[]
}

const initialValue: FullSite = {
  id: '',
  name: '',
  url: { host: '', path: '', prefix: '', enabled: false },
  organization: { name: '', id: '' },
  owner: { id: '', name: '' },
  managers: [],
  pagetrees: [],
  pageTemplates: [],
  componentTemplates: [],
  comments: [],
  roles: [],
  permissions: { rename: false, launch: false, manageGovernance: false, delete: false, undelete: false, manageState: false }
}

export class SiteDetailStore extends Store<ISiteDetailStore> {
  constructor (public fetchSite: (id: string) => Promise<FullSite>) {
    super({ site: initialValue, globalRoles: [], siteRoles: [], groups: [], users: [], pageTemplates: [], componentTemplates: [] })
  }

  async refresh (id: string) {
    const site = await this.fetchSite(id)
    const globalRoles: SiteRole[] = []
    const siteRoles: SiteRole[] = []
    const groupRoles = {}
    const userRoles = {}
    const readOnlyHash: Record<string, boolean> = {}
    for (const role of site.roles) {
      const hasGlobalRule =
        role.assetRules.some(r => isNull(r.site)) ||
        role.dataRules.some(r => isNull(r.site)) ||
        role.pageRules.some(r => isNull(r.site)) ||
        role.siteRules.some(r => isNull(r.site))
      const canWrite =
        role.assetRules.some(r => r.grants.viewForEdit) ||
        role.dataRules.some(r => r.grants.viewForEdit) ||
        role.pageRules.some(r => r.grants.viewForEdit) ||
        role.siteRules.some(r => r.grants.viewForEdit)
      readOnlyHash[role.name] = !canWrite
      if (hasGlobalRule) globalRoles.push({ id: role.id, name: role.name, readonly: !canWrite })
      else siteRoles.push({ id: role.id, name: role.name, readonly: !canWrite })
      for (const group of role.groups) {
        groupRoles[group.id] ||= { name: group.name, roles: [] }
        groupRoles[group.id].roles.push(role.name)
      }
      for (const user of role.users) {
        userRoles[user.id] ||= { name: user.name, roles: [] }
        userRoles[user.id].roles.push(role.name)
      }
    }
    const groups = Object.keys(groupRoles).map(k => {
      const readonly = groupRoles[k].roles.some(r => readOnlyHash[r])
      return { id: k, name: groupRoles[k].name, roles: groupRoles[k].roles.join(', '), readonly }
    })
    const users = Object.keys(userRoles).map(k => {
      const readonly = userRoles[k].roles.some(r => readOnlyHash[r])
      return { id: k, name: userRoles[k].name, roles: userRoles[k].roles.join(', '), readonly }
    })
    const sitePageTemplateKeys = site.pageTemplates.map(t => t.key)
    const pageTemplates: SiteTemplate[] = site.pageTemplates.map(t => ({ id: t.key, key: t.key, name: t.name, universal: t.universal, pagetrees: ['All pagetrees'] }))
    const pagetreePageTemplates: Record<string, { name: string, universal: boolean, pagetrees: string[] }> = {}
    const siteComponentTemplateKeys = site.componentTemplates.map(t => t.key)
    const componentTemplates: SiteTemplate[] = site.componentTemplates.map(t => ({ id: t.key, key: t.key, name: t.name, universal: t.universal, pagetrees: ['All pagetrees'] }))
    const pagetreeComponentTemplates: Record<string, { name: string, universal: boolean, pagetrees: string[] }> = {}

    for (const ptree of site.pagetrees) {
      for (const temp of ptree.pageTemplates) {
        if (sitePageTemplateKeys.includes(temp.key)) continue
        pagetreePageTemplates[temp.key] ||= { name: temp.name, universal: temp.universal, pagetrees: [] }
        pagetreePageTemplates[temp.key].pagetrees.push(ptree.name)
      }
      for (const temp of ptree.componentTemplates) {
        if (siteComponentTemplateKeys.includes(temp.key)) continue
        pagetreeComponentTemplates[temp.key] ||= { name: temp.name, universal: temp.universal, pagetrees: [] }
        pagetreeComponentTemplates[temp.key].pagetrees.push(ptree.name)
      }
    }
    for (const key in pagetreePageTemplates) {
      pageTemplates.push({ id: key, key, name: pagetreePageTemplates[key].name, universal: pagetreePageTemplates[key].universal, pagetrees: pagetreePageTemplates[key].pagetrees })
    }
    for (const key in pagetreeComponentTemplates) {
      componentTemplates.push({ id: key, key, name: pagetreeComponentTemplates[key].name, universal: pagetreeComponentTemplates[key].universal, pagetrees: pagetreeComponentTemplates[key].pagetrees })
    }
    this.set({ site, globalRoles: sortby(globalRoles, 'name'), siteRoles: sortby(siteRoles, 'name'), groups, users, pageTemplates: sortby(pageTemplates, 'universal', 'name'), componentTemplates: sortby(componentTemplates, 'universal', 'name') })

    return site // TODO: Is there a better way to get the site name in the site detail page load function?
  }

  siteFetched () {
    return this.value.site.id.length > 0
  }

  setPagetreeEditing (id: string, name: string) {
    this.update(v => {
      return set(v, 'editingPagetree', { id, name })
    })
  }

  cancelEditPagetree () {
    this.update(v => {
      return set(v, 'editingPagetree', undefined)
    })
  }
}
