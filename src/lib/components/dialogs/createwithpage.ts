import type { PageData } from '@dosgato/templating'

export interface CreateWithPageState {
  name: string
  templateKey: string
  data: PageData
}
