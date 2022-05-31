<!-- only need this layout if the group details will have tabs -->
<script lang="ts" context="module">
  import { subnav } from '$lib/stores/global'

  export const load = async () => {
    subnav.set([])
    return {}
  }
</script>

<slot />