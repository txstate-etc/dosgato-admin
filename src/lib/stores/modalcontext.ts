import { Store } from '@txstate-mws/svelte-store'
// import { set } from 'txstate-utils'
import { uiLog } from '$lib'
import type { BaseEvent } from '@dosgato/templating'

interface ISuccess { success: boolean }

export interface IModalContextStore <ModalTypes extends string> {
  modal: ModalTypes | undefined
}

/** Store class for tracking modal context and providing support functionality around it.
 * Intended for use as an instance store per modal associative context (group of things
 * you want to have a modal set for).
 * - Can be passed a `target()` callback function for use in getting the associated target
 * string in logging functions.
 * - Can `setModal(...)` `modal` property to any of the string literal types used to create the
 * context instance or `reset()` to the class `default` value.
 * - Constructed with a string literal union list as the type for the `modal` prop and
 * an optional pass in of the `target()` callback.
 * @example
 * // Create a ModalContextStore with 'addFile' as the default modal state.
 * const menuContext = new ModalContextStore<'addFile'|'editFile'>('addFile')
 * menuContext.setModal('print') // error
 * menuContext.setModal('addFile') // OK
 * menuContext.target = () => { return menuTarget.target }
 * menuContext.onModalEscape // handler reference that will:
 * // - log modal escape with the result of menuContext.target()
 * // - default the modal value and inform subscribers */
export class ModalContextStore<ModalTypes extends string> extends Store<IModalContextStore<ModalTypes>> {
  default: ModalTypes | undefined
  targetDescriptor: string | undefined
  target: () => string | undefined

  constructor (defaultModal?: ModalTypes, target?: () => string | undefined) {
    super({ modal: defaultModal })
    this.default = defaultModal
    this.target = target ?? (() => this.targetDescriptor)
  }

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
      eventType: `${this.value.modal ?? 'undefined'}-modal`,
      action: resp.success ? 'Success' : 'Failed',
      ...(additionalProperties && { additionalProperties })
    }
    uiLog.log(logInfo, target)
  }

  /** Handle for generic modal escape handler that logs the escape and resets the modal notifying subscribers. */
  onModalEscape = () => {
    uiLog.log({ eventType: `${this.value.modal ?? 'undefined'}-modal`, action: 'Cancel' }, this.target())
    this.reset()
  }

  /** Sets the modal context and notifies subscribers.
   * - Takes an optional target-descriptor for use if modal is promptly escaped and a custom `target()`
   * function hasn't been supplied. Makes for fewer lines of code than setting it in a global context
   * separate from this `ModalContextStore` and referencing from a custom `target()` but has the same
   * potential drawback of containing whatever was last set if not updated between calls to `reset()`. */
  setModal (modal: ModalTypes, targetDesc?: string) {
    if (targetDesc) this.targetDescriptor = targetDesc
    super.set({ modal })
  }

  /** Resets the modal context to default and notifies subscribers. */
  reset () {
    super.set({ modal: this.default })
    this.targetDescriptor = undefined
  }
}
