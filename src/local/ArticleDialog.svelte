<script lang="ts">
  import { FieldText } from '@dosgato/dialog'
  import { MessageType, type Feedback } from '@txstate-mws/svelte-forms'
  import { isNull } from 'txstate-utils'


  export async function validate (data) {
    const feedback: Feedback[] = []
    if (isNull(data.title)) {
      feedback.push({ type: MessageType.ERROR, message: 'Title is required', path: 'title' })
    }
    if (isNull(data.author)) {
      feedback.push({ type: MessageType.ERROR, message: 'Author Name is required', path: 'author' })
    }
    return feedback
  }
</script>

  <FieldText path="name" label="Name" required/>
  <FieldText path="title" label="Title" required/>
  <FieldText path="author" label="Author" required/>