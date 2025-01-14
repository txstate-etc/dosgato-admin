import type { Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { subnavStore } from '$lib'

export const load: Load = async () => {
  subnavStore.init('templates', [
    { label: 'Page Templates', href: base + '/settings/templates/pages' },
    { label: 'Component Templates', href: base + '/settings/templates/components' },
    { label: 'Data Templates', href: base + '/settings/templates/data' }
  ])
}
