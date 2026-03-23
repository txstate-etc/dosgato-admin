import type { DashboardSiteWithRoleSummary } from '$lib'
import { derivedStore, Store } from '@txstate-mws/svelte-store'

interface IDashboardSitesStore {
  sites: DashboardSiteWithRoleSummary[]
  sort: string
  filter: string
}

export class DashboardSitesStore extends Store<IDashboardSitesStore> {
  constructor () {
    super({ sites: [], sort: 'alpha', filter: 'all' })
  }

  setSites (sites: DashboardSiteWithRoleSummary[]) {
    this.set({ ...this.value, sites })
  }

  reset () {
    this.set({ sites: [], sort: 'alpha', filter: 'all' })
  }
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
  if (sort === 'alpha') {
    filtered.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sort === 'status') {
    const statusOrder = { LAUNCHED: 1, PRELAUNCH: 2, DECOMMISSIONED: 3 }
    filtered.sort((a, b) => statusOrder[a.launchState] - statusOrder[b.launchState])
  } else if (sort === 'date-added') {
    // calculate the earliest pagetree creation date for each site and sort by that
    const siteDateMap = filtered.reduce<Record<string, Date>>((acc, site) => {
      const earliestDate = site.pagetrees?.reduce((earliest, pagetree) => {
        const createdDate = new Date(pagetree.created)
        return createdDate < earliest ? createdDate : earliest
      }, new Date(site.pagetrees[0].created)) ?? new Date()
      acc[site.id] = earliestDate
      return acc
    }, {})
    filtered.sort((a, b) => siteDateMap[a.id].getTime() - siteDateMap[b.id].getTime())
  } else if (sort === 'last-edited') {
    // for each pagetree in each site, find the most recent modifiedAt date, then sort sites by that date
    const siteDateMap = filtered.reduce<Record<string, Date>>((acc, site) => {
      let latestDate = new Date(0)
      site.pagetrees?.forEach(pagetree => {
        pagetree.pages.forEach(page => {
          const modifiedDate = new Date(page.modifiedAt)
          if (modifiedDate > latestDate) {
            latestDate = modifiedDate
          }
        })
      })
      acc[site.id] = latestDate
      return acc
    }, {})
    filtered.sort((a, b) => siteDateMap[b.id].getTime() - siteDateMap[a.id].getTime())
  }
  return filtered
})
