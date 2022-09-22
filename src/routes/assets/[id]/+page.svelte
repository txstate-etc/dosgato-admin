<script lang="ts">
  import { bytesToHuman } from '@dosgato/dialog'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import uploadLight from '@iconify-icons/ph/upload-light'
  import { DetailList, DetailPanel, environmentConfig, UploadUI } from '$lib'
  import { getAssetDetail, type AssetDetail } from './+page'

  export let data: { asset: AssetDetail }
  $: asset = data.asset
  $: image = asset.box

  let modal: 'edit' | 'upload' | undefined
  function onEditClick () {
    modal = 'edit'
  }

  function onUploadClick () {
    modal = 'upload'
  }
  async function onUploadSaved () {
    modal = undefined
    asset = await getAssetDetail(asset.id)
  }
  function onUploadEscape () {
    modal = undefined
  }

  setInterval(async () => {
    asset = await getAssetDetail(asset.id)
  }, 20000)
</script>

<div class="container">
  <div class:hasimage={image}>
    <DetailPanel header={asset.filename} button={[
      { icon: uploadLight, hiddenLabel: 'upload new file for asset', onClick: onUploadClick },
      { icon: pencilIcon, hiddenLabel: 'edit asset details', onClick: onEditClick }
    ]}>
      <DetailList records={{
        Size: bytesToHuman(asset.size),
        Type: asset.mime
      }} />
    </DetailPanel>
    {#if asset.resizes.length}
      <DetailPanel header='Resizes'>
        {#each asset.resizes as resize}
          <img src="{environmentConfig.apiBase}/resize/{resize.id}/{asset.name}_{resize.width}.{resize.extension}" width={resize.width} height={resize.height} alt="">
        {/each}
      </DetailPanel>
    {/if}
  </div>
  {#if image}
    <div class="image">
      <img src="{environmentConfig.apiBase}/assets/{asset.id}/w/500/{asset.checksum}/{asset.name}" width={image.width} height={image.height} alt="">
      <div class="details">
        {image.width}x{image.height}
      </div>
    </div>
  {/if}
</div>
{#if modal === 'upload'}
  <UploadUI title="Upload new file for {asset.path}" uploadPath="{environmentConfig.apiBase}/assets/replace/{asset.id}" maxFiles={1} on:escape={onUploadEscape} on:saved={onUploadSaved} />
{/if}

<style>
  .container {
    display: flex;
  }
  .container > div {
    width: 100%;
  }
  .container > .hasimage {
    display: inline-block;
    width: 70%;
  }
  .container > .image {
    display: inline-block;
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
