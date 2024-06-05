<script lang="ts">
  import { FileIcon, FormDialog, bytesToHuman, Icon } from '@dosgato/dialog'
  import arrowSquareOut from '@iconify-icons/ph/arrow-square-out'
  import caretDown from '@iconify-icons/ph/caret-down'
  import clipboardText from '@iconify-icons/ph/clipboard-text'
  import downloadIcon from '@iconify-icons/ph/download'
  import fileMagnifyingGlass from '@iconify-icons/ph/file-magnifying-glass'
  import magnifyingGlassPlus from '@iconify-icons/ph/magnifying-glass-plus'
  import warningIcon from '@iconify-icons/ph/warning'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import swapIcon from '@iconify-icons/ph/swap'
  import xLight from '@iconify-icons/ph/x-light'
  import { Modal } from '@txstate-mws/svelte-components'
  import { roundTo } from 'txstate-utils'
  import {
    DetailList, DetailPanel, DetailPanelSection, environmentConfig, UploadUI, StyledList, dateStamp,
    ChooserClient, api, ModalContextStore, toast, type DetailPanelButton, type AssetWithPages,
    SortableTable
  } from '$lib'
  import { getAssetDetail, type AssetDetail } from './helpers'
  import { uiConfig } from '../../../local'
  import { base } from '$app/paths'

  export let data: { asset: AssetDetail, assetReferencesPending: boolean, assetReferences: AssetWithPages['assets'][number]['pages'], assetReferencesIndirect: AssetWithPages['assets'][number]['pages'] }
  $: asset = data.asset
  $: image = asset.box
  $: assetReferencesPending = data.assetReferencesPending
  $: assetReferences = data.assetReferences
  $: assetReferencesIndirect = data.assetReferencesIndirect

  type Modals = 'edit' | 'upload' | 'preview'
  const modalContext = new ModalContextStore<Modals>()

  function onEditClick () {
    modalContext.setModal('edit', asset.path)
  }

  function onUploadClick () {
    modalContext.setModal('upload', asset.path)
  }
  async function onUploadSaved () {
    modalContext.reset()
    asset = await getAssetDetail(asset.id)
    watchForResizes()
  }

  async function expandReferences () {
    if (assetReferencesPending) return
    assetReferencesPending = true
    ;({ assetReferences, assetReferencesIndirect } = await api.getAssetReferencingPages(asset.id))
  }

  const chooserClient = new ChooserClient()
  async function onMetaSubmit (meta: any) {
    const resp = await api.updateAssetMeta(asset.id, meta)
    modalContext.logModalResponse(resp, asset.id)
    return resp
  }

  async function onMetaValidate (meta: any) {
    const resp = await api.updateAssetMeta(asset.id, meta, true)
    return resp.messages
  }

  async function onMetaSaved () {
    modalContext.reset()
    asset = await getAssetDetail(asset.id)
  }

  let externalURLElement: HTMLAnchorElement
  function onExternal (e: MouseEvent) {
    if (externalURLElement instanceof HTMLAnchorElement) {
      navigator.clipboard.writeText(externalURLElement.getAttribute('href')!).then(() => {
        toast('Copied external link to clipboard.', 'success')
      }).catch(console.error)
    }
  }

  const assetBase = environmentConfig.assetLiveBase || (environmentConfig.apiBase + '/assets')

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

  function assetPanelButtons (asset: AssetDetail): DetailPanelButton[] {
    const buttons: DetailPanelButton[] = [{ icon: swapIcon, hiddenLabel: 'upload new file for asset', onClick: onUploadClick }]
    if (!asset.corrupt) {
      buttons.push({ icon: downloadIcon, hiddenLabel: 'download asset', disabled: asset.corrupt, onClick: () => { void api.download(`${environmentConfig.renderBase}/.asset/${asset.id}/${encodeURIComponent(asset.filename)}`) } })
    }
    return buttons
  }
</script>

