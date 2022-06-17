import type { MessageFromAPI } from '$lib'
import { MessageType, type Feedback } from '@txstate-mws/svelte-forms'
import { isNull } from 'txstate-utils'

export function messageForDialog (messages: MessageFromAPI[], prefix: string) {
  return messages.filter(m => m.arg.startsWith(`${prefix}.`))
    .map(m => ({ path: m.arg.replace(`${prefix}.`, ''), type: m.type, message: m.message }))
}

export function ensureRequiredNotNull (data: any, requiredFields: string[]) {
  const messages: Feedback[] = []
  for (const field of requiredFields) {
    if (isNull(data[field])) {
      messages.push({ type: MessageType.ERROR, message: 'This field is required.', path: field })
    }
  }
  return messages
}
