import listDashesLight from '@iconify-icons/ph/list-dashes-light'
import type { Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { subnavStore } from '$lib'

export const load: Load = async () => {
  subnavStore.init('sites', [{ label: 'Sites', href: base + '/sites', icon: listDashesLight }])
}
