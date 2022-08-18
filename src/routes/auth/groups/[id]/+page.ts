import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'
import { api, GroupDetailStore } from '$lib'

export const store = new GroupDetailStore(api.getGroupById.bind(api))

export const load: PageLoad = async ({ params }) => {
  await store.refresh(params.id)
  if (!store.groupFetched()) throw error(404)
  return {}
}
