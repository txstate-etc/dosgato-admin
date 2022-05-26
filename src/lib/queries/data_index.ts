import { mutationResponse } from './global'

const templateDetails = `
  name
  key
`
export interface TemplateListTemplate {
  id: string
  name: string
  key: string
}

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
  modifiedAt
  modifiedBy {
    id
  }
  deleted
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
  modifiedAt: string
  modifiedBy: {
    id: string
  }
  deleted: boolean
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
  datafolders: DataFolder[]
  data: DataItem[]
  site?: DataSite
  permissions: {
    create: boolean
  }
}

export const GET_DATA_TEMPLATE_LIST = `
  query getDataTemplateList {
    templates (filter: { types: [DATA] }) {
      ${templateDetails}
    }
  }
`

export const GET_TEMPLATE_INFO = `
  query getTemplateInfo ($key: ID!) {
    templates (filter:{ keys: [$key] }) {
      ${templateDetails}
    }
  }
`

export const GET_AVAILABLE_TEMPLATE_INFO = `
  query getAvailableTemplateInfo ($keys: [String]) {
    templates (filter: { keys: $keys }) {
      ${templateDetails}
    }
  }
`

export const GET_GLOBAL_DATAROOT_BY_TEMPLATE_KEY = `
  query getGlobalDataRootByTemplateKey ($key: ID!) {
    dataroots(filter: {global:true, templateKeys: [$key]}) {
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
    dataroots(filter: {templateKeys: [$key]}) {
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
    dataroots (filter: { siteIds: [$siteId], templateKeys: [$key] }) {
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
  mutation createDataFolder ($args: CreateDataFolderInput!) {
    createDataFolder (args: $args) {
      ${mutationResponse}
      dataFolder {
        ${dataFolderDetails}
      }
    }
  }
`

export const DELETE_DATA_FOLDERS = `
  mutation deleteDataFolders ($folderIds: [ID]!) {
    deleteDataFolders (folderIds: $folderIds) {
      ${mutationResponse}
      dataFolders {
        ${dataFolderDetails}
      }
    }
  }
`

export const RENAME_DATA_FOLDER = `
  mutation renameDataFolder ($folderId: ID!, $name: String!) {
    renameDataFolder (folderId: $folderId, name: $name) {
      ${mutationResponse}
      dataFolder {
        ${dataFolderDetails}
      }
    }
  }
`

export const PUBLISH_DATA_ENTRIES = `
  mutation publishDataEntries ($dataIds: [ID]!) {
    publishDataEntries (dataIds: $dataIds) {
      ${mutationResponse}
    }
  }
`

export const UNPUBLISH_DATA_ENTRIES = `
  mutation unpublishDataEntries ($dataIds: [ID]!) {
    unpublishDataEntries (dataIds: $dataIds) {
      ${mutationResponse}
    }
  }
`

export const CREATE_DATA_ITEM = `
  mutation createDataEntry ($args: CreateDataInput!) {
    createDataEntry (args: $args) {
      ${mutationResponse}
      data {
        ${dataDetails}
      }
    }
  }
`
