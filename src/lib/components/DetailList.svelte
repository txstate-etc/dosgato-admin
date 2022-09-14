<script lang="ts">
  import { isNotBlank, sortby } from 'txstate-utils'

  export let records: Record<string, string>
  $: entries = sortby(Object.entries(records).filter(([k, v]) => isNotBlank(v)), '0')
</script>

<dl>
  {#each entries as [key, value](key)}
    <dt>{key}</dt>
    <dd>{value}</dd>
  {/each}
</dl>

<style>
  dl {
    display: flex;
    flex-wrap: wrap;
    margin: 0;
  }
  dt, dd {
    display: block;
  }
  dt {
    font-weight: bold;
    text-align: right;
    padding-right: 1em;
    width: 20%
  }
  dd {
    margin: 0;
    width: 30%
  }
  :global([data-eq~="500px"]) dt {
    width: 30%
  }
  :global([data-eq~="500px"]) dd {
    width: 70%
  }
</style>
