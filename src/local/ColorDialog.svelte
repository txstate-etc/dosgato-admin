<script lang="ts">

  import { FieldText, FieldSelect } from '@dosgato/dialog'
  import { MessageType, type Feedback } from '@txstate-mws/svelte-forms'
  import { isNull } from 'txstate-utils'

  async function submit (data) {
    return {
      success: true,
      data,
      messages: []
    }
  }

  export async function validate (data) {
    const feedback: Feedback[] = []
    if (isNull(data.title)) {
      feedback.push({ type: MessageType.ERROR, message: 'Title is required', path: 'title' })
    }
    if (isNull(data.color)) {
      feedback.push({ type: MessageType.ERROR, message: 'Color is required', path: 'color' })
    }
    return feedback
  }
</script>

<FieldText path="name" label="Name" required/>
<FieldText path="title" label="Title" required/>
<FieldText path="color" label="Color" required/>
<FieldSelect path="align" label="Alignment" choices={[{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }, { label: 'Center', value: 'center' }]}/>
