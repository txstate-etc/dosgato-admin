import { Store } from '@txstate-mws/svelte-store'
import type { FullSite, SitePagetree } from '$lib/queries'
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
  templateAuthEditing?: {
    key: string
    name: string
    pagetrees: SitePagetree[]
  }
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
  firstname: string
  lastname: string
  roles: string
  readonly: boolean
}

interface SiteTemplate {
  id: string
  key: string
  name: string
  universal: boolean
  pagetrees: string[]
  permissions: {
    assign
  }
}

const initialValue: FullSite = {
  id: '',
  name: '',
  url: { host: '', path: '', prefix: '', enabled: false },
  organization: { name: '', id: '' },
  owner: { id: '', firstname: '', lastname: '' },
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
        userRoles[user.id] ||= { firstname: user.firstname, lastname: user.lastname, roles: [] }
        userRoles[user.id].roles.push(role.name)
      }
    }
    const groups = Object.keys(groupRoles).map(k => {
      const readonly = groupRoles[k].roles.some(r => readOnlyHash[r])
      return { id: k, name: groupRoles[k].name, roles: groupRoles[k].roles.join(', '), readonly }
    })
    const users = sortby(Object.keys(userRoles).map(k => {
      const readonly = userRoles[k].roles.some(r => readOnlyHash[r])
      return { id: k, firstname: userRoles[k].firstname, lastname: userRoles[k].lastname, roles: userRoles[k].roles.join(', '), readonly }
    }), 'lastname', 'firstname')
    const sitePageTemplateKeys = site.pageTemplates.map(t => t.key)
    const pageTemplates: SiteTemplate[] = site.pageTemplates.map(t => ({ ...t, id: t.key, pagetrees: [] }))
    const pagetreePageTemplates: Record<string, SiteTemplate> = {}
    const siteComponentTemplateKeys = site.componentTemplates.map(t => t.key)
    const componentTemplates: SiteTemplate[] = site.componentTemplates.map(t => ({ ...t, id: t.key, pagetrees: [] }))
    const pagetreeComponentTemplates: Record<string, SiteTemplate> = {}

    for (const ptree of site.pagetrees) {
      for (const temp of ptree.pageTemplates) {
        if (sitePageTemplateKeys.includes(temp.key)) continue
        pagetreePageTemplates[temp.key] ||= { ...temp, id: temp.key, pagetrees: [] }
        pagetreePageTemplates[temp.key].pagetrees.push(ptree.name)
      }
      for (const temp of ptree.componentTemplates) {
        if (siteComponentTemplateKeys.includes(temp.key)) continue
        pagetreeComponentTemplates[temp.key] ||= { ...temp, id: temp.key, pagetrees: [] }
        pagetreeComponentTemplates[temp.key].pagetrees.push(ptree.name)
      }
    }
    for (const key in pagetreePageTemplates) {
      pageTemplates.push(pagetreePageTemplates[key])
    }
    for (const key in pagetreeComponentTemplates) {
      componentTemplates.push(pagetreeComponentTemplates[key])
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

  setTemplateAuthEditing (key: string, name: string, pagetrees: string[]) {
    this.update(v => {
      return set(v, 'templateAuthEditing', { key, name, pagetrees })
    })
  }

  cancelEditTemplateAuth () {
    this.update(v => {
      return set(v, 'templateAuthEditing', undefined)
    })
  }
}
