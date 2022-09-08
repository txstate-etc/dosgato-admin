import { error, redirect, type Load } from '@sveltejs/kit'
import { api, globalStore } from '$lib'
import { getRedirect, getToken } from '../local'

export const load: Load = async (input) => {
  api.fetch = input.fetch
  await api.init(getToken(input))
  let errObj
  try {
    const { me, access } = await api.getSelf()
    if (!me) throw error(403, 'You are not authorized to use this system.')
    globalStore.update(v => ({ ...v, me, access }))
    const redirectUrl = getRedirect(input)
    if (redirectUrl) throw redirect(301, redirectUrl)
  } catch (e: any) {
    if (e.status === 301) throw e
    errObj = e
  }
  return { errObj }
}

export const ssr = false
