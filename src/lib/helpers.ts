import type { MessageFromAPI } from '$lib'
import { MessageType, type Feedback } from '@txstate-mws/svelte-forms'
import { isNull, isNotBlank, omit } from 'txstate-utils'

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

export function messagesStripPrefix (messages: MessageFromAPI[], prefix: string) {
  return messages.map(m => ({ ...omit(m, 'arg'), path: m.arg.replace(RegExp('^' + prefix + '\\.'), '') })) as Feedback[]
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

export async function uploadWithProgress (url: URL | string, headers: Record<string, string>, formData: FormData, progress: (ratio: number) => void) {
  return await new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', url)
    for (const [key, val] of Object.entries(headers)) request.setRequestHeader(key, val)
    request.upload.addEventListener('progress', e => progress(e.loaded / e.total))

    // request finished
    request.addEventListener('load', e => {
      if (request.status >= 400) reject(request.statusText)
      else resolve(request.status)
    })

    request.send(formData)
  })
}
