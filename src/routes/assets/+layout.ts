import fileTree from '@iconify-icons/mdi/file-tree'
import type { Load } from '@sveltejs/kit'
import { resolve } from '$app/paths'
import { subnavStore } from '$lib'

export const load: Load = async () => {
  subnavStore.init('assets', [{ label: 'Assets', href: resolve('/assets'), icon: fileTree }])
}
