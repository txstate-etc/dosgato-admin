const pageDetails = `
id
path
name
data
title
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
  title?: string
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
