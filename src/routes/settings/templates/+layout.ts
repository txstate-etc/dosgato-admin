import type { Load } from '@sveltejs/kit'
import { resolve } from '$app/paths'
import { subnavStore } from '$lib'

export const load: Load = async () => {
  subnavStore.init('templates', [
    { label: 'Page Templates', href: resolve('/settings/templates/pages') },
    { label: 'Component Templates', href: resolve('/settings/templates/components') },
    { label: 'Data Templates', href: resolve('/settings/templates/data') }
  ])
}
