<script lang="ts">
  import { FieldText } from '@dosgato/dialog'
  export let data

  $: console.log(data)
</script>

<FieldText path="name" label="Name" required/>
<FieldText path="floors" label="Floors" conditional={data?.name?.length > 2 }/>