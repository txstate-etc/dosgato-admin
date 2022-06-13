import type { PageData } from '@dosgato/templating'

const pageDetails = `
id
path
name
data
title
pagetree {
  id
}
template {
  name
}
permissions {
  update
}
`

export interface PageEditorPage {
  id: string
  path: string
  name: string
  data: PageData
  title?: string
  pagetree: {
    id: string
  }
  template?: {
    name: string
  }
  permissions: {
    update: boolean
  }
}

export const GET_EDITOR_PAGE = `
  query getEditorPage ($id: ID!) {
    pages (filter:{ ids: [$id] }) {
      ${pageDetails}
    }
  }
`
