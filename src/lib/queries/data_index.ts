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
  permissions {
    create
    update
    delete
    undelete
    move
  }
`

export enum DataTreeNodeType {
  DATA,
  FOLDER,
  SITE
}

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
  deleteState: number
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

export interface DataSite {
  id: string
  name: string
  data: {
    id: string
    name: string
  }[]
  datafolders: {
    id: string
    name: string
  }[]
}

export interface DataRoot {
  id: string
  datafolders: DataFolder[]
  data: DataItem[]
  site?: DataSite
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

export const GET_GLOBAL_DATAROOT_BY_TEMPLATE_KEY = `
  query getGlobalDataRootByTemplateKey ($key: ID!) {
    dataroots(filter: {global:true, templateKeys: [$key]}) {
      id
      datafolders {
        ${dataFolderDetails}
      }
      data(filter: {root: true}) {
        ${dataDetails}
      }
      permissions {
        create
      }
    }
  }
`

export const GET_SITE_DATAROOTS_BY_TEMPLATE_KEY = `
  query getSiteDataRootsByTemplateKey ($key: ID!) {
    dataroots(filter: {templateKeys: [$key], global: false}) {
      id
      site {
        id
        name
      }
      datafolders {
        id
        name
      }
      data {
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

export const GET_SITE_DATA_BY_TEMPLATE_KEY = `
  query getSiteDataByTemplateKey ($siteId: ID!, $key: ID!) {
    dataroots (filter: { global: false, siteIds: [$siteId], templateKeys: [$key] }) {
      id
      site {
        id
        name
      }
      datafolders {
        ${dataFolderDetails}
      }
      data(filter: { root: true }) {
        ${dataDetails}
      }
      permissions {
        create
      }
    }
  }
`

export const GET_GLOBAL_DATA_ACCESS_BY_TEMPLATE_KEY = `
  query getGlobalDataAccessByTemplateKey ($key: UrlSafeString!) {
    access {
      createGlobalData(type: $key)
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

export const RENAME_DATA = `
  mutation renameDataEntry ($dataId: ID!, $name: UrlSafeString!, $validateOnly: Boolean) {
    renameDataEntry (dataId: $dataId, name: $name, validateOnly: $validateOnly) {
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
