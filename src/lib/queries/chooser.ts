const chooserPageDetails = `
id
name
path
title
`

export const GET_SUBPAGES_BY_PATH = `
  query getPagesByPath ($path: String!) {
    pages (filter: { parentPaths: [$path] }) {
      ${chooserPageDetails}
    }
  }
`

export interface ChooserPageDetails {
  id: string
  name: string
  path: string
  title?: string
}

export interface GetSubPagesByPath {
  pages: ChooserPageDetails[]
}

export const GET_SUBFOLDERS_AND_ASSETS_BY_PATH = `
  query getPagesByPath ($path: String!) {
    assets (filter: { parentPaths: [$path] }) {
      id
      name
      path
      size
      mime
    }
    assetfolders (filter: { parentPaths: [$path] }) {
      id
      name
      path
      permissions {
        create
      }
    }
  }
`

export interface GetSubFoldersAndAssetsByPath {
  assets: {
    id: string
    name: string
    path: string
    size: number
    mime: string
  }[]
  assetfolders: {
    id: string
    name: string
    path: string
    permissions: {
      create: boolean
    }
  }[]
}

export const GET_PAGE_BY_LINK = `
  query getPageByLink ($linkId: String!, $path: String!) {
    pages (filter: { links: [{ linkId: $linkId, path: $path }] }) {
      ${chooserPageDetails}
    }
  }
`

export interface GetPageByLink {
  pages: [ChooserPageDetails]
}
