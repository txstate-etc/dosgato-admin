<script lang="ts">
  import { isNotBlank } from 'txstate-utils'

  export let records: Record<string, string | undefined | null>
  $: entries = Object.entries(records).filter(([k, v]) => isNotBlank(v))
</script>

<dl>
  {#each entries as [key, value], index (key)}

    <span class="{(index === entries.length - 1 && entries.length % 2 === 1) ? 'last' : ''}">
      <dt>{key}:</dt><dd>{value}</dd>
    </span>
  {/each}
</dl>

<style>
  dl {
    display: flex;
    flex-wrap: wrap;
    margin: 0;
  }
  dl span {
    padding: 0.5em 0;
    border-bottom: 1px dashed #707070;
    width: 50%;
  }
  dl span.last {
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
  :global([data-eq~="500px"]) span {
    width: 100%
  }
</style>
