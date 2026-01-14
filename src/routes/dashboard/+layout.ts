import gaugeIcon from '@iconify-icons/ph/gauge'
import type { Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { subnavStore, templateRegistry } from '$lib'

export const load: Load = async () => {
  subnavStore.init('dashboard', [{ label: 'Dashboard', href: base + '/dashboard', icon: gaugeIcon }])
}
