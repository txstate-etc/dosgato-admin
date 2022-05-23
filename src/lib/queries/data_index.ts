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

export const GET_DATA_TEMPLATE_LIST = `
  query getDataTemplateList {
    templates (filter: { types: [DATA] }) {
      ${templateDetails}
    }
  }
`

export const GET_TEMPLATE_INFO = `
  query getTemplateInfo ($key: String) {
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

export const GET_GLOBAL_DATAFOLDERS_BY_TEMPLATE_KEY = `
  query getGlobalDataFolders ($key: String) {
    datafolders (filter: { global: true, templateKeys: [$key] }) {
      ${dataFolderDetails}
    }
  }
`

export const GET_GLOBAL_DATA_BY_TEMPLATE_KEY = `
  query getGlobaDataByTemplateKey ($key: String) {
    data (filter: { global: true, templateKeys: [$key] }) {
      ${dataDetails}
    }
  }
`

export const GET_SITES_AND_DATA = `
  query getSitesAndData ($key: String) {
    sites {
      id
      name
      data(filter: {templateKeys:[$key]}) {
        id
        name
      }
      datafolders(filter: {templateKeys:[$key]}) {
        id
        name
      }
    }
  }
`

export const GET_DATA_BY_DATAFOLDER_ID = `
  query getDataByDatafolderId ($id: String) {
    data (filter: { folderIds: [$id]}) {
      ${dataDetails}
    }
  }
`

export const GET_DATAFOLDERS_BY_SITE_ID = `
  query getDataFoldersBySiteId ($id: String, $key: String) {
    datafolders (filter: { templateKeys:[$key], siteIds: [$id]}) {
      ${dataFolderDetails}
    }
  }
`

export const GET_DATA_BY_SITE_ID = `
  query getDataBySiteId ($id: String, $key: String) {
    data (filter: { templateKeys:[$key], siteIds: [$id]}) {
      ${dataDetails}
    }
  }
`

export const GET_GLOBAL_DATA_ACCESS_BY_TEMPLATE_KEY = `
  query getGlobalDataAccessByTemplateKey ($key: String) {
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
