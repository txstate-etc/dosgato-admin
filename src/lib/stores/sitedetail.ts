/* eslint-disable no-trailing-spaces */
import { Store } from '@txstate-mws/svelte-store'
import type { FullSite, SitePagetree } from '$lib/queries'
import { isNull, sortby, set, keyby } from 'txstate-utils'

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
  access: 'Editor' | 'Limited' | 'Other'
  readonly: boolean
  universal: boolean
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
    // This keeps track of which roles do not allow editing
    const readOnlyHash: Record<string, boolean> = {}
    // loop through the roles that have any permission on this site. Don't need the data rules.
    for (const role of site.roles) {
      let access: 'Editor' | 'Limited' | 'Other' = 'Limited'
      if (role.assetRules.length === 0 && role.pageRules.length === 0) {
        access = 'Other'
      } else {
        // To be editor, the role needs to have rules that give them everything but undelete on
        // pages and assets (but having undelete is ok) with no path specified, for primary and sandbox pagetrees
        const primaryPageGrants = { create: false, delete: false, move: false, publish: false, unpublish: false, update: false }
        const sandboxPageGrants = { ...primaryPageGrants }
        for (const pageRule of role.pageRules) {
          if (pageRule.path !== '/') continue
          if (isNull(pageRule.pagetreeType) || pageRule.pagetreeType === 'PRIMARY') {
            primaryPageGrants.create ||= pageRule.grants.create
            primaryPageGrants.delete ||= pageRule.grants.delete
            primaryPageGrants.move ||= pageRule.grants.move
            primaryPageGrants.publish ||= pageRule.grants.publish
            primaryPageGrants.unpublish ||= pageRule.grants.unpublish
            primaryPageGrants.update ||= pageRule.grants.update
          }
          if (isNull(pageRule.pagetreeType) || pageRule.pagetreeType === 'SANDBOX') {
            sandboxPageGrants.create ||= pageRule.grants.create
            sandboxPageGrants.delete ||= pageRule.grants.delete
            sandboxPageGrants.move ||= pageRule.grants.move
            sandboxPageGrants.publish ||= pageRule.grants.publish
            sandboxPageGrants.unpublish ||= pageRule.grants.unpublish
            sandboxPageGrants.update ||= pageRule.grants.update
          }
        }
        const primaryPageEditor = primaryPageGrants.create && primaryPageGrants.delete && primaryPageGrants.move && primaryPageGrants.publish && primaryPageGrants.unpublish && primaryPageGrants.update
        const sandboxPageEditor = sandboxPageGrants.create && sandboxPageGrants.delete && sandboxPageGrants.move && sandboxPageGrants.publish && sandboxPageGrants.unpublish && sandboxPageGrants.update
        if (primaryPageEditor && sandboxPageEditor) {
          const primaryAssetGrants = { create: false, delete: false, move: false, update: false }
          const sandboxAssetGrants = { ...primaryAssetGrants }
          for (const assetRule of role.assetRules) {
            if (assetRule.path !== '/') continue
            if (isNull(assetRule.pagetreeType) || assetRule.pagetreeType === 'PRIMARY') {
              primaryAssetGrants.create ||= assetRule.grants.create
              primaryAssetGrants.delete ||= assetRule.grants.delete
              primaryAssetGrants.move ||= assetRule.grants.move
              primaryAssetGrants.update ||= assetRule.grants.update
            }
            if (isNull(assetRule.pagetreeType) || assetRule.pagetreeType === 'SANDBOX') {
              sandboxAssetGrants.create ||= assetRule.grants.create
              sandboxAssetGrants.delete ||= assetRule.grants.delete
              sandboxAssetGrants.move ||= assetRule.grants.move
              sandboxAssetGrants.update ||= assetRule.grants.update
            }
          }
          const primaryAssetEditor = primaryAssetGrants.create && primaryAssetGrants.delete && primaryAssetGrants.move && primaryAssetGrants.update
          const sandboxAssetEditor = sandboxAssetGrants.create && sandboxAssetGrants.delete && sandboxAssetGrants.move && sandboxAssetGrants.update
          if (primaryAssetEditor && sandboxAssetEditor) access = 'Editor'
        }
      }

      // has some rule that does not specify a particular site
      const hasGlobalRule =
        role.assetRules.some(r => isNull(r.site)) ||
        role.dataRules.some(r => isNull(r.site)) ||
        role.pageRules.some(r => isNull(r.site)) ||
        role.siteRules.some(r => isNull(r.site))
      // has some rule that allows them to edit the site
      const canWrite = role.assetRules.some(r => r.grants.viewForEdit) || role.pageRules.some(r => r.grants.viewForEdit)
      readOnlyHash[role.name] = !canWrite
      // global roles have a checkmark in the universal column, site roles do not
      if (hasGlobalRule) globalRoles.push({ id: role.id, name: role.name, access, readonly: !canWrite, universal: true })
      else siteRoles.push({ id: role.id, name: role.name, access, readonly: !canWrite, universal: false })
      // groups might have roles that give them access to this site. keep track of which roles relevant groups have
      for (const group of role.groups) {
        groupRoles[group.id] ||= { name: group.name, roles: [] }
        groupRoles[group.id].roles.push(role.name)
      }
      // users might have multiple roles that give them access to this site
      for (const user of role.users) {
        userRoles[user.id] ||= { firstname: user.firstname, lastname: user.lastname, roles: [] }
        userRoles[user.id].roles.push(role.name)
      }
    }
    const roleByName = keyby([...globalRoles, ...siteRoles], 'name')
    const groups = Object.keys(groupRoles).map(k => {
      const readonly = groupRoles[k].roles.every(r => readOnlyHash[r])
      let access = 'Limited'
      for (const role of groupRoles[k].roles) {
        if (roleByName[role].access === 'Other') access = 'Other'
        if (roleByName[role].access === 'Editor') {
          access = 'Editor'
          break
        }
      }
      return { id: k, name: groupRoles[k].name, roles: groupRoles[k].roles.join(', '), readonly, access }
    })
    const users = sortby(Object.keys(userRoles).map(k => {
      const readonly = userRoles[k].roles.every(r => readOnlyHash[r])
      let access = 'Limited'
      for (const role of userRoles[k].roles) {
        if (roleByName[role].access === 'Other') access = 'Other'
        if (roleByName[role].access === 'Editor') {
          access = 'Editor'
          break
        }
      }
      return { id: k, firstname: userRoles[k].firstname, lastname: userRoles[k].lastname, roles: userRoles[k].roles.join(', '), readonly, access }
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
