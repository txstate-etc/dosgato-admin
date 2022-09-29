import { mutationResponse } from './global'

const pageDetails = `
id
path
name
title
template {
  name
}
modifiedAt
modifiedBy {
  id
}
published
publishedAt
children {
  id
}
permissions {
  create
  update
  publish
  move
  delete
}
`

export interface TreePage {
  id: string
  path: string
  name: string
  title?: string
  template?: {
    name: string
  }
  modifiedAt: string
  modifiedBy: {
    id: string
  }
  published: boolean
  publishedAt: string
  children: {
    id: string
  }[]
  permissions: {
    create: boolean
    update: boolean
    publish: boolean
    move: boolean
    delete: boolean
  }
}

export const GET_ROOT_PAGES = `
  query getRootPages {
    sites {
      pageroot {
        ${pageDetails}
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

export const MOVE_PAGES = `
  query movePages ($ids: [ID], $target: ID) {
    mutation movePages TODO
  }
`

export const CREATE_PAGE = `
  mutation createPage ($name: UrlSafeString!, $data: JsonData!, $targetId: ID!, $above: Boolean, $validate: Boolean) {
    createPage (name: $name, data: $data, targetId: $targetId, above: $above, validate: $validate) {
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

export const COPY_PAGES = `
  mutation copyPages ($pageIds: [ID!]!, $targetId: ID!, $above: Boolean, $includeChildren: Boolean) {
    copyPages (pageIds: $pageIds, targetId: $targetId, above: $above, includeChildren: $includeChildren) {
      ${mutationResponse}
      page {
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
