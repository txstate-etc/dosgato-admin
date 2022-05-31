<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'

  export const load: Load = async ({ params }) => {
    // get group by ID
    return {}
  }

</script>

<script lang="ts">
  import { base } from '$app/paths'
</script>

<a href={`${base}/auth/groups/`}>
  Back to Group List
</a>
<div>
  Details about a particular group: members, roles, subgroups. Tab for each?
</div>