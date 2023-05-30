import type { ITreeStore } from '@dosgato/dialog'
import type { BaseEvent } from '@dosgato/templating'
import { environmentConfig } from './stores'

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
