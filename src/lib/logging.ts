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

class InteractionLogger {
  screen: string | undefined
  target: string | undefined
  log (info: BaseEvent) {
    if (!this.screen) return
    console.log({ ...info, screen: this.screen, target: this.target })
    uiConfig.uiInteractionsLogger?.({ ...info, screen: this.screen, target: this.target })
  }
}

export const uiLog = new InteractionLogger()
