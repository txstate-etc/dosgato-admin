import accountIcon from '@iconify-icons/mdi/account'
import accountCancel from '@iconify-icons/mdi/account-cancel'
import accountCheck from '@iconify-icons/mdi/account-check'
import type { PageLoad } from './$types'
import { api, userListStore } from '$lib'

export const load: PageLoad = async () => {
  const users = await api.getUserList({ system: false })
  userListStore.update(v => ({ ...v, users }))
  return {}
}
