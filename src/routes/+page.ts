import { redirect, type Load } from '@sveltejs/kit'
import { resolve } from '$app/paths'
import { get } from 'svelte/store'
import { globalStore } from '$lib'

export const load: Load = async ({ parent }) => {
  await parent()
  const { access } = get(globalStore)
  if (access?.viewPageManager) throw redirect(302, resolve('/pages'))
  throw redirect(302, resolve('/dashboard'))
}
