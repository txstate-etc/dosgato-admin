import { redirect, type Load } from '@sveltejs/kit'
import { base } from '$app/paths'

export const load: Load = async () => {
  throw redirect(301, base + '/pages')
}
