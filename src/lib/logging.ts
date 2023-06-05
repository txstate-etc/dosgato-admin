import type { ITreeStore } from '@dosgato/dialog'
import type { BaseEvent } from '@dosgato/templating'
import { environmentConfig } from './stores'

/** Rather than determining contextual properties of `UserEvent`s when doing each logging call we're
 * instantiating a global InteractionLogger class that can have its `screen` and `logger` properties
 * set by the pages and screens that have components that make use of the logger. */
class InteractionLogger {
  screen: string | undefined
  logger: (...args: any[]) => void

  log (info: BaseEvent, target?: string) {
    // Don't log anything if we've been asked to log without a screen defined to give context.
    if (!this.screen) return
    const logInfo = target ? { ...info, screen: this.screen, target } : { ...info, screen: this.screen }
    this.logger(logInfo, environmentConfig)
  }

  /** Convenience function for handling how to get a target from a TreeStore by prop-name. */
  targetFromTreeStore (state: ITreeStore<any>, prop: string) {
    return state.selectedItems.length > 1 ? 'multiple' : state.selectedItems[0]?.[prop]
  }
}

export const uiLog = new InteractionLogger()
