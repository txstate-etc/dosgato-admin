import { base } from '$app/paths'
import { subnavStore } from '$lib'
import accountIcon from '@iconify-icons/mdi/account'
import accountWrenchIcon from '@iconify-icons/mdi/account-wrench'
import accountGroup from '@iconify-icons/mdi/account-group'
import keyChain from '@iconify-icons/mdi/key-chain'

function getTabLabel (type: 'users' | 'system' | 'groups' | 'roles') {
  return type.toLocaleUpperCase()
}

function getTabIcon (type: 'users' | 'system' | 'groups' | 'roles') {
  if (type === 'users') return accountIcon
  else if (type === 'system') return accountWrenchIcon
  else if (type === 'groups') return accountGroup
  else if (type === 'roles') return keyChain
}

export function updateAuthSubnav (type: 'users' | 'system' | 'groups' | 'roles') {
  subnavStore.open('auth', { href: `${base}/auth/${type}`, label: getTabLabel(type), icon: getTabIcon(type) })
}
