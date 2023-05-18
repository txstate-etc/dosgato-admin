import listDashes from '@iconify-icons/ph/list-dashes'
import type { Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { subnavStore, templateRegistry } from '$lib'

export const load: Load = async () => {
  subnavStore.init('sites', [{ label: 'Sites', href: base + '/sites', icon: listDashes }])
  await templateRegistry.enhanceInfo()
}
