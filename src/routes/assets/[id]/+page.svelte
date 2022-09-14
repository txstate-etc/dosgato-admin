<script lang="ts">
  import { DetailList, DetailPanel, environmentConfig } from '$lib'
  import { bytesToHuman } from '@dosgato/dialog'
  import type { AssetDetail } from './+page'

  export let data: { asset: AssetDetail }
  $: asset = data.asset
  $: image = asset.box
</script>

<div class:hasimage={image}>
  <DetailPanel header={asset.filename}>
    <DetailList records={{
      Size: bytesToHuman(asset.size),
      Type: asset.mime
    }} />
  </DetailPanel>
  {#if image}
    <div class="image">
      <img src="{environmentConfig.apiBase}/assets/{asset.id}/{asset.filename}" width={image.width} height={image.height} alt="">
      <div class="details">
        {image.width}x{image.height}
      </div>
    </div>
  {/if}
  <DetailPanel header='Resizes'>
    {#each asset.resizes as resize}
      <img src="{environmentConfig.apiBase}/resize/{resize.id}/{asset.name}_{resize.width}.{resize.extension}" width={resize.width} height={resize.height} alt="">
    {/each}
  </DetailPanel>
</div>

<style>
  .hasimage {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  .hasimage :global(.panel) {
    width: 70%;
  }
  .image {
    width: 30%;
    padding: 0 1em;
  }
  .image img {
    display: block;
    width: 100%;
    height: auto;
  }
  .details {
    text-align: center;
  }
</style>
