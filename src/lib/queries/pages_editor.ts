import type { MutationResponse } from '$lib/api'
import type { DialogPageProp } from '@dosgato/templating'

export const EDITOR_PAGE_DETAILS = `
id
path
name
data
title
published
hasUnpublishedChanges
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
versions {
  version
  date
  tags
  user { id }
}
`

export const GET_EDITOR_PAGE = `
  query getEditorPage ($id: ID!) {
    pages (filter:{ ids: [$id] }) {
      ${EDITOR_PAGE_DETAILS}
    }
  }
`
export interface PageEditorPage extends DialogPageProp {
  name: string
  title?: string
  published: boolean
  hasUnpublishedChanges: boolean
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
  versions: {
    version: number
    date: string
    tags: string[]
    user: {
      id
    }
  }[]
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

export const MOVE_COMPONENT = `
  mutation movePageComponent ($pageId: ID!, $dataVersion: Int!, $schemaversion: DateTime!, $fromPath: String!, $toPath: String!, $comment: String) {
    movePageComponent (pageId: $pageId, dataVersion: $dataVersion, schemaversion: $schemaversion, fromPath: $fromPath, toPath: $toPath, comment: $comment) {
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
export interface MoveComponentResponse {
  movePageComponent: MutationResponse & { page: PageEditorPage }
}

export const CREATE_COMPONENT = `
  mutation createPageComponent ($pageId: ID!, $dataVersion: Int!, $schemaversion: DateTime!, $path: String!, $data: JsonData!, $comment: String, $validateOnly: Boolean) {
    createPageComponent (pageId: $pageId, dataVersion: $dataVersion, schemaversion: $schemaversion, path: $path, data: $data, comment: $comment, validateOnly: $validateOnly) {
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
export interface CreateComponentResponse {
  createPageComponent: MutationResponse & { page: PageEditorPage }
}

export const EDIT_COMPONENT = `
  mutation updatePageComponent ($pageId: ID!, $dataVersion: Int!, $schemaversion: DateTime!, $path: String!, $data: JsonData!, $comment: String, $validateOnly: Boolean) {
    updatePageComponent (pageId: $pageId, dataVersion: $dataVersion, schemaversion: $schemaversion, path: $path, data: $data, comment: $comment, validateOnly: $validateOnly) {
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
export interface EditComponentResponse {
  updatePageComponent: MutationResponse & { page: PageEditorPage }
}

export const EDIT_PAGE_PROPERTIES = `
  mutation updatePageProperties ($pageId: ID!, $dataVersion: Int!, $schemaversion: DateTime!, $data: JsonData!, $comment: String, $validateOnly: Boolean) {
    updatePageProperties (pageId: $pageId, dataVersion: $dataVersion, schemaversion: $schemaversion, data: $data, comment: $comment, validateOnly: $validateOnly) {
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
export interface EditPagePropertiesResponse {
  updatePageProperties: MutationResponse & { page: PageEditorPage }
}

export const REMOVE_COMPONENT = `
  mutation deletePageComponent ($pageId: ID!, $dataVersion: Int!, $schemaversion: DateTime!, $path: String!, $comment: String) {
    deletePageComponent (pageId: $pageId, dataVersion: $dataVersion, schemaversion: $schemaversion, path: $path, comment: $comment) {
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
export interface RemoveComponentResponse {
  deletePageComponent: MutationResponse & { page: PageEditorPage }
}

export const CHANGE_PAGE_TEMPLATE = `
  mutation changePageTemplate ($pageId: ID!, $dataVersion: Int, $templateKey: String!, $comment: String, $validateOnly: Boolean) {
    changePageTemplate (pageId: $pageId, dataVersion: $dataVersion, templateKey: $templateKey, comment: $comment, validateOnly: $validateOnly) {
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
export interface ChangeTemplateResponse {
  changePageTemplate: MutationResponse & { page: PageEditorPage }
}
