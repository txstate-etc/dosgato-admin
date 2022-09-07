import { error, type Load } from '@sveltejs/kit'
import { api, GroupDetailStore } from '$lib'

export const store = new GroupDetailStore(api.getGroupById.bind(api))

export const load: Load<{ id: string }> = async ({ params }) => {
  await store.refresh(params.id)
  if (!store.groupFetched()) throw error(404)
  return {}
}
