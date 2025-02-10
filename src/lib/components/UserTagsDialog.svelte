<script lang="ts">
  import { FieldCheckbox, FieldHidden, FieldIdentifier, FieldMultiple, FieldText } from '@dosgato/dialog'
</script>

<FieldText path="title" label="Page Tag Set Display Name" required helptext="Name shown in the Data menu"/>
<FieldHidden path="excludeTitle" value={true} boolean />
<!--
  <FieldCheckbox path="excludeTitle" boxLabel="Tag names in this group stand alone, and do not need to be prefixed with the group title." helptext="Usually we use the group title to help differentiate tags from one another, like 'Audience: Everyone'. 'Everyone' would be an ambiguous tag all on its own. But some group titles like 'Miscellaneous' would not make sense as a prefix, so you can set this option true in those cases to avoid it." />
-->
<FieldHidden path="applicable.0" value="page" />
<FieldCheckbox path="internal" boxLabel="Mark tag set for internal use only." helptext="Select to only show this set to editors. It will be hidden for any externally-facing content (e.g. tags will not be available to display in layouts that support tags)." />
<FieldCheckbox path="disabled" boxLabel="Deactivate this entire set of tags." helptext="Deactivation of a full set of tags will remove all function of this tag set. As long as tags are inactive they will not be shown or referenced in any function, internal or external. " />
<FieldMultiple path="tags" label="Page Tag List" removable reorder confirmDelete="Tag will be permanently removed upon saving this dialog.">
  <FieldIdentifier path="id" />
  <FieldText path="name" label="Tag Name" maxlength={20} />
  <FieldCheckbox path="disabled" boxLabel="Inactive" />
</FieldMultiple>
