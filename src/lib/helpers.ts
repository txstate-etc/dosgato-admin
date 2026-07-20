import { LaunchState, type MessageFromAPI, type MutationResponse, type PagetreeTypes } from '$lib'
import { MessageType, type Feedback, type SubmitResponse } from '@txstate-mws/svelte-forms'
import { DateTime } from 'luxon'
import { isNull, isNotBlank, omit } from 'txstate-utils'
import browserIcon from '@iconify-icons/ph/browser'
import archive from '@iconify-icons/ph/archive'
import { goto } from '$app/navigation'
import type { ResolvedPathname } from '$app/types'
import { sandboxIcon } from './icons'

export function messageForDialog (messages: MessageFromAPI[], prefix?: string) {
  return messages.map(m => (
    {
      ...omit(m, 'arg'),
      path: isNull(m.arg) ? null : isNotBlank(prefix) ? m.arg.replace(RegExp('^' + prefix + '\\.'), '') : m.arg
    }
  )) as Feedback[]
}

export function mutationForDialog (resp: MutationResponse, { prefix }: { prefix?: string }): SubmitResponse<undefined>
export function mutationForDialog<T = any> (resp: MutationResponse, { prefix, dataName }: { prefix?: string, dataName: string }): SubmitResponse<T>
export function mutationForDialog<T = any> (resp: MutationResponse, { prefix, dataName }: { prefix?: string, dataName?: string }) {
  return { success: resp.success, messages: messageForDialog(resp.messages, prefix), data: (dataName ? (resp as MutationResponse & Record<string, unknown>)[dataName] : undefined) as T }
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

export function uploadWithProgress (url: URL | string, headers: Record<string, string>, formData: FormData, progress: (ratio: number) => void, signal?: AbortSignal): { promise: Promise<number>, abort: () => void } {
  const request = new XMLHttpRequest()
  const promise = new Promise<number>((resolve, reject) => {
    request.open('POST', url)
    for (const [key, val] of Object.entries(headers)) request.setRequestHeader(key, val)
    request.upload.addEventListener('progress', e => progress(e.loaded / e.total))

    // request finished
    request.addEventListener('load', () => {
      if (request.status >= 400) reject(new Error(request.responseText))
      else resolve(request.status)
    })

    request.addEventListener('error', () => reject(new Error('An error occurred during transfer. Upload not completed.')))

    request.addEventListener('abort', () => {
      const err = new Error('aborted') as Error & { aborted: boolean }
      err.aborted = true
      reject(err)
    })

    request.send(formData)

    if (signal?.aborted) request.abort()
    else signal?.addEventListener('abort', () => request.abort())
  })
  return { promise, abort: () => request.abort() }
}

export function dateStamp (dt: string | Date | DateTime, opts?: { includeTz?: boolean }) {
  const luxdt = typeof dt === 'string' ? DateTime.fromISO(dt) : (dt instanceof Date ? DateTime.fromJSDate(dt) : dt)
  return luxdt.toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase()) + (opts?.includeTz ? ' ' + luxdt.toFormat('ZZZZ') : '')
}

export function dateStampShort (dt: string | Date | DateTime) {
  const luxdt = typeof dt === 'string' ? DateTime.fromISO(dt) : (dt instanceof Date ? DateTime.fromJSDate(dt) : dt)
  return luxdt.toFormat('L/d/yy ha').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())
}

export function getSiteIcon (launchState: LaunchState, type: PagetreeTypes) {
  if (type === 'PRIMARY') {
    if (launchState === LaunchState.LAUNCHED) {
      return browserIcon
    } else if (launchState === LaunchState.PRELAUNCH) {
      return sandboxIcon
    } else return archive
  } else if (type === 'SANDBOX') {
    return sandboxIcon
  } else {
    return archive
  }
}

export type SmartLink = `http${string}` | ResolvedPathname
export async function smartGoto (href: SmartLink) {
  if (!href) return
  if (/^https?:\/\//.test(href)) {
    window.location.href = href
  } else {
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- just determined that it's internal
    await goto(href)
  }
}
