import codeJson from '@iconify-icons/mdi/code-json'
import type { Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { subnavStore } from '$lib'

export const load: Load = async () => {
  subnavStore.init('data', [{ label: 'Data Types', href: base + '/data', icon: codeJson }])
}
