import { derivedStore, Store } from '@txstate-mws/svelte-store'
import { splice } from 'txstate-utils'

export interface IDataListStore {
  templates: DataTemplate[]
  active: number
}

export interface DataTemplate {
  id: string
  name: string
}

class DataListStore extends Store<IDataListStore> {
  constructor () {
    super({ templates: [], active: -1 })
  }

  close (idx: number) {
    this.update(v => ({ ...v, templates: splice(v.templates, idx, 1), active: v.active > idx || idx === v.templates.length - 1 ? v.active - 1 : v.active }))
  }

  open (template: DataTemplate) {
    this.update(v => {
      let active = v.templates.findIndex(t => t.id === template.id)
      const templates = [...v.templates]
      if (active === -1) {
        templates.push(template)
        active = templates.length - 1
      }
      return { ...v, templates, active }
    })
  }
}

export const dataListStore = new DataListStore()
export const templateStore = derivedStore(dataListStore, v => v.templates[v.active])
