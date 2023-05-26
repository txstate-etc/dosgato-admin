import type { ITreeStore } from '@dosgato/dialog'
import { uiConfig } from '../local'


export interface BaseEvent {
  /** The larger UI area the user is interacting with. Admin or ComponetDialog for instance */
  // May need to do a translation between component id/name to colloquial names.
  eventType: string

  // The specific action the user took. AddPage or SaveComponent for instance
  action: string

  // Additional data points specific to an event. Keep it simple please
  // Not a good place for catch all details, we want to keep the overall structure here
  // efficiently simple so we want to avoid catch all logging in general. This is for
  // additional details we absolutely must have.
  // Whatever we put in here becomes a column in a table in elasticsearch.
  additionalProperties?: Record<string, string | undefined>
}

export interface UserEvent extends BaseEvent {
  // The context in which the action occured. Often a page or compoent path
  // Example: if they're adding a page, where are they adding the page.
  // Set at the big layout level.
  screen: string

  // Each screen needs to set their target for what actions are targetd to.... Page or Component we're operating on.
  target: string
}

/** Rather than determining contextual properties of `UserEvent`s when doing each logging call we're
 * instantiating an InteractionLogger class that can have its `screen`, `target` and `logger` properties
 * reactively set by the pages and screens that have components that make use of the logger. */
class InteractionLogger {
  screen: string | undefined
  target: string | undefined
  logger: (info: any) => void

  log (info: BaseEvent) {
    if (!this.screen) return
    this.logger({ ...info, screen: this.screen, target: this.target ?? '' })
  }

  targetFromTreeStore (state: ITreeStore<any>, prop: string) {
    return state.selectedItems.length > 1 ? 'multiple' : state.selectedItems[0]?.[prop]
  }
}

export const uiLog = new InteractionLogger()
