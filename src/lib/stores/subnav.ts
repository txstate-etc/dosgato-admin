import type { IconifyIcon } from '@iconify/svelte'
import { derivedStore, Store } from '@txstate-mws/svelte-store'
import { findIndex, set, splice } from 'txstate-utils'

export interface SubNavLink {
  href: string
  label: string
  icon?: IconifyIcon
  closeable?: boolean
  onClose?: (link: this) => void
}

class SubNavStore extends Store<{ sections: Record<string, { links: SubNavLink[], active: number }>, active?: string }> {
  init (section: string, links: SubNavLink[]) {
    this.update(v => ({ ...v, sections: { ...v.sections, [section]: v.sections[section] ?? { active: 0, links } }, active: section }))
  }

  open<LinkType extends SubNavLink = SubNavLink> (section: string, link: LinkType) {
    this.update(v => {
      const current = v.sections[section]
      const active = findIndex(current.links, l => l.href === link.href)
      return {
        active: section,
        sections: {
          ...v.sections,
          [section]: {
            active: active ?? current.links.length,
            links: active ? current.links.map(l => l.href === link.href ? { ...link, closeable: l.closeable } : l) : [...current.links, { ...link, closeable: true }]
          }
        }
      }
    })
  }

  getLabel (idx: number) {
    if (!this.value.active) return undefined
    return this.value.sections[this.value.active].links[this.value.sections[this.value.active].active].label
  }

  close (idx: number) {
    if (!this.value.active) return
    const oldlink = this.value.sections[this.value.active].links[this.value.sections[this.value.active].active]
    if (!oldlink) return
    const oldHref = oldlink.href
    this.update(v => {
      if (!v.active) return v
      const current = v.sections[v.active]
      if (!current.links[idx].closeable) return v
      let active = current.active
      if (current.active >= idx && current.links.length <= current.active + 1 && current.active > 0) active = current.active - 1
      return set(v, `sections["${v.active}"]`, { active, links: splice(current.links, idx, 1) })
    })
    const newHref = this.value.sections[this.value.active].links[this.value.sections[this.value.active].active].href
    oldlink.onClose?.(oldlink)
    return oldHref !== newHref ? newHref : undefined
  }
}

export const subnavStore = new SubNavStore({ sections: {} })
export const currentSubNav = derivedStore(subnavStore, v => v.active ? v.sections[v.active] : undefined)
