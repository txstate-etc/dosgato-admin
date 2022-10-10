import type { MutationResponse } from '$lib/api'
import type { PageData } from '@dosgato/templating'

export const EDITOR_PAGE_DETAILS = `
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
`

export const GET_EDITOR_PAGE = `
  query getEditorPage ($id: ID!) {
    pages (filter:{ ids: [$id] }) {
      ${EDITOR_PAGE_DETAILS}
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

export const UPDATE_PAGE = `
  mutation updatePage ($pageId: ID!, $dataVersion: Int!, $data: JsonData!, $validateOnly: Boolean, $comment: String) {
    updatePage (pageId: $pageId, dataVersion: $dataVersion, data: $data, validateOnly: $validateOnly, comment: $comment) {
      success
      page {
        ${EDITOR_PAGE_DETAILS}
      }
      messages {
        arg
        type
        message
      }
    }
  }
`
export interface UpdatePageResponse {
  updatePage: MutationResponse & { page: PageEditorPage }
}
