import { error } from '@sveltejs/kit'
import type { LayoutLoad } from './$types'
import { api, globalStore } from '$lib'
import { getToken } from '../local'

export const load: LayoutLoad = async (input) => {
  api.fetch = input.fetch
  await api.init(getToken(input))
  const { me, access } = await api.getSelf()
  if (!me) throw error(403, 'You are not authorized to use this system.')
  globalStore.update(v => ({ ...v, me, access }))
}

export const ssr = false
