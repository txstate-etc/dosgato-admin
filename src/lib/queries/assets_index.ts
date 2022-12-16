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
assets (filter: { deleted: HIDE }) {
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

const assetDetails = `
id
path
name
filename
deleted
deleteState
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
  deleteState: number
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
      assets (filter: { deleted: HIDE }) {
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
