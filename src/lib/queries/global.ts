export const GET_GLOBAL_SELF = `
  query getSelf {
    users (filter:{ ids: ["self"], enabled: true }) {
      name
    }
    access {
      viewAssetManager
      viewDataManager
      viewGroupManager
      viewPageManager
      viewRoleManager
      viewSiteManager
      createSites
      createUsers
    }
  }
`

export interface GlobalSelf {
  users: [{
    name: string
  }]
  access: {
    viewAssetManager: boolean
    viewDataManager: boolean
    viewGroupManager: boolean
    viewPageManager: boolean
    viewRoleManager: boolean
    viewSiteManager: boolean
    createSites: boolean
    createUsers: boolean
  }
}

export const mutationResponse = `
  success
  messages {
    arg
    message
    type
  }
`

export interface MessageFromAPI {
  arg: string
  message: string
  type: 'error' | 'warning' | 'success'
}
