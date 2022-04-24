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
