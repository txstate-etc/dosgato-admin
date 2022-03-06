<script lang="ts">
  import { base } from '$app/paths'
</script>

<nav>
  <ul>
    <li><a href="{base}/auth">Users & Roles</a></li>
  </ul>
</nav>
<main>
  <slot />
</main>
