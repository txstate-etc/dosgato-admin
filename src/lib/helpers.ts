import type { MessageFromAPI, MutationResponse } from '$lib'
import { MessageType, type Feedback, type SubmitResponse } from '@txstate-mws/svelte-forms'
import { DateTime } from 'luxon'
import { isNull, isNotBlank, omit } from 'txstate-utils'

export function messageForDialog (messages: MessageFromAPI[], prefix?: string) {
  return messages.map(m => {
    return { ...omit(m, 'arg'), path: isNull(m.arg) ? null : isNotBlank(prefix) ? m.arg.replace(RegExp('^' + prefix + '\\.'), '') : m.arg }
  }) as Feedback[]
}

export function mutationForDialog (resp: MutationResponse, { prefix }: { prefix?: string }): SubmitResponse<undefined>
export function mutationForDialog<T = any> (resp: MutationResponse, { prefix, dataName }: { prefix?: string, dataName: string }): SubmitResponse<T>
export function mutationForDialog<T = any> (resp: MutationResponse, { prefix, dataName }: { prefix?: string, dataName?: string }) {
  return { success: resp.success, messages: messageForDialog(resp.messages, prefix), data: (dataName ? resp[dataName] : undefined) as T }
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
      if (request.status >= 400) reject(new Error(request.responseText))
      else resolve(request.status)
    })

    request.addEventListener('error', e => reject(new Error('An error occurred during transfer. Upload not completed.')))

    request.send(formData)
  })
}

export function dateStamp (dt: string | Date | DateTime) {
  const luxdt = typeof dt === 'string' ? DateTime.fromISO(dt) : (dt instanceof Date ? DateTime.fromJSDate(dt) : dt)
  return luxdt.toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())
}

export function dateStampShort (dt: string | Date | DateTime) {
  const luxdt = typeof dt === 'string' ? DateTime.fromISO(dt) : (dt instanceof Date ? DateTime.fromJSDate(dt) : dt)
  return luxdt.toFormat('L/d/yy ha').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())
}

export enum DeleteState {
  NOTDELETED = 0,
  MARKEDFORDELETE = 1,
  DELETED = 2
}

export function humanFileType (mime: string, extension: string) {
  if (mime.startsWith('image/') || mime.startsWith('video/')) return mime
  if (mime.startsWith('text/')) return 'text - ' + extension
  if (extension === 'js') return 'javascript'
  return extension
}
