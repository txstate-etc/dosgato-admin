<script lang="ts">
  import { isNotBlank } from 'txstate-utils'

  export let records: Record<string, string | undefined | null>
  export let columns: number = 2
  $: entries = Object.entries(records).filter(([k, v]) => isNotBlank(v))
</script>

<dl>
  {#each entries as [key, value], index (key)}
    <div class="{(index === entries.length - 1 && entries.length % 2 === 1) ? 'last' : ''}" style="width: {100 / columns}%">
      <dt>{key}:</dt><dd>{value}</dd>
    </div>
  {/each}
</dl>

<style>
  dl {
    display: flex;
    flex-wrap: wrap;
    margin: 0;
  }
  dl div {
    padding: 0.5em 0;
    border-bottom: 1px dashed #707070;
  }
  dl div.last {
    flex-grow: 1;
  }
  dt, dd {
    display: inline;
  }
  dt {
    font-weight: bold;
    padding-right: 0.5em;
  }
  dd {
    margin: 0;
  }
  :global([data-eq~="500px"]) div {
    width: 100% !important
  }
</style>
