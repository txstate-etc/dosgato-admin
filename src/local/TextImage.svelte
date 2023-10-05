<script>
  import { FieldChooserLink, FieldText, FieldTextArea } from '@dosgato/dialog'
</script>

<FieldText path="title" label="Title" />
<FieldTextArea path="text" label="Rich Text" />
<FieldChooserLink path="image" label="Image" images />
<FieldChooserLink path="link" label="Link" pages urlEntry />
