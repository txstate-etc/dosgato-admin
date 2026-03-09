import { Store } from '@txstate-mws/svelte-store'

interface ConfirmationRequest {
  content: string
  title: string
  yesText: string
  noText: string
  resolve: (result: boolean) => void
}

interface IConfirmationStore {
  showing: boolean
  content: string
  title: string
  yesText: string
  noText: string
}

class ConfirmationStore extends Store<IConfirmationStore> {
  private queue: ConfirmationRequest[] = []
  private current: ConfirmationRequest | undefined

  constructor () {
    super({ showing: false, content: '', title: 'Confirm', yesText: 'Continue', noText: 'Cancel' })
  }

  async confirm (content: string, opts?: { title?: string, yesText?: string, noText?: string }): Promise<boolean> {
    return await new Promise<boolean>(resolve => {
      const request: ConfirmationRequest = {
        content,
        title: opts?.title ?? 'Confirm',
        yesText: opts?.yesText ?? 'Continue',
        noText: opts?.noText ?? 'Cancel',
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
        content: this.current.content,
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
