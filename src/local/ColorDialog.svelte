<script lang="ts">
  import { FieldText, FieldSelect } from '@dosgato/dialog'
</script>

<FieldText path="title" label="Title" required/>
<FieldText path="color" label="Color" required/>
<FieldSelect path="align" label="Alignment" choices={[{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }, { label: 'Center', value: 'center' }]}/>
