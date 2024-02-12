import type { IconifyIcon } from '@iconify/svelte'
import { Store, derivedStore } from '@txstate-mws/svelte-store'
export interface ActionPanelAction {
  // an id for the action in case you have two complementary actions like delete and undelete
  // where one is always hidden and the other is shown
  id?: string
  label: string
  class?: string
  hiddenLabel?: string
  icon?: IconifyIcon
  iconWidth?: number
  disabled?: boolean
  onClick: () => void | Promise<void>
}

export interface ActionPanelGroup {
  id: string
  actions: ActionPanelAction[]
}

export interface IActionPanelStore {
  wantsToBeHidden: boolean
  eligibleToBeHidden: boolean
  isHidden: boolean
  userHasInteracted: boolean
}
class ActionPanelStore extends Store<IActionPanelStore> {
  set (value: IActionPanelStore) {
    super.set({ ...value, isHidden: value.wantsToBeHidden && value.eligibleToBeHidden })
  }

  hidden = derivedStore(this, 'isHidden')

  hide () {
    this.update(s => ({ ...s, wantsToBeHidden: true, userHasInteracted: true }))
  }

  show () {
    this.update(s => ({ ...s, wantsToBeHidden: false, userHasInteracted: true }))
  }

  toggle () {
    this.update(s => ({ ...s, wantsToBeHidden: !s.wantsToBeHidden, userHasInteracted: true }))
  }
}

export const actionPanelStore = new ActionPanelStore({ wantsToBeHidden: true, eligibleToBeHidden: false, isHidden: false, userHasInteracted: false })
