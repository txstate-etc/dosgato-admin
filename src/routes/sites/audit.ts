import { csv, isNotNull, isNull } from 'txstate-utils'
import { LaunchState, api } from '$lib'

export async function buildAuditCSV () {
  const sites = await api.getSiteAudit()
  // need to get the maximum manager count
  let maxManagers = 0
  for (const site of sites) {
    if (site.managers.length > maxManagers) {
      maxManagers = site.managers.length
    }
  }
  const managerColumns: string[] = []
  for (let i = 0; i < maxManagers; i++) {
    const index = i + 1
    managerColumns.push(`Manager ${index}`, `Manager ${index} Email`)
  }
  const rows = [['Name', 'Title', 'URL', 'Launch State', 'Organization', 'Owner', 'Owner Email', ...managerColumns, 'Template', 'State', 'Users with Access']]
  for (const site of sites) {
    for (const pagetree of site.pagetrees) {
      const row: string[] = []
      row.push(pagetree.name)
      row.push(pagetree.rootPage.title ?? '')
      if (isNotNull(site.url)) row.push(site.url.prefix)
      else row.push('')
      const launchState = site.launchState === LaunchState.LAUNCHED ? 'Launched' : (site.launchState === LaunchState.PRELAUNCH ? 'Pre-launch' : 'Decommissioned')
      row.push(launchState)
      if (isNotNull(site.organization)) row.push(site.organization.name)
      else row.push('')
      if (isNotNull(site.owner)) row.push(site.owner.name, site.owner.email)
      else row.push('', '')
      for (let i = 0; i < maxManagers; i++) {
        if (site.managers[i]) row.push(site.managers[i].name, site.managers[i].email)
        else row.push('', '')
      }
      row.push(pagetree.rootPage.template?.name ?? '')
      if (pagetree.type === 'SANDBOX') row.push('Sandbox')
      else if (pagetree.type === 'ARCHIVE') row.push('Archive')
      else {
        if (site.launched) row.push('Live')
        else row.push('Not Launched')
      }
      // listing users with write access, looking at page rules and asset rules
      const usersWithAccess: string[] = []
      for (const role of site.roles) {
        const pageRules = role.pageRules.filter(r => r.site?.id === site.id && (isNull(r.pagetreeType) || r.pagetreeType === pagetree.type) && r.grants?.viewForEdit)
        const assetRules = role.assetRules.filter(r => r.site?.id === site.id && (isNull(r.pagetreeType) || r.pagetreeType === pagetree.type) && r.grants?.viewForEdit)
        if (pageRules.length && assetRules.length) {
          usersWithAccess.push(...role.users.map(u => `${u.name} (${u.id})`))
        }
      }
      row.push(usersWithAccess.join(', '))
      rows.push(row)
    }
  }
  return csv(rows)
}
