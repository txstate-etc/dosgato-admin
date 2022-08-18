import { redirect } from '@sveltejs/kit'
import { browser } from '$app/env'
import { goto } from '$app/navigation'
import { base } from '$app/paths'
import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
  if (browser) await goto(base + '/pages') // temporary while they fix throw redirect https://github.com/sveltejs/kit/issues/5952
  else throw redirect(301, base + '/pages')
}
