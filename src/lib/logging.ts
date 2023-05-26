import type { ITreeStore } from '@dosgato/dialog'
// import type { BaseEvent } from '@dosgato/templating'
import { environmentConfig } from './stores'

export interface BaseEvent {
  /** The larger UI area the user is interacting with that the event is emitted from.
   * @example 'ActionPanel', 'PageEditor', 'ComponentDialog' */
  eventType: string // How about renaming to `emitterContext`?

  /** The specific action the user took. Typically the label for the element that emits
   * the event.
   * @example 'Add Page', 'Edit Page', 'Preview', 'Cancel Preview' */
  action: string

  /** Additional data points specific to a particular event type's context. These should
   * be significant enough to understanding the event to merrit adding additional columns
   * in tools like elastic-search.
   * @warning This is NOT a catch-all property.
   * @example { hiddenLabel: action.hiddenLabel } // The aria label for an action element. */
  additionalProperties?: Record<string, string | undefined>
}

/** Events triggered by user interactions with interface elements in DosGato. This interface
 * is intended to provide a common model for succinctly expressing the contextually important
 * properties of these events to loggers that can be pointed to analytics and metrics services. */
export interface UserEvent extends BaseEvent {
  /** The page, screen, or dialog the user is looking at in which the associated event emitter is
   * in context to.
   * @example '/pages', '/pages/[id]', '/pages/[id]/dialog' */
  screen: string

  /** The target the emitted event is to trigger actions on.
   * Each page/screen, or dialog, needs to set their target for what events in it are targeted
   * to act on in in its context.
   *
   * For example: The page in the page tree of the Pages screen that ActionPanel actions,
   * such as edit or preview, will act on.
   * @example '/site3-sandbox/about' */
  target: string
}

/** Rather than determining contextual properties of `UserEvent`s when doing each logging call we're
 * instantiating an InteractionLogger class that can have its `screen`, `target` and `logger` properties
 * reactively set by the pages and screens that have components that make use of the logger. */
class InteractionLogger {
  screen: string | undefined
  target: string | undefined
  logger: (...args: any[]) => void

  log (info: BaseEvent) {
    // Don't log anything if we've been asked to log without a screen defined to give context.
    if (!this.screen) return
    const logInfo = { ...info, screen: this.screen, target: this.target ?? '' }
    if (this.logger === console.log) {
      this.logger(logInfo)
    } else this.logger(logInfo, environmentConfig)
  }

  targetFromTreeStore (state: ITreeStore<any>, prop: string) {
    return state.selectedItems.length > 1 ? 'multiple' : state.selectedItems[0]?.[prop]
  }
}

export const uiLog = new InteractionLogger()
