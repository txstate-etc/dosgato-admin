import { base } from '$app/paths'
import { subnav } from '$lib/stores/global'
import fileTree from '@iconify-icons/mdi/file-tree'

export const load = async () => {
  subnav.set([
    { label: 'Pages', href: base + '/pages', icon: fileTree }
  ])
}
