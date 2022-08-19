import type { PageLoad } from './$types'
import { api, systemUserListStore } from '$lib'

export const load: PageLoad = async () => {
  const users = await api.getUserList({ system: true })
  systemUserListStore.update(v => ({ ...v, users }))
  return {}
}
