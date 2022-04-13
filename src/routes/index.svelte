<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import { base } from '$app/paths'

  export const load: Load = async () => {
    return {
      status: 301,
      redirect: base + '/pages'
    }
  }
</script>
