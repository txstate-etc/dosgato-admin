import type { Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { subnavStore } from '$lib'
import gaugeIcon  from '@iconify-icons/ph/gauge'

export const load: Load = async () => {
  subnavStore.init('dashboard', [{ label: 'Dashboard', href: base + '/dashboard', icon: gaugeIcon }])
}
