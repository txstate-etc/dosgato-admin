<script lang="ts">
  import { FileIcon, FormDialog, bytesToHuman, Icon } from '@dosgato/dialog'
  import downloadIcon from '@iconify-icons/ph/download'
  import fileMagnifyingGlass from '@iconify-icons/ph/file-magnifying-glass'
  import magnifyingGlassPlus from '@iconify-icons/ph/magnifying-glass-plus'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import uploadIcon from '@iconify-icons/ph/upload'
  import xLight from '@iconify-icons/ph/x-light'
  import { Modal } from '@txstate-mws/svelte-components'
  import { DetailList, DetailPanel, DetailPanelSection, environmentConfig, UploadUI, StyledList, dateStamp, ChooserClient, api } from '$lib'
  import { getAssetDetail, type AssetDetail } from './helpers'
  import { uiConfig } from '../../../local'

  export let data: { asset: AssetDetail }
  $: asset = data.asset
  $: image = asset.box

  let modal: 'edit' | 'upload' | 'preview' | undefined
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

  const chooserClient = new ChooserClient()
  async function onMetaSubmit (meta: any) {
    const resp = await api.updateAssetMeta(asset.id, meta)
    return resp
  }

  async function onMetaValidate (meta: any) {
    const resp = await api.updateAssetMeta(asset.id, meta, true)
    return resp.messages
  }

  async function onMetaSaved () {
    modal = undefined
    asset = await getAssetDetail(asset.id)
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
  <DetailPanel header="Asset" class="image" button={[
    { icon: uploadIcon, hiddenLabel: 'upload new file for asset', onClick: onUploadClick },
    { icon: downloadIcon, hiddenLabel: 'download asset', onClick: () => { api.download(`${environmentConfig.apiBase}/assets/${asset.id}/${asset.filename}`) } }
  ]}>
    <DetailPanelSection>
      {#if image}
        <div class="image-container">
          <img src="{environmentConfig.renderBase}/.asset/{asset.id}/w/500/{asset.checksum.substring(0, 12)}/{encodeURIComponent(asset.filename)}" width={image.width} height={image.height} alt="">
          <button type="button" on:click={() => { modal = 'preview' }}><Icon icon={magnifyingGlassPlus} width="1.3em" hiddenLabel="Show image full screen"/></button>
        </div>
      {:else}
        <div class="file-icon"><FileIcon width="50%" mime={asset.mime} /></div>
      {/if}
    </DetailPanelSection>
  </DetailPanel>
  <div class="left-column">
    <DetailPanel header="Asset Details" button={[
      ...(uiConfig.assetMeta ? [{ icon: pencilIcon, hiddenLabel: 'edit asset details', onClick: onEditClick }] : [])
    ]}>
      <DetailPanelSection>
        <DetailList records={{
          Name: asset.filename,
          Size: bytesToHuman(asset.size),
          Type: asset.mime,
          Dimensions: asset.box ? `${asset.box.width}x${asset.box.height}` : 'N/A',
          'Created On': dateStamp(asset.createdAt),
          'Modified On': dateStamp(asset.modifiedAt),
          'Created By': `${asset.modifiedBy.name} (${asset.modifiedBy.id})`,
          'Modified By': `${asset.modifiedBy.name} (${asset.modifiedBy.id})`,
          ...uiConfig.assetMeta?.details?.(asset.data.meta ?? {}),
          'Filename Uploaded': asset.uploadedFilename !== asset.filename ? asset.uploadedFilename : undefined,
          'Legacy ID': asset.data.legacyId
        }} />
      </DetailPanelSection>
    </DetailPanel>
    {#if false && (asset.resizes.length || refreshes)}
        <DetailPanel header="Resizes{refreshes ? ' (loading more...)' : ''}">
          <DetailPanelSection>
            <StyledList>
              {#each asset.resizes as resize}
                <li class="flex-row">
                  <img src="{environmentConfig.renderBase}/.asset/{asset.id}/resize/{resize.id}/{encodeURIComponent(asset.name)}_{resize.width}.{resize.extension}" width={resize.width} height={resize.height} alt="">
                  <span class="mime">{resize.mime}</span>
                  <span class="resolution">{resize.width} x {resize.height}</span>
                  <span class="size">{bytesToHuman(resize.size)}</span>
                </li>
              {/each}
            </StyledList>
          </DetailPanelSection>
        </DetailPanel>
    {/if}
  </div>
</div>
{#if modal === 'upload'}
  <UploadUI title="Upload new file for {asset.path}" uploadPath="{environmentConfig.apiBase}/assets/replace/{asset.id}" maxFiles={1} on:escape={onUploadEscape} on:saved={onUploadSaved} />
{:else if modal === 'edit' && uiConfig.assetMeta}
  <FormDialog icon={fileMagnifyingGlass} title="Edit Asset Details" submit={onMetaSubmit} validate={onMetaValidate} preload={asset.data.meta ?? {}} on:escape={onUploadEscape} on:saved={onMetaSaved} let:data {chooserClient}>
    <svelte:component this={uiConfig.assetMeta.dialog} {asset} {data} {environmentConfig} />
  </FormDialog>
{:else if modal === 'preview' && asset.box}
  <Modal escapable on:escape={() => { modal = undefined }}>
    <div class="preview" style:max-width="{asset.box.width * 3}px">
      <img src="{environmentConfig.renderBase}/.asset/{asset.id}/w/{window.innerWidth}/{asset.checksum.substring(0, 12)}/{encodeURIComponent(asset.filename)}" width={asset.box.width} height={asset.box.height} alt="">
      <button type="button" on:click={() => { modal = undefined }}><Icon icon={xLight} width="2em" hiddenLabel="Close Full Screen Image"/></button>
    </div>
  </Modal>
{/if}

<style>
  .container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    flex-direction: row-reverse;
    max-width: 1200px;
    margin: 0 auto;
  }
  .container > div {
    width: calc(70% - 1em);
  }
  .container > :global(.image) {
    width: 30%;
    color: var(--dg-asset-icon-color, #CCCCCC);
  }

  @media screen and (max-width: 50em) {
    .container > div {
      width: 100%;
    }
    .container > :global(.image) {
      width: 100%;
    }
  }

  .container > :global(.image .image-container) {
    position: relative;
  }
  .container > :global(.image .image-container img) {
    display: block;
    width: 100%;
    height: auto;
  }
  .container > :global(.image .image-container button) {
    position: absolute;
    top: 0.5em;
    right: 0.5em;
    cursor: pointer;
  }

  .container > div :global(.panel), .container > :global(.panel) {
    margin-bottom: 1em;
  }
  .flex-row img {
    width: 5em;
    height: 3em;
    object-fit: contain;
  }
  .file-icon {
    text-align: center;
  }
  .preview {
    position: relative;
    overflow: hidden;
    width: 90vw;
    height: 90vh;
  }
  .preview img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .preview button {
    position: absolute;
    top: 1em;
    right: 1em;
    background: transparent;
    border: 0;
    color: white;
    cursor: pointer;
  }
</style>