<div class="container">
  <DetailPanel header="Asset" class="image" headerColor="#E5D1BD" button={assetPanelButtons(asset)}>
    <DetailPanelSection>
      {#if image}
        <div class="image-container">
          <img src="{environmentConfig.renderBase}/.asset/{asset.id}/w/500/{asset.checksum.substring(0, 12)}/{encodeURIComponent(asset.filename)}" width={image.width} height={image.height} alt="">
          <button type="button" on:click={() => { modalContext.setModal('preview', asset.filename) }}><Icon icon={magnifyingGlassPlus} width="1.3em" hiddenLabel="Show image full screen"/></button>
          {#if asset.corrupt}
            <div class="asset-corrupt-icon">
              <span class="circle">
                <Icon icon={warningIcon} width="1.5em" />
              </span>
            </div>
          {/if}
        </div>
      {:else}
        <div class="file-icon">
          <FileIcon width="50%" mime={asset.mime} />
          {#if asset.corrupt}
            <div class="asset-corrupt-icon">
              <span class="circle">
                <Icon icon={warningIcon} width="1.5em" />
              </span>
            </div>
          {/if}
        </div>
      {/if}
      {#if asset.corrupt}
        <div class="asset-corrupt-message">
          Replace this asset <Icon inline icon={swapIcon} /> to keep using it.
        </div>
      {/if}
    </DetailPanelSection>
  </DetailPanel>
  <div class="left-column">
    <DetailPanel header="Asset Details" headerColor="#E5D1BD" button={[
      ...(uiConfig.assetMeta ? [{ icon: pencilIcon, hiddenLabel: 'edit asset details', onClick: onEditClick }] : [])
    ]}>
      <DetailPanelSection>
        {#if asset?.corrupt}
          <div class="corrupt-warning">
            <Icon icon={warningIcon} width="1.5em"/>
            Asset Corrupted! Replace this asset to keep using it.
          </div>
        {/if}
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
          'Filename Uploaded': asset.uploadedFilename !== asset.filename ? asset.uploadedFilename : undefined
        }} />
        <dl>
          <div><dt>Path:</dt><dd>{asset.path}</dd></div>
          {#if asset.pagetree.type !== 'ARCHIVE'}<div><dt>External URL:</dt><dd><a bind:this={externalURLElement} href="{image ? `${assetBase}/${asset.id}/w/2000/${asset.checksum.substring(0, 12)}/${encodeURIComponent(asset.filename)}` : `${assetBase}/${asset.id}/${encodeURIComponent(asset.filename)}`}" on:click|preventDefault={onExternal}>{asset.filename}</a><button type="button" class="reset" on:click={onExternal}><Icon icon={clipboardText} hiddenLabel="copy external url to clipboard" inline /></button></dd></div>{/if}
        </dl>
      </DetailPanelSection>
    </DetailPanel>
    <DetailPanel header="Appears On" headerColor="#E5D1BD" button={{ icon: caretDown, onClick: expandReferences, hiddenLabel: 'Expand', 'aria-expanded': assetReferencesPending }} loading={assetReferencesPending && !assetReferences}>
      {#if assetReferences && assetReferencesIndirect}
        <DetailPanelSection>
          {#if assetReferences.length || !assetReferencesIndirect.length}
            <SortableTable items={assetReferences} emptyMessage="Could not find pages directly referencing this asset."
              headers={[
                { id: 'name', label: 'Asset appears directly on', render: (item) => item.permissions.viewLatest ? `<a href="${base}/pages/${item.id}">${item.path}</a>` : item.path },
                { id: 'view', label: 'Preview', actions: [{ icon: arrowSquareOut, hiddenLabel: 'Preview In New Window', label: 'Preview', onClick: (item) => { window.open(base + '/preview?url=' + encodeURIComponent(`${environmentConfig.renderBase}/.preview/${item.permissions.viewLatest || !item.published ? 'latest' : 'public'}${item.path}.html`), '_blank') } }] }
              ]}
            />
          {/if}
          {#if assetReferencesIndirect.length}
            <SortableTable items={assetReferencesIndirect} emptyMessage="Could not find pages referencing this asset's parent folders."
              headers={[
                { id: 'name', label: 'A parent folder appears on', render: (item) => item.permissions.viewLatest ? `<a href="${base}/pages/${item.id}">${item.path}</a>` : item.path },
                { id: 'view', label: 'Preview', actions: [{ icon: arrowSquareOut, hiddenLabel: 'Preview In New Window', label: 'Preview', onClick: (item) => { window.open(base + '/preview?url=' + encodeURIComponent(`${environmentConfig.renderBase}/.preview/${item.permissions.viewLatest || !item.published ? 'latest' : 'public'}${item.path}.html`), '_blank') } }] }
              ]}
            />
          {/if}
        </DetailPanelSection>
      {/if}
    </DetailPanel>
    {#if false && (asset.resizes.length || refreshes)}
        <DetailPanel headerColor="#E5D1BD" header="Resizes{refreshes ? ' (loading more...)' : ''}">
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
{#if $modalContext.modal === 'upload'}
  <UploadUI title="Upload new file for {asset.path}" helptext="Uploading a new file will replace this asset everywhere it appears." uploadPath="{environmentConfig.apiBase}/assets/replace/{asset.id}" maxFiles={1} on:escape={modalContext.onModalEscape} on:saved={onUploadSaved} />
{:else if $modalContext.modal === 'edit' && uiConfig.assetMeta}
  <FormDialog icon={fileMagnifyingGlass} title="Edit Asset Details" submit={onMetaSubmit} validate={onMetaValidate} preload={asset.data.meta ?? {}} on:escape={modalContext.onModalEscape} on:saved={onMetaSaved} let:data {chooserClient}>
    <svelte:component this={uiConfig.assetMeta.dialog} {asset} {data} {environmentConfig} />
  </FormDialog>
{:else if $modalContext.modal === 'preview' && image}
  <Modal escapable on:escape={modalContext.onModalEscape}>
    <div class="preview" style:max-width="min({image.width * 3}px, {roundTo(90 * image.width / image.height, 4)}dvh)" style:padding-bottom="{roundTo(100 * image.height / image.width, 4)}%">
      <img src="{environmentConfig.renderBase}/.asset/{asset.id}/w/{window.innerWidth}/{asset.checksum.substring(0, 12)}/{encodeURIComponent(asset.filename)}" width={image.width} height={image.height} alt="">
      <button type="button" on:click={modalContext.onModalEscape}><Icon icon={xLight} width="2em" hiddenLabel="Close Full Screen Image"/></button>
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
    position: relative;
  }
  .preview {
    position: relative;
    overflow: hidden;
    width: 90vw;
  }
  .preview img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
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
  dl {
    display: flex;
    flex-direction: column;
    margin: 0;
  }
  dt, dd {
    display: inline;
  }
  dl > div {
    padding: 0.5em 0;
    border-bottom: 1px dashed #707070;
  }
  dt {
    font-weight: bold;
    padding-right: 0.5em;
  }
  dd {
    margin: 0;
  }
  dl button {
    padding: 0 0.5em;
  }
  .corrupt-warning {
    color: #A80000;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 0.5em;
  }
  .asset-corrupt-icon {
    color: #A80000;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .asset-corrupt-icon .circle {
    background-color: white;
    height: 2em;
    width: 2em;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
  }
  .asset-corrupt-message {
    color: #A80000;
    text-align: center;
    padding: 1em;
  }
</style>
