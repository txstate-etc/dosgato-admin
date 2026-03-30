import type { DashboardSiteWithRoleSummary } from '$lib'

export const load = async () => {
  return { sites: [] as DashboardSiteWithRoleSummary[] }
}
