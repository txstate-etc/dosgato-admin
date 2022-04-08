import type { MaybePromise, RequestEvent, ResolveOptions } from '@sveltejs/kit/types/internal'

export async function handle ({ event, resolve }: {
  event: RequestEvent
  resolve: (
    event: RequestEvent,
    opts?: ResolveOptions
  ) => MaybePromise<Response>
}) {
  return await resolve(event, {
    ssr: false
  })
}
