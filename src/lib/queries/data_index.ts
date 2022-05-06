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
  published
  permissions {
    create
    update
    delete
    publish
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
  permissions {
    create
    update
    delete
    undelete
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
  published: boolean
  publishedAt: string
  permissions: {
    create: boolean
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
  data: {
    id: string
    name: string
  }[]
  permissions: {
    create: boolean
    update: boolean
    delete: boolean
    undelete: boolean
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
      id
      name
      data {
        id
        name
      }
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
