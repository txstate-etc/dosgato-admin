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
  query getTreePages ($ids: [ID]) {
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
