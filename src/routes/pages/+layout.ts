import listIcon from '@iconify-icons/ph/list-bullets-bold'
import type { Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { subnavStore, templateRegistry } from '$lib'

export const load: Load = async () => {
  subnavStore.init('pages', [{ label: 'Pages', href: base + '/pages', icon: listIcon }])
  await templateRegistry.enhanceInfo()
}
