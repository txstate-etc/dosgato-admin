import { mutationResponse } from './global'

const pageDetails = `
id
path
name
title
template {
  key
  name
}
modifiedAt
modifiedBy {
  id
}
published
publishedAt
deleteState
children {
  id
}
permissions {
  create
  update
  publish
  move
  delete
  undelete
  unpublish
}
`

export interface TreePage {
  id: string
  path: string
  name: string
  title?: string
  template?: {
    key: string
    name: string
  }
  modifiedAt: string
  modifiedBy: {
    id: string
  }
  published: boolean
  publishedAt: string
  deleteState: number
  children: {
    id: string
  }[]
  permissions: {
    create: boolean
    update: boolean
    publish: boolean
    move: boolean
    delete: boolean
    undelete: boolean
    unpublish: boolean
  }
}

export type PagetreeTypes = 'PRIMARY' | 'SANDBOX' | 'ARCHIVE'

export interface RootTreePage extends TreePage {
  pagetree: {
    type: PagetreeTypes
    name: string
  }
}

export const GET_ROOT_PAGES = `
  query getRootPages {
    sites {
      pagetrees {
        rootPage {
          ${pageDetails}
          pagetree {
            type
            name
          }
        }
      }
    }
  }
`

export const GET_TREE_PAGES = `
  query getTreePages ($ids: [ID!]) {
    pages (filter:{ ids: $ids }) {
      id
      children {
        ${pageDetails}
      }
    }
  }
`

export const CREATE_PAGE = `
  mutation createPage ($name: UrlSafeString!, $data: JsonData!, $targetId: ID!, $above: Boolean, $validateOnly: Boolean) {
    createPage (name: $name, data: $data, targetId: $targetId, above: $above, validateOnly: $validateOnly) {
      ${mutationResponse}
      page {
        ${pageDetails}
      }
    }
  }
`

export const RENAME_PAGE = `
  mutation renamePage ($pageId: ID!, $name: UrlSafeString!, $validateOnly: Boolean) {
    renamePage (pageId: $pageId, name: $name, validateOnly: $validateOnly) {
      ${mutationResponse}
      page {
        ${pageDetails}
      }
    }
  }
`

export const MOVE_PAGES = `
  mutation movePages ($pageIds: [ID!]!, $targetId: ID!, $above: Boolean) {
    movePages (pageIds: $pageIds, targetId: $targetId, above: $above) {
      ${mutationResponse}
    }
  }
`

export const COPY_PAGES = `
  mutation copyPages ($pageIds: [ID!]!, $targetId: ID!, $above: Boolean, $includeChildren: Boolean) {
    copyPages (pageIds: $pageIds, targetId: $targetId, above: $above, includeChildren: $includeChildren) {
      ${mutationResponse}
    }
  }
`

export const PUBLISH_PAGES = `
  mutation publishPages($pageIds: [ID!]!, $includeChildren: Boolean) {
    publishPages (pageIds: $pageIds, includeChildren: $includeChildren) {
      ${mutationResponse}
    }
  }
`

export const UNPUBLISH_PAGES = `
  mutation unpublishPages($pageIds: [ID!]!) {
    unpublishPages (pageIds: $pageIds) {
      ${mutationResponse}
    }
  }
`

export const DELETE_PAGES = `
  mutation deletePages($pageIds: [ID!]!) {
    deletePages (pageIds: $pageIds) {
      ${mutationResponse}
      pages {
        ${pageDetails}
      }
    }
  }
`

export const PUBLISH_DELETION = `
  mutation publishPageDeletions($pageIds: [ID!]!) {
    publishPageDeletions (pageIds: $pageIds) {
      ${mutationResponse}
      pages {
        ${pageDetails}
      }
    }
  }
`

export const UNDELETE_PAGES = `
  mutation undeletePages($pageIds: [ID!]!, $includeChildren: Boolean) {
    undeletePages (pageIds: $pageIds, includeChildren: $includeChildren) {
      ${mutationResponse}
      pages {
        ${pageDetails}
      }
    }
  }
`

const pageWithTemplates = `
  id
  templates(filter: { types: [PAGE] }) {
    key
    name
  }
`

export interface PageWithTemplates {
  id: string
  templates: {
    key: string
    name: string
    type: string
  }[]
}

// used when creating a page to get the allowed templates. Based on what's allowed for the target page (parent or sibling)
export const GET_TEMPLATES_BY_PAGE = `
  query getTemplatesByPage ($pageId: ID!) {
    pages (filter: { ids: [$pageId]}) {
      ${pageWithTemplates}
    }
  }
`
