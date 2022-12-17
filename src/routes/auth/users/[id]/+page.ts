import { error, type Load } from '@sveltejs/kit'
import { api, UserDetailStore } from '$lib'

export const _store = new UserDetailStore(api.getUserById.bind(api))

export const load: Load<{ id: string }> = async ({ params }) => {
  await _store.refresh(params.id)
  if (!_store.userFetched()) throw error(404)
  const [allGroups, allRoles] = await Promise.all([
    api.getAllGroups(),
    api.getRoleList()
  ])
  return { allGroups, allRoles }
}
