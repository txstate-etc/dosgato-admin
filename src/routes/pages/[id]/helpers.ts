import circleIcon from '@iconify-icons/mdi/circle'
import squareIcon from '@iconify-icons/mdi/square'
import triangleIcon from '@iconify-icons/mdi/triangle'
import type { SubNavLink } from '$lib'

export interface PageSubNavLink extends SubNavLink {
  pageId: string
}

export const statusIcon = {
  published: triangleIcon,
  modified: circleIcon,
  unpublished: squareIcon
}
