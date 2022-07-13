import type { PageData } from '@dosgato/templating'

export const GET_EDITOR_PAGE = `
  query getEditorPage ($id: ID!) {
    pages (filter:{ ids: [$id] }) {
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
      version {
        version
      }
    }
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
  version: {
    version: number
  }
}

export const GET_AVAILABLE_COMPONENTS = `
  query getAvailableComponents ($templateKey: ID!, $pageId: ID!) {
    templates (filter: { keys: [$templateKey] }) {
      areas {
        name
        availableComponents {
          key
          name
          permissions {
            useOnPage (pageId: $pageId)
          }
        }
      }
    }
  }
`
export interface TemplateArea {
  name: string
  availableComponents: {
    key: string
    name: string
    permissions: {
      useOnPage: boolean
    }
  }[]
}
export interface GetAvailableComponents {
  templates: [{
    areas: TemplateArea[]
  }]
}
