import type { MessageFromAPI } from '$lib'
import { MessageType, type Feedback } from '@txstate-mws/svelte-forms'
import { isNull, isNotBlank } from 'txstate-utils'

export function messageForDialog (messages: MessageFromAPI[], prefix: string) {
  return messages.filter(m => {
    if (m.arg) {
      return m.arg.startsWith(`${prefix}`)
    }
    return false
  }).map(m => {
    return { path: isNotBlank(prefix) ? m.arg.replace(`${prefix}.`, '') : m.arg, type: m.type, message: m.message }
  }) as Feedback[]
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
