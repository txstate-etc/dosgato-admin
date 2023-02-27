import codeSandboxLogo from '@iconify-icons/ph/codesandbox-logo'
import type { Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { subnavStore } from '$lib'

export const load: Load = async () => {
  subnavStore.init('settings', [{ label: 'Template Management', href: base + '/settings/templates', icon: codeSandboxLogo }])
}
