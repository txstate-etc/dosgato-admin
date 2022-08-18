import type { RequestEvent, ResolveOptions } from '@sveltejs/kit'

export async function handle ({ event, resolve }: {
  event: RequestEvent
  resolve: (
    event: RequestEvent,
    opts?: ResolveOptions
  ) => Promise<Response>
}) {
  return await resolve(event, {
    ssr: false
  })
}
