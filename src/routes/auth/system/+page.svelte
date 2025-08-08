<script>
  import UserListPage from '$lib/components/UserListPage.svelte'
  import { _userFilterStore as userFilterStore } from './+page'
</script>

<UserListPage system={true} filter={$userFilterStore.search}/>
