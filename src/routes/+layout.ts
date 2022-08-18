import { error } from '@sveltejs/kit'
import type { LayoutLoad } from './$types'
import { api, environmentConfig, globalStore } from '$lib'
import { getToken } from '../local'

export const load: LayoutLoad = async (input) => {
  api.fetch = input.fetch
  api.token = getToken(input)
  if (api.token) {
    sessionStorage.setItem('token', api.token)
  } else {
    api.token = sessionStorage.getItem('token') ?? undefined
  }
  Object.assign(environmentConfig, await api.config())
  const { me, access } = await api.getSelf()
  if (!me) throw error(403, 'You are not authorized to use this system.')
  globalStore.update(v => ({ ...v, me, access }))
}
