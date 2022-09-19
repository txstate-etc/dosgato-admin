import codeSandboxLogoLight from '@iconify-icons/ph/codesandbox-logo-light'
import type { Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { subnavStore } from '$lib'

export const load: Load = async () => {
  subnavStore.init('settings', [{ label: 'Template Management', href: base + '/settings/templates', icon: codeSandboxLogoLight }])
}
