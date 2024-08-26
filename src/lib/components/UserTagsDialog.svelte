<script lang="ts">
  import { FieldCheckbox, FieldHidden, FieldIdentifier, FieldMultiple, FieldText } from '@dosgato/dialog'
</script>

<FieldText path="title" label="Title" />
<FieldHidden path="excludeTitle" value={true} boolean />
<!--
  <FieldCheckbox path="excludeTitle" boxLabel="Tag names in this group stand alone, and do not need to be prefixed with the group title." helptext="Usually we use the group title to help differentiate tags from one another, like 'Audience: Everyone'. 'Everyone' would be an ambiguous tag all on its own. But some group titles like 'Miscellaneous' would not make sense as a prefix, so you can set this option true in those cases to avoid it." />
-->
<FieldHidden path="applicable.0" value="page" />
<FieldCheckbox path="disabled" boxLabel="Disable this entire group." />
<FieldCheckbox path="internal" boxLabel="These tags are for internal use and should never appear in page content." />
<FieldMultiple path="tags" label="Tags" removable reorder>
  <FieldIdentifier path="id" />
  <FieldText path="name" label="Name" />
  <FieldCheckbox path="disabled" boxLabel="Disabled" />
</FieldMultiple>
