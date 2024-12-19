import type { DeleteState } from '$lib'
import { mutationResponse } from './global'
import type { DataData } from '@dosgato/templating'

const dataDetails = `
  id
  name
  site {
    id
    name
  }
  folder {
    id
    name
  }
  data
  modifiedAt
  modifiedBy {
    id
  }
  deleted
  deleteState
  published
  publishedAt
  permissions {
    update
    delete
    undelete
    publish
    unpublish
    move
  }
`

const dataFolderDetails = `
  id
  name
  data {
    id
    name
  }
  deleted
  deleteState
  permissions {
    create
    update
    delete
    undelete
    move
  }
`

export interface DataItem {
  id: string
  name: string
  site?: {
    id: string
    name: string
  }
  folder?: {
    id: string
    name: string
  }
  data: DataData
  modifiedAt: string
  modifiedBy: {
    id: string
  }
  deleted: boolean
  deleteState: DeleteState
  published: boolean
  publishedAt: string
  permissions: {
    update: boolean
    delete: boolean
    undelete: boolean
    publish: boolean
    unpublish: boolean
    move: boolean
  }
}

export interface DataFolder {
  id: string
  name: string
  deleted: boolean
  deleteState: DeleteState
  data: {
    id: string
    name: string
  }[]
  permissions: {
    create: boolean
    update: boolean
    delete: boolean
    undelete: boolean
    move: boolean
  }
}

export interface DataRoot {
  id: string
  datafolders: DataFolder[]
  data: DataItem[]
  site?: {
    id: string
    name: string
  }
  permissions: {
    create: boolean
  }
}

export interface DataWithData {
  id: string
  name: string
  data: DataData
  version: {
    version: number
  }
}

export const GET_DATAROOTS_BY_TEMPLATE_KEY = `
  query getSiteDataRootsByTemplateKey ($key: ID!) {
    dataroots(filter: {templateKeys: [$key], viewForEdit: true }) {
      id
      site {
        id
        name
      }
      datafolders {
        id
        name
      }
      data (filter: { root: true }) {
        id
        name
      }
      permissions {
        create
      }
    }
  }
`

export const GET_DATA_BY_DATAFOLDER_ID = `
  query getDataByDatafolderId ($id: String!) {
    data (filter: { folderIds: [$id]}) {
      ${dataDetails}
    }
  }
`

export const GET_DATA_BY_ROOT_ID = `
  query getSiteDataByTemplateKey ($id: ID!) {
    dataroots (filter: { ids: [$id] }) {
      id
      datafolders {
        ${dataFolderDetails}
      }
      data(filter: { root: true }) {
        ${dataDetails}
      }
    }
  }
`

export const GET_VIEWFOREDIT_DATATEMPLATES = `
  query getViewForEditDataTemplates {
    dataroots (filter:{viewForEdit: true }) {
      template { key }
    }
  }
`

export const CREATE_DATA_FOLDER = `
  mutation createDataFolder ($args: CreateDataFolderInput!, $validateOnly: Boolean) {
    createDataFolder (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      dataFolder {
        ${dataFolderDetails}
      }
    }
  }
`

export const DELETE_DATA_FOLDERS = `
  mutation deleteDataFolders ($folderIds: [ID!]!) {
    deleteDataFolders (folderIds: $folderIds) {
      ${mutationResponse}
      dataFolders {
        ${dataFolderDetails}
      }
    }
  }
`

export const RENAME_DATA_FOLDER = `
  mutation renameDataFolder ($folderId: ID!, $name: UrlSafeString!) {
    renameDataFolder (folderId: $folderId, name: $name) {
      ${mutationResponse}
      dataFolder {
        ${dataFolderDetails}
      }
    }
  }
`

export const MOVE_DATA_FOLDERS = `
  mutation moveDataFolders ($folderIds: [ID!]!, $siteId: ID) {
    moveDataFolders (folderIds: $folderIds, siteId: $siteId) {
      ${mutationResponse}
      dataFolders {
        ${dataFolderDetails}
      }
    }
  }
`

export const UNDELETE_DATA_FOLDERS = `
  mutation undeleteDataFolders ($folderIds: [ID!]!) {
    undeleteDataFolders (folderIds: $folderIds) {
      ${mutationResponse}
      dataFolders {
        ${dataFolderDetails}
      }
    }
  }
`

export const FINALIZE_DATA_FOLDER_DELETION = `
  mutation finalizeDataFolderDeletion ($folderIds: [ID!]!) {
    finalizeDataFolderDeletion (folderIds: $folderIds) {
      ${mutationResponse}
      dataFolders {
        ${dataFolderDetails}
      }
    }
  }
`

export const PUBLISH_DATA_ENTRIES = `
  mutation publishDataEntries ($dataIds: [ID!]!) {
    publishDataEntries (dataIds: $dataIds) {
      ${mutationResponse}
    }
  }
`

export const UNPUBLISH_DATA_ENTRIES = `
  mutation unpublishDataEntries ($dataIds: [ID!]!) {
    unpublishDataEntries (dataIds: $dataIds) {
      ${mutationResponse}
    }
  }
`

export const CREATE_DATA_ITEM = `
  mutation createDataEntry ($args: CreateDataInput!, $validateOnly: Boolean) {
    createDataEntry (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      data {
        ${dataDetails}
      }
    }
  }
`

export const GET_DATA_BY_ID = `
  query getDataById ($id: ID!) {
    data (filter: { ids: [$id]}) {
      id
      name
      data
      version {
        version
      }
    }
  }
`

export const UPDATE_DATA = `
  mutation updateDataEntry ($dataId: ID!, $args: UpdateDataInput!, $validateOnly: Boolean) {
    updateDataEntry (dataId: $dataId, args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      data {
        ${dataDetails}
      }
    }
  }
`

export const DELETE_DATA = `
  mutation deleteDataEntries ($dataIds: [ID!]!) {
    deleteDataEntries (dataIds: $dataIds) {
      ${mutationResponse}
      data {
        ${dataDetails}
      }
    }
  }
`

export const PUBLISH_DATA_DELETION = `
  mutation publishDataEntryDeletions ($dataIds: [ID!]!) {
    publishDataEntryDeletions (dataIds: $dataIds) {
      ${mutationResponse}
      data {
        ${dataDetails}
      }
    }
  }
`

export const UNDELETE_DATA = `
  mutation undeleteDataEntries ($dataIds: [ID!]!) {
    undeleteDataEntries (dataIds: $dataIds) {
      ${mutationResponse}
      data {
        ${dataDetails}
      }
    }
  }
`

export interface MoveDataTarget {
  aboveTarget?: string
  siteId?: string
  folderId?: string
}

export const MOVE_DATA = `
  mutation moveDataEntries ($dataIds: [ID!]!, $target: MoveDataTarget!) {
    moveDataEntries (dataIds: $dataIds, target: $target) {
      ${mutationResponse}
      data {
        ${dataDetails}
      }
    }
  }
`
