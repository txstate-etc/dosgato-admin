import { Store } from '@txstate-mws/svelte-store'

interface ITopSearchStore {
  show: boolean // Whether to show the search input at all
  searchInput: string
  placeholder: string
  asYouType: boolean
}

export class TopSearchStore extends Store<ITopSearchStore> {
  public topSearchFn: ((search: string) => void) | null = null
  constructor () {
    super({ show: true, searchInput: '', placeholder: 'Search...', asYouType: false })
  }

  reset () {
    this.update(v => ({ ...v, searchInput: '' }))
  }
}

export const topSearchStore = new TopSearchStore()

