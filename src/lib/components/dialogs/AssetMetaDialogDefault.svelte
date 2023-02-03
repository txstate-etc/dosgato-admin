<script lang="ts">
  import { type Asset, FieldText, FieldTextArea } from '@dosgato/dialog'
  export let asset: Asset
</script>
<FieldText path="title" />
<FieldText path="altText" conditional={asset.mime.startsWith('image/')} />
<FieldTextArea path="description" rows={4} />
