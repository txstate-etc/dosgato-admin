import fileTree from '@iconify-icons/mdi/file-tree'
import type { Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { subnavStore } from '$lib'

export const load: Load = async () => {
  subnavStore.init('assets', [{ label: 'Assets', href: base + '/assets', icon: fileTree }])
}
