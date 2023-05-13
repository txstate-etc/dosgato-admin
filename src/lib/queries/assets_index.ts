import { mutationResponse } from './global'

const assetFolderDetails = `
id
path
name
deleted
deleteState
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
  deleteState: number
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

export interface RootAssetFolder extends TreeAssetFolder {
  pagetree: {
    id: string
    type: 'PRIMARY' | 'SANDBOX' | 'ARCHIVE'
    name: string
  }
  site: {
    id: string
    name: string
  }
}

const assetDetails = `
id
path
name
checksum
filename
extension
deleted
deleteState
modifiedAt
modifiedBy {
  id
}
mime
size
box {
  width
  height
}
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
  checksum: string
  filename: string
  extension: string
  deleted: boolean
  deleteState: number
  modifiedAt: string
  modifiedBy: {
    id: string
  }
  mime: string
  size: number
  box?: {
    width: number
    height: number
  }
  permissions: {
    move: boolean
    update: boolean
    delete: boolean
    undelete: boolean
  }
}

export const GET_ASSET_ROOTS = `
  query getRootAssetFolders {
    assetfolders (filter: { root: true }) {
      ${assetFolderDetails}
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
      assetFolder { ${assetFolderDetails} }
    }
  }
`
export const RENAME_ASSET_FOLDER = `
  mutation renameAssetFolder ($folderId: ID!, $name: UrlSafeString!, $validateOnly: Boolean) {
    renameAssetFolder (folderId: $folderId, name: $name, validateOnly: $validateOnly) {
      ${mutationResponse}
      assetFolder { ${assetFolderDetails} }
    }
  }
`

export const DELETE_ASSET = `
  mutation deleteAsset ($assetId: ID!) {
    deleteAsset (assetId: $assetId) {
      ${mutationResponse}
      asset { ${assetDetails}}
    }
  }
 `

export const FINALIZE_DELETE_ASSET = `
  mutation finalizeAssetDeletion ($assetId: ID!) {
    finalizeAssetDeletion (assetId: $assetId) {
      ${mutationResponse}
      asset { ${assetDetails}}
    }
  }
`

export const UNDELETE_ASSET = `
  mutation undeleteAsset ($assetId: ID!) {
    undeleteAsset (assetId: $assetId) {
      ${mutationResponse}
      asset { ${assetDetails}}
    }
  }
`

export const DELETE_ASSET_FOLDER = `
  mutation deleteAssetFolder ($folderId: ID!) {
    deleteAssetFolder (folderId: $folderId) {
      ${mutationResponse}
      assetFolder { ${assetFolderDetails} }
    }
  }
`

export const FINALIZE_DELETE_ASSET_FOLDER = `
  mutation finalizeAssetFolderDeletion ($folderId: ID!) {
    finalizeAssetFolderDeletion (folderId: $folderId) {
      ${mutationResponse}
      assetFolder { ${assetFolderDetails} }
    }
  }
`

export const UNDELETE_ASSET_FOLDER = `
  mutation undeleteAssetFolder ($folderId: ID!) {
    undeleteAssetFolder (folderId: $folderId) {
      ${mutationResponse}
      assetFolder { ${assetFolderDetails} }
    }
  }
`
