<script lang="ts">
  import { bytesToHuman } from '@dosgato/dialog'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import uploadIcon from '@iconify-icons/ph/upload'
  import { DetailList, DetailPanel, environmentConfig, UploadUI, StyledList, dateStamp } from '$lib'
  import { getAssetDetail, type AssetDetail } from './helpers'

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
    watchForResizes()
  }
  function onUploadEscape () {
    modal = undefined
  }

  let timer
  let refreshes = 0
  function watchForResizes () {
    clearTimeout(timer)
    refreshes = 1
    if (!image) return
    timer = setTimeout(async () => {
      if (image && refreshes++ < 12 && asset.resizes.length < Math.floor(Math.log2(image.width) - Math.log2(100) + 1) * 2) {
        asset = await getAssetDetail(asset.id)
        watchForResizes()
      } else {
        refreshes = 0
      }
    }, 5000)
  }
</script>

<div class="container">
  <div class:hasimage={image}>
    <DetailPanel header={asset.filename} button={[
      { icon: uploadIcon, hiddenLabel: 'upload new file for asset', onClick: onUploadClick },
      { icon: pencilIcon, hiddenLabel: 'edit asset details', onClick: onEditClick }
    ]}>
      <DetailList records={{
        Size: bytesToHuman(asset.size),
        Type: asset.mime,
        'Modified By': `${asset.modifiedBy.name} (${asset.modifiedBy.id})`,
        'Modified At': dateStamp(asset.modifiedAt),
        'Filename Uploaded': asset.uploadedFilename !== asset.filename ? asset.uploadedFilename : undefined,
        'Legacy ID': asset.data.legacyId
      }} />
    </DetailPanel>
    {#if asset.resizes.length || refreshes}
      <DetailPanel header="Resizes{refreshes ? ' (loading more...)' : ''}">
        <StyledList>
          {#each asset.resizes as resize}
            <li class="flex-row">
              <img src="{environmentConfig.apiBase}/resize/{resize.id}/{asset.name}_{resize.width}.{resize.extension}?admin=1" width={resize.width} height={resize.height} alt="">
              <span class="mime">{resize.mime}</span>
              <span class="resolution">{resize.width} x {resize.height}</span>
              <span class="size">{bytesToHuman(resize.size)}</span>
            </li>
          {/each}
        </StyledList>
      </DetailPanel>
    {/if}
  </div>
  {#if image}
    <div class="image">
      <img src="{environmentConfig.apiBase}/assets/{asset.id}/w/500/{asset.checksum}/{asset.name}?admin=1" width={image.width} height={image.height} alt="">
      <div class="details">
        {image.width}x{image.height}
      </div>
    </div>
  {/if}
</div>
{#if modal === 'upload'}
  <UploadUI title="Upload new file for {asset.path}" uploadPath="{environmentConfig.apiBase}/assets/replace/{asset.id}?admin=1" maxFiles={1} on:escape={onUploadEscape} on:saved={onUploadSaved} />
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
  .flex-row img {
    width: 5em;
    height: 3em;
    object-fit: contain;
  }
</style>
