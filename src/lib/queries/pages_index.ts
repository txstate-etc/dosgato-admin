const pageDetails = `
id
path
name
modifiedAt
modifiedBy {
  id
}
children {
  id
}
`

export interface TreePage {
  id: string
  path: string
  name: string
  modifiedAt: string
  modifiedBy: {
    id: string
  }
  children: {
    id: string
  }[]
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
