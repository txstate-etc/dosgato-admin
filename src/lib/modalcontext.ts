
import type { BaseEvent } from '@dosgato/templating'
import { uiLog } from './logging'

interface ISuccess { success: boolean }
/** Class for tracking tracking modal context and providing support functionality around it.
 * Intended for use as a global instance object per modal associative context (group of things
 * you want to have modals for).
 * - Can be passed a `target()` callback function for use in getting the associated target
 * string in logging functions.
 * - Can assign `modal` property to any of the string literal types used to create the
 * context instance, OR `undefined` the property.
 * - Constructed with a string literal union list as the type for the `modal` prop and
 * an optional pass in of the `target()` callback.
 * @example
 * const menuContext = new ModalContext<'addFile'|'editFile'>()
 * menuContext.modal = 'print' // error
 * menuContext.modal = 'addFile' // OK
 * menuContext.target = () => { return menuTarget.target }
 * menuContext.onModalEscape // handler reference that will:
 * // - log modal escape with the result of menuContext.target()
 * // - undefine the modal value */
export class ModalContext <ModalTypes extends Exclude<string, ModalTypes>> {
  modal: ModalTypes | undefined
  target: () => string | undefined

  /** Convenience function for logging response information associated with an action triggered by a
   * modal.
   * - `target` will not default to the value of the `target()` callback as its role in this use
   * case is to log the resulting target of the associated action response and not the target the
   * action was initiated on. For instance, adding a new target folder under the initial target
   * folder. It's perfectly acceptable however to pass the initial target as the arg to `target`
   * here as the action's response target may be one and the same.
   * - `additionalProperties` is a good location to put info needed for the action, including
   * the initial target in cases where the action response ends up acting on a different target. */
  logModalResponse<R extends ISuccess> (resp: R, target?: string, additionalProperties?: Record<string, string | undefined>) {
    // Conditional use of the spread operator will only add additionalProperties if defined.
    const logInfo: BaseEvent = {
      eventType: `${this.modal ?? 'undefined'}-modal`,
      action: resp.success ? 'Success' : 'Failed',
      ...(additionalProperties && { additionalProperties })
    }
    uiLog.log(logInfo, target)
  }

  /** Handle for generic modal escape handler that logs the escape and undefines `modal`. */
  onModalEscape = () => {
    uiLog.log({ eventType: `${this.modal ?? 'undefined'}-modal`, action: 'Cancel' }, this.target())
    this.modal = undefined
  }

  constructor (target?: () => string | undefined) {
    this.target = target ?? (() => undefined)
  }
}
