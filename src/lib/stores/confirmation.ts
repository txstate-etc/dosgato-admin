import { Store } from '@txstate-mws/svelte-store'

interface ConfirmationInfo {
  id: string
  body: string
  html: boolean
  title: string
  yesText: string
  noText: string
}

interface ConfirmationRequest extends ConfirmationInfo {
  resolve: (result: boolean) => void
}

interface IConfirmationStore extends ConfirmationInfo {
  showing: boolean
}

interface ConfirmationOpts {
  /**
   * The body of the confirmation dialog. Example: "Are you sure you want to disable user 'sally123'?"
   */
  body: string
  /**
   * The body will be preserved as html. Be careful to htmlEncode any user input.
   *
   * If this is false the body will still have its line breaks preserved.
   */
  html?: boolean
  /**
   * An identifier for analytics logging. Defaults to `title`.
   */
  id?: string
  /**
   * An optional title to be displayed at the top of the modal.
   */
  title?: string
  /**
   * Text for the yes button. default: 'Continue'
   */
  yesText?: string
  /**
   * Text for the no button. default: 'Cancel'
   */
  noText?: string
}

const DEFAULTS = {
  title: 'Are you sure?',
  yesText: 'Continue',
  noText: 'Cancel'
}
class ConfirmationStore extends Store<IConfirmationStore> {
  private queue: ConfirmationRequest[] = []
  private current: ConfirmationRequest | undefined

  constructor () {
    super({ showing: false, id: DEFAULTS.title, body: '', html: false, title: DEFAULTS.title, yesText: DEFAULTS.yesText, noText: DEFAULTS.noText })
  }

  async confirm (opts: ConfirmationOpts): Promise<boolean> {
    return await new Promise<boolean>(resolve => {
      const request: ConfirmationRequest = {
        body: opts.body,
        html: !!opts.html,
        id: opts.id ?? opts.title ?? DEFAULTS.title,
        title: opts.title ?? DEFAULTS.title,
        yesText: opts.yesText ?? DEFAULTS.yesText,
        noText: opts.noText ?? DEFAULTS.noText,
        resolve
      }
      this.queue.push(request)
      if (!this.current) this.showNext()
    })
  }

  private showNext () {
    this.current = this.queue.shift()
    if (this.current) {
      this.set({
        showing: true,
        id: this.current.id,
        body: this.current.body,
        html: this.current.html,
        title: this.current.title,
        yesText: this.current.yesText,
        noText: this.current.noText
      })
    }
  }

  onConfirm () {
    this.current?.resolve(true)
    this.set({ ...this.value, showing: false })
    this.current = undefined
    this.showNext()
  }

  onCancel () {
    this.current?.resolve(false)
    this.set({ ...this.value, showing: false })
    this.current = undefined
    this.showNext()
  }
}

export const confirmationStore = new ConfirmationStore()
