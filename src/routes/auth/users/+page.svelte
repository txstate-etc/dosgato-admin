<script lang="ts">
  import UserListPage from '$lib/components/UserListPage.svelte'

  export let data: { allTrainings: { id: string, name: string, lcName: string }[] }
</script>

<UserListPage system={false} trainings={data.allTrainings} />
