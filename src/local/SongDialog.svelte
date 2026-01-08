<script>
  import { FieldText, FieldSelect } from '@dosgato/dialog'
</script>

<FieldText path="title" label="Song Title" />
<FieldText path="artist" label="Artist" />
<FieldSelect path="genre" label="Genre" choices={[ { value: 'country' }, { value: 'western' }]} />
