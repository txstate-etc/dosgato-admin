<script lang="ts">
  import { TemplatesListPage } from '$lib'
  import { _store as store } from './+page.js'
  import { templateFilterStore } from '../templateFilterStore'
</script>

<TemplatesListPage type="page" {store} filter={$templateFilterStore.search} />
