import { base } from '$app/paths'
import { subnav } from '$lib/stores/global'
import accountIcon from '@iconify-icons/mdi/account'
import accountWrenchIcon from '@iconify-icons/mdi/account-wrench'
import accountGroup from '@iconify-icons/mdi/account-group'
import keyChain from '@iconify-icons/mdi/key-chain'

export const load = async ({ params }) => {
  subnav.set(params.id
    ? []
    : [
        { label: 'Users', href: base + '/auth/users', icon: accountIcon },
        { label: 'System', href: base + '/auth/system', icon: accountWrenchIcon },
        { label: 'Groups', href: base + '/auth/groups', icon: accountGroup },
        { label: 'Roles', href: base + '/auth/roles', icon: keyChain }
      ])
}
