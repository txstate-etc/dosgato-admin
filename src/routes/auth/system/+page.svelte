<script lang="ts" context="module">
  import accountIcon from '@iconify-icons/mdi/account'
  import accountCancel from '@iconify-icons/mdi/account-cancel'
  import accountCheck from '@iconify-icons/mdi/account-check'
  import accountOff from '@iconify-icons/mdi/account-off'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { sortby } from 'txstate-utils'
  import { ActionPanel, type ActionPanelAction, api, Tree, TreeStore, type TypedTreeItem, type UserListUser } from '$lib'

  type TypedUserItem = TypedTreeItem<UserListUser>

  async function fetchChildren (user?: TypedUserItem) {
    if (user) return []
    return await api.getUserList({ system: true })
  }

  // TODO: Move this shared code to a shared file
  function renderRoles (user: TypedUserItem) {
    return sortby(user.roles.map(r => r.name), n => ['editor', 'superuser'].includes(n), n => n).slice(0, 3).join(', ') + (
      user.roles.length > 3 ? `, and ${user.roles.length - 3} more` : ''
    )
  }

  const store: TreeStore<UserListUser> = new TreeStore(fetchChildren)
</script>

<ActionPanel actions={[]}>
  <Tree singleSelect {store} on:choose={({ detail }) => goto(base + '/auth/users/' + detail.id)} headers={[
    { id: 'username', label: 'Username', get: 'id', defaultWidth: '25%', icon: u => u.disabled ? accountOff : accountIcon },
    { id: 'fullname', label: 'Account Name', get: 'name', defaultWidth: '25%' },
    { id: 'roles', label: 'Roles', render: renderRoles, defaultWidth: 'calc(50% - 1.3em)' }
  ]}/>
</ActionPanel>