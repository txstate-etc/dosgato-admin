import { resolve } from '$app/paths'
import { subNavSize, subnavStore } from '$lib'
import accountIcon from '@iconify-icons/mdi/account'
import accountWrenchIcon from '@iconify-icons/mdi/account-wrench'
import accountGroup from '@iconify-icons/mdi/account-group'
import keyChain from '@iconify-icons/mdi/key-chain'
import { get } from 'svelte/store'

export const load = async () => {
  subnavStore.init('auth', [
    { label: 'Users', href: resolve('/auth/users'), icon: accountIcon },
    { label: 'System', href: resolve('/auth/system'), icon: accountWrenchIcon },
    { label: 'Groups', href: resolve('/auth/groups'), icon: accountGroup },
    { label: 'Roles', href: resolve('/auth/roles'), icon: keyChain }
  ])
  const size = get(subNavSize)
  subnavStore.setMaxItems(Math.floor((size.clientWidth ?? 800) / 140))
}
