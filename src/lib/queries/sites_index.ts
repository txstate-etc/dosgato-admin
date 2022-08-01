import { mutationResponse } from './global'

export const siteDetails = `
  id
  name
  url {
    host
    path
    prefix
  }
  organization {
    name
    id
  }
  owner {
    id
    name
  }
  deleted
  permissions {
    delete
    undelete
  }
`

export interface SiteListSite {
  id: string
  name: string
  url: {
    host: string
    path: string
    prefix: string
  }
  organization: {
    name: string
  }
  owner: {
    id: string
    name: string
  }
  deleted: boolean
  permissions: {
    delete: boolean
    undelete: boolean
  }
}

export const fullSiteDetails = `
  id
  name
  url {
    host
    path
    prefix
  }
  organization {
    id
    name
  }
  owner {
    id
    name
  }
  managers {
    id
    name
  }
  pagetrees {
    id
    name
    type
  }
  pageTemplates: templates(filter: {types: [PAGE]}) {
    key
    name
    type
    universal
  }
  componentTemplates: templates(filter: {types: [COMPONENT]}) {
    key
    name
    type
    universal
  }
  comments {
    id
    comment
    createdBy {
      id
    }
    createdAt
  }
  roles {
    id
    name
    groups {
      id
      name
    }
    users {
      id
      name
    }
    assetRules {
      site {
        id
      }
      grants{
        viewForEdit
      }
    }
    dataRules {
      site {
        id
      }
      grants{
        viewForEdit
      }
    }
    pageRules {
      site {
        id
      }
      grants{
        viewForEdit
      }
    }
    siteRules {
      site {
        id
      }
      grants{
        viewForEdit
      }
    }
  }
  permissions {
    rename
    launch
    manageGovernance
    delete
    undelete
    manageState
  }
`

export interface FullSite {
  id: string
  name: string
  url: {
    host: string
    path: string
    prefix: string
  }
  organization: {
    name: string
    id: string
  }
  owner: {
    id: string
    name: string
  }
  managers: {
    id: string
    name: string
  }[]
  pagetrees: {
    id: string
    name: string
    type: string
  }[]
  pageTemplates: {
    key: string
    name: string
    type: string
    universal: boolean
  }[]
  componentTemplates: {
    key: string
    name: string
    type: string
    universal: boolean
  }[]
  comments: {
    id: string
    comment: string
    createdBy: {
      id: string
    }
    createdAt: string
  }[]
  roles: {
    id: string
    name: string
    groups: {
      id
      name
    }[]
    users: {
      id
      name
    }[]
    assetRules: {
      site: {
        id: string
      }
      grants: {
        viewForEdit: boolean
      }
    }[]
    dataRules: {
      site: {
        id: string
      }
      grants: {
        viewForEdit: boolean
      }
    }[]
    pageRules: {
      site: {
        id: string
      }
      grants: {
        viewForEdit: boolean
      }
    }[]
    siteRules: {
      site: {
        id: string
      }
      grants: {
        viewForEdit: boolean
      }
    }[]
  }[]
  permissions: {
    rename: boolean
    launch: boolean
    manageGovernance: boolean
    delete: boolean
    undelete: boolean
    manageState: boolean
  }
}

export const GET_SITE_LIST = `
  query getAllSites {
    sites {
      ${siteDetails}
    }
  }
`

export const GET_SITE_BY_ID = `
  query getSiteById ($siteId: ID!) {
    sites (filter: { ids: [$siteId]}) {
      ${fullSiteDetails}
    }
  }
`

export const RENAME_SITE = `
  mutation renameSite ($siteId: ID!, $name: String!, $validateOnly: Boolean) {
    renameSite (siteId: $siteId, name: $name, validateOnly: $validateOnly) {
      ${mutationResponse}
      site {
        ${siteDetails}
      }
    }
  }
`

export const UPDATE_SITE_MANAGEMENT = `
  mutation updateSiteManagement ($siteId: ID!, $args: UpdateSiteManagementInput!, $validateOnly: Boolean) {
    updateSiteManagement (siteId: $siteId, args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      site {
        ${siteDetails}
      }
    }
  }
`

export const SET_LAUNCH_URL = `
  mutation setLaunchURL ($siteId: ID!, $host: UrlSafeString, $path: UrlSafeString, $validateOnly: Boolean) {
    setLaunchURL (siteId: $siteId, host: $host, path: $path, validateOnly: $validateOnly) {
      ${mutationResponse}
      site {
        ${siteDetails}
      }
    }
  }
`
