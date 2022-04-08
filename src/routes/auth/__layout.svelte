<script lang="ts" context="module">
  import { base } from '$app/paths'
  import { subnav } from '$lib/stores/global'
  import accountIcon from '@iconify-icons/mdi/account'
  import accountGroup from '@iconify-icons/mdi/account-group'
  import keyChain from '@iconify-icons/mdi/key-chain'

  export const load = async () => {
    subnav.set([
      { label: 'Users', href: base + '/auth/users', icon: accountIcon },
      { label: 'Groups', href: base + '/auth/groups', icon: accountGroup },
      { label: 'Roles', href: base + '/auth/roles', icon: keyChain }
    ])
    return {}
  }
</script>

<slot />
