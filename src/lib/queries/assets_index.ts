import { mutationResponse } from './global'

const assetFolderDetails = `
id
path
name
deleted
folders {
  id
}
assets {
  id
}
permissions {
  create
  update
  move
  delete
  undelete
}
`
export interface TreeAssetFolder {
  id: string
  path: string
  name: string
  deleted: boolean
  folders: {
    id: string
  }[]
  assets: {
    id: string
  }[]
  permissions: {
    create: boolean
    update: boolean
    move: boolean
    delete: boolean
    undelete: boolean
  }
}

const assetDetails = `
id
path
name
filename
deleted
modifiedAt
modifiedBy {
  id
}
mime
size
permissions {
  move
  update
  delete
  undelete
}
`
export interface TreeAsset {
  id: string
  path: string
  name: string
  filename: string
  deleted: boolean
  modifiedAt: string
  modifiedBy: {
    id: string
  }
  mime: string
  size: number
  permissions: {
    move: boolean
    update: boolean
    delete: boolean
    undelete: boolean
  }
}

export const GET_ASSET_ROOTS = `
  query getRootPages {
    sites {
      assetroot {
        ${assetFolderDetails}
      }
    }
  }
`

export const GET_ASSETFOLDER_CHILDREN = `
  query getAssetFolders ($ids: [ID!]) {
    assetfolders (filter:{ ids: $ids }) {
      id
      folders {
        ${assetFolderDetails}
      }
      assets {
        ${assetDetails}
      }
    }
  }
`

export const MOVE_ASSETS = `
  query moveAssets ($ids: [ID], $target: ID) {
    mutation moveAssets TODO
  }
`

export interface CreateAssetFolderInput {
  name: string
  parentId: string
}
export const CREATE_ASSET_FOLDER = `
  mutation createAssetFolder ($args: CreateAssetFolderInput!, $validateOnly: Boolean) {
    createAssetFolder (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
    }
  }
`
