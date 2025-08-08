<script lang="ts">
  import UserListPage from '$lib/components/UserListPage.svelte'

  export let data: { allTrainings: { id: string, name: string, lcName: string }[] }
  import { _userFilterStore as userFilterStore } from './+page'
</script>

<UserListPage system={false} trainings={data.allTrainings} filter={$userFilterStore.search} />
