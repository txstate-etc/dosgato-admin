<script>
  import { FieldChooserLink, FieldText, FieldTextArea } from '@dosgato/dialog'
  import { dialogQuery } from '@dosgato/templating'
  import { pick } from 'txstate-utils'

  const GET_ASSET_METADATA = `
    query getAssetMetadata($link: AssetLinkInput!) {
      assets(filter: { links: [$link] }) {
        data
      }
    }
  `

  async function fetchSelectedAsset(selectedAsset) {
    if (!selectedAsset) return null
    const parsed = JSON.parse(selectedAsset.id)
    const link = { ...pick(parsed, 'siteId', 'path', 'checksum'), linkId: parsed.id }
    const result = await dialogQuery(GET_ASSET_METADATA, { link })
    return result.assets[0]?.data?.meta || null
  }
</script>

<FieldText path="title" label="Title" />
<FieldTextArea path="text" label="Rich Text" />
<FieldChooserLink path="image" label="Image" images altTextPath="altText" altTextRequired>
  <svelte:fragment slot="metadata" let:selectedAsset>
    {#if selectedAsset}
      {#await fetchSelectedAsset(selectedAsset) then assetMeta}
         We have other metadata fields too!
        <dl>
          <div>
            <dt>Title</dt>
            <dd>{assetMeta?.title ?? 'Not Provided'}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{assetMeta?.description ?? 'Not Provided'}</dd>
          </div>
        </dl>
      {:catch error}
        <div>Error loading asset metadata: {error.message}</div>
      {/await}
    {:else}
      <div>No asset selected.</div>
    {/if}
  </svelte:fragment>
</FieldChooserLink>
<FieldChooserLink path="link" label="Link" pages />

<style>
  dl {
    padding: 1em;
    margin: 0;
    padding-left: 0;
  }
  dt {
    font-weight: bold;
  }
  dd {
    margin: 0 0 1em 0;
  }
</style>
