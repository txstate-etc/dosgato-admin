<script lang="ts" context="module">
  import { base } from '$app/paths'
  import { subnav } from '$lib/stores/global'

  subnav.set([
    { label: 'Template Management', href: base + '/settings/templates' }
  ])
</script>

<slot />