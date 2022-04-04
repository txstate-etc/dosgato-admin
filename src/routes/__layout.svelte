<script lang="ts" context="module">
  import type { LoadInput } from '@sveltejs/kit/types/internal'
  import { base } from '$app/paths'
  import { api } from '$lib'
  import { getToken } from '../local'
  export async function load (input: LoadInput) {
    api.fetch = input.fetch
    api.token = getToken(input)
    if (typeof sessionStorage !== 'undefined') {
      if (api.token) {
        sessionStorage.setItem('token', api.token)
      } else {
        api.token = sessionStorage.getItem('token')
      }
    }
    const me = await api.query('query getSelf { users (filter:{ ids: ["self"] }) { name } }')
    return { props: { me: me.users[0] } }
  }
</script>
<script lang="ts">

</script>

<nav>
  <ul>
    <li><a href="{base}/auth">Users & Roles</a></li>
    <li>blah!</li>
  </ul>
</nav>
<main>
  <slot />
</main>
