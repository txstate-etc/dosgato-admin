import type { ITreeStore } from '@dosgato/dialog'
import type { UserEvent } from '@dosgato/templating'
import { environmentConfig } from './stores'
import { isNotEmpty } from 'txstate-utils'

/** A UserEvent without `screen` — callers provide everything else and `uiLog.log()`
 * fills in `screen` from the current SvelteKit route automatically. */
export type LogEvent = Omit<UserEvent, 'screen'>

/** Global singleton for logging user interaction events. `screen` is set reactively
 * in +layout.svelte from `$page.route.id`, and `logger` is set from
 * `uiConfig.uiInteractionsLogger` (or falls back to console.log). Components call
 * `uiLog.log()` for normal events or `uiLog.logRaw()` when they need full control. */
class InteractionLogger {
  screen: string | undefined
  logger: (...args: any[]) => void

  /** Log a user interaction event. Adds `screen` from the current route and delegates
   * to the configured logger. Silently drops events if `screen` has not been set yet
   * (e.g. during initial server-side render). */
  log (event: LogEvent) {
    if (!this.screen) return
    this.logRaw({ ...event, screen: this.screen })
  }

  /** Log a fully formed UserEvent, bypassing automatic `screen` injection. Used for
   * navigation events where the originating screen has already changed by the time
   * the event is recorded. */
  logRaw (event: UserEvent) {
    const { additionalProperties, ...rest } = event
    this.logger({ ...rest, ...(isNotEmpty(additionalProperties) && { additionalProperties }) }, environmentConfig)
  }

  /** Get a human-readable target from a TreeStore's selection. Returns the named
   * property of the single selected item, or `'multiple'` if more than one item
   * is selected. Returns `undefined` if nothing is selected. */
  targetFromTreeStore (state: ITreeStore<any>, prop: string) {
    return state.selectedItems.length > 1 ? 'multiple' : state.selectedItems[0]?.[prop]
  }
}

export const uiLog = new InteractionLogger()
