<script lang="ts">
  import { FieldText } from '@dosgato/dialog'
  import { MessageType, type Feedback } from '@txstate-mws/svelte-forms'
  import { isNull } from 'txstate-utils'


  export async function validate (data) {
    const feedback: Feedback[] = []
    if (isNull(data.name)) {
      feedback.push({ type: MessageType.ERROR, message: 'Name is required', path: 'name' })
    }
    return feedback
  }
</script>

  <FieldText path="name" label="Name" required/>
  <FieldText path="floors" label="Floors"/>