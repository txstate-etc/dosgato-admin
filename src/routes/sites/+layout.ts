import { base } from '$app/paths'
import { subnav } from '$lib/stores/global'

export const load = async () => {
  subnav.set([
    { label: 'Sites', href: base + '/sites' }
  ])
}
