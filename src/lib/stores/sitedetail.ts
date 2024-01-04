/* eslint-disable no-trailing-spaces */
import { Store, derivedStore } from '@txstate-mws/svelte-store'
import type { FullSite, SitePagetree } from '$lib/queries'
import { isNull, sortby, set, keyby, unique } from 'txstate-utils'
import { getSiteAccess } from '$lib'

interface ISiteDetailStore {
  site: FullSite
  siteRoles: {
    specific: SiteRole[]
    universal: SiteRole[]
  }
  groups: {
    specific: SiteGroup[]
    universal: SiteGroup[]
  }
  users: {
    specific: SiteUser[]
    universal: SiteUser[]
  }
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
  access: string
  universal: boolean
}

interface SiteGroup {
  id: string
  name: string
  roles: string
  universal: boolean
}

interface SiteUser {
  id: string
  name: string
  firstname: string
  lastname: string
  roles: string
  universal: boolean
}

export interface SiteTemplate {
  id: string
  key: string
  name: string
  universal: boolean
  pagetrees: string[]
  permissions: {
    assign
  }
}

export enum LaunchState {
  PRELAUNCH = 'PRELAUNCH',
  LAUNCHED = 'LAUNCHED',
  DECOMMISSIONED = 'DECOMMISSIONED'
}

const initialValue: FullSite = {
  id: '',
  name: '',
  url: { host: '', path: '', prefix: '', enabled: LaunchState.PRELAUNCH },
  launchState: LaunchState.PRELAUNCH,
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
    super({ site: initialValue, siteRoles: { specific: [], universal: [] }, groups: { specific: [], universal: [] }, users: { specific: [], universal: [] }, pageTemplates: [], componentTemplates: [] })
  }

  async refresh (id: string) {
    const site = await this.fetchSite(id)
    const siteRoles = { specific: [] as SiteRole[], universal: [] as SiteRole[] }
    const groupRoles: Record<string, { name: string, roles: string[] }> = {}
    const userRoles = {}

    for (const role of site.roles) {
      const rules = [...role.assetRules, ...role.pageRules, ...role.dataRules, ...role.siteRules]
      const access = getSiteAccess(rules)
      if (access.length) {
        if (rules.some(r => r.site?.id === site.id)) siteRoles.specific.push({ id: role.id, name: role.name, access: access.join(', '), universal: false })
        else siteRoles.universal.push({ id: role.id, name: role.name, access: access.join(', '), universal: true })
        // groups might have roles that give them access to this site. keep track of which roles relevant groups have
        for (const group of role.groups) {
          groupRoles[group.id] ||= { name: group.name, roles: [] }
          groupRoles[group.id].roles.push(role.name)
        }
        // users might have multiple roles that give them access to this site
        for (const user of role.users) {
          userRoles[user.id] ||= { name: user.name, firstname: user.firstname, lastname: user.lastname, disabled: user.disabled, roles: [] }
          userRoles[user.id].roles.push(role.name)
        }
      }
    }
    const rolesByName = keyby([...siteRoles.specific, ...siteRoles.universal], 'name')
    const specificRoles = new Set(siteRoles.specific.map(r => r.name))
    const allGroups = Object.keys(groupRoles).map(k => {
      let access: string[] = []
      for (const role of groupRoles[k].roles) {
        access.push(...rolesByName[role].access.split(', '))
      }
      access = unique(access)
      const universal = !groupRoles[k].roles.some(r => specificRoles.has(r))
      const accessList = (access.includes('Editor') ? access.filter(a => a !== 'Limited') : access).join(', ')
      return { id: k, name: groupRoles[k].name, roles: groupRoles[k].roles.join(', '), access: accessList, universal }
    })
    const groups = {
      specific: allGroups.filter(u => !u.universal),
      universal: allGroups.filter(u => u.universal)
    }
    const allUsers = sortby(Object.keys(userRoles).map(k => {
      let access: string[] = []
      for (const role of userRoles[k].roles) {
        access.push(...rolesByName[role].access.split(', '))
      }
      access = unique(access)
      const universal = !userRoles[k].roles.some(r => specificRoles.has(r))
      const accessList = (access.includes('Editor') ? access.filter(a => a !== 'Limited') : access).join(', ')
      return { id: k, firstname: userRoles[k].firstname, lastname: userRoles[k].lastname, name: userRoles[k].name, disabled: userRoles[k].disabled, roles: userRoles[k].roles.join(', '), access: accessList, universal }
    }), 'lastname', 'firstname')
    const users = {
      specific: allUsers.filter(u => !u.universal),
      universal: allUsers.filter(u => u.universal)
    }

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
    this.set({ site, siteRoles: { specific: sortby(siteRoles.specific, 'name'), universal: sortby(siteRoles.universal, 'name') }, groups, users, pageTemplates: sortby(pageTemplates, 'universal', 'name'), componentTemplates: sortby(componentTemplates, 'universal', 'name') })

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
