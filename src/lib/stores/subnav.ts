import type { IconifyIcon } from '@iconify/svelte'
import { derivedStore, Store } from '@txstate-mws/svelte-store'
import { findIndex, set, splice } from 'txstate-utils'

export interface SubNavLink {
  href: string
  label: string
  icon?: IconifyIcon
  closeable?: boolean
}

class SubNavStore extends Store<{ sections: Record<string, { links: SubNavLink[], active: number }>, active?: string }> {
  init (section: string, links: SubNavLink[]) {
    this.update(v => ({ ...v, sections: { ...v.sections, [section]: v.sections[section] ?? { active: 0, links } }, active: section }))
  }

  open (section: string, link: SubNavLink) {
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

  close (idx: number) {
    if (!this.value.active) return
    const oldHref = this.value.sections[this.value.active].links[this.value.sections[this.value.active].active]?.href
    this.update(v => {
      if (!v.active) return v
      const current = v.sections[v.active]
      if (!current.links[idx].closeable) return v
      let active = current.active
      if (current.active >= idx && current.links.length <= current.active + 1 && current.active > 0) active = current.active - 1
      return set(v, `sections["${v.active}"]`, { active, links: splice(current.links, idx, 1) })
    })
    const newHref = this.value.sections[this.value.active].links[this.value.sections[this.value.active].active].href
    return oldHref !== newHref ? newHref : undefined
  }
}

export const subnavStore = new SubNavStore({ sections: {} })
export const currentSubNav = derivedStore(subnavStore, v => v.active ? v.sections[v.active] : undefined)
