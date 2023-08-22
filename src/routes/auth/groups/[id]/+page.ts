import { error, type Load } from '@sveltejs/kit'
import { api, GroupDetailStore } from '$lib'
import { updateAuthSubnav } from '../../authsubnav'

export const _store = new GroupDetailStore(api.getGroupById.bind(api))

export const load: Load<{ id: string }> = async ({ params }) => {
  await _store.refresh(params.id)
  if (!_store.groupFetched()) throw error(404)
  updateAuthSubnav('groups')
  return {}
}
