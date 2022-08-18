import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'
import { api, UserDetailStore } from '$lib'

export const store = new UserDetailStore(api.getUserById.bind(api))

export const load: PageLoad = async ({ params }) => {
  await store.refresh(params.id)
  if (!store.userFetched()) throw error(404)
  const allGroups = await api.getAllGroups()
  return { allGroups }
}
