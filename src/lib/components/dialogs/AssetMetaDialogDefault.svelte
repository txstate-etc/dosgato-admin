<script lang="ts">
  import { type Asset, FieldText, FieldTextArea } from '@dosgato/dialog'
  export let asset: Asset
</script>
<FieldText path="title" />
<FieldText path="altText" conditional={asset.mime.startsWith('image/')} helptext="What the image shows or means, in one or two sentences. Screen readers read this aloud. Leave blank only if the image is purely decorative." />
<FieldTextArea path="description" rows={4} helptext="Optional notes about this asset, such as its subject, source, or intended use. This is not alternate text and is not read by screen readers in its place." />
