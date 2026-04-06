import type { DashboardSiteWithRoleSummary } from '$lib'
import { derivedStore, Store } from '@txstate-mws/svelte-store'

interface IDashboardSitesStore {
  sites: DashboardSiteWithRoleSummary[]
  sort: string
  filter: string
}

export class DashboardSitesStore extends Store<IDashboardSitesStore> {
  constructor () {
    super({ sites: [], sort: 'alpha-asc', filter: 'all' })
  }

  setSites (sites: DashboardSiteWithRoleSummary[]) {
    this.set({ ...this.value, sites })
  }

  reset () {
    this.set({ sites: [], sort: 'alpha-asc', filter: 'all' })
  }
}

function earliestCreationDate (site: DashboardSiteWithRoleSummary) {
  return site.pagetrees?.reduce((earliest, pagetree) => {
    const createdDate = new Date(pagetree.created)
    return createdDate < earliest ? createdDate : earliest
  }, new Date(site.pagetrees[0].created)) ?? new Date()
}

function latestModifiedDate (site: DashboardSiteWithRoleSummary) {
  let latest = new Date(0)
  site.pagetrees?.forEach(pagetree => {
    const modifiedDate = new Date(pagetree.modifiedAt)
    if (modifiedDate > latest) latest = modifiedDate
  })
  return latest
}

function sortByDate (sites: DashboardSiteWithRoleSummary[], dateFn: (site: DashboardSiteWithRoleSummary) => Date, ascending: boolean) {
  const dateMap = new Map(sites.map(site => [site.id, dateFn(site)]))
  sites.sort((a, b) => {
    const diff = dateMap.get(a.id)!.getTime() - dateMap.get(b.id)!.getTime()
    return ascending ? diff : -diff
  })
}

export const dashboardSitesStore = new DashboardSitesStore()
export const filtered = derivedStore(dashboardSitesStore, (state) => {
  const { sites, sort, filter } = state
  let filtered = [...sites]
  // filters
  if (filter !== 'all') {
    filtered = sites.filter(site => {
      if (['active', 'prelaunch', 'inactive'].includes(filter)) {
        const map = { active: 'LAUNCHED', prelaunch: 'PRELAUNCH', inactive: 'DECOMMISSIONED' }
        return site.launchState === map[filter]
      } else if (['owner', 'manager', 'editor', 'contributor', 'readonly'].includes(filter)) {
        const roleMap = { owner: 'Owner', manager: 'Manager', editor: 'Editor', contributor: 'Contributor', readonly: 'Read-only' }
        return site.roleSummary.includes(roleMap[filter])
      }
      return true
    })
  }
  // sorting
  if (sort === 'alpha-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sort === 'alpha-desc') {
    filtered.sort((a, b) => b.name.localeCompare(a.name))
  } else if (sort === 'creation-desc' || sort === 'creation-asc') {
    sortByDate(filtered, earliestCreationDate, sort === 'creation-asc')
  } else if (sort === 'last-edited-desc' || sort === 'last-edited-asc') {
    sortByDate(filtered, latestModifiedDate, sort === 'last-edited-asc')
  }
  return filtered
})
