<script lang="ts">

  import { FieldChooserLink, FieldDataChooser, FieldText } from '@dosgato/dialog'

</script>

<FieldText path="text" label="Text" required/>
<FieldChooserLink path="link" label="Link" required pages assets urlEntry />
<FieldDataChooser path="building" label="Building" rootTemplateKey="keyd2" />
<FieldDataChooser path="color" label="Color" rootTemplateKey="keyd1" />
