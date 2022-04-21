export const GET_GLOBAL_SELF = `
  query getSelf {
    users (filter:{ ids: ["self"] }) {
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
