<script lang="ts">
  import { FieldText, FieldTextArea } from '@dosgato/dialog'
</script>

<!-- the alternate text field is provided by the asset detail route -->
<slot />

<FieldText path="title" label="Title" />
<FieldTextArea path="description" label="Description" helptext="Optional notes about this asset, such as its subject, source, or intended use. This is not alternate text and is not read by screen readers in its place." />
