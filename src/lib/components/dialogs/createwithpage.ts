import type { PageData } from '@dosgato/templating'

interface PageProperties extends PageData {}

export interface CreateWithPageState {
  name: string
  templateKey: string
  data: PageProperties
}
