import { mutationResponse } from './global'

const templateDetails = `
  type
  name
  key
  universal
  global
  permissions {
    setUniversal
    assign
  }
`

const templateDetailsWithAreas = `
  ${templateDetails}
  areas {
    name
    availableComponents {
      ${templateDetails}
      areas {
        name
      }
    }
  }
`

export interface TemplateListTemplate {
  type: 'PAGE' | 'COMPONENT' | 'DATA'
  id: string
  name: string
  key: string
  universal: boolean
  global?: boolean
  permissions: {
    setUniversal: boolean
    assign: boolean
  }
}

export interface TemplateListTemplateArea {
  id: string
  name: string
  availableComponents: {
    id: string
    key: string
    name: string
    universal: boolean
    global?: boolean
    permissions: {
      setUniversal: boolean
      assign: boolean
    }
    areas: TemplateListTemplateArea[]
  }[]
}

export interface TemplateListTemplateWithAreas extends TemplateListTemplate {
  areas: TemplateListTemplateArea[]
}

export interface TemplateWithPagetrees {
  id: string
  key: string
  pagetrees: {
    id: string
    name: string
    type: string
  }[]
}

export const GET_ALL_TEMPLATES = `
  query getAllTemplates {
    templates {
      ${templateDetails}
    }
  }
`

export const GET_TEMPLATES_BY_TYPE = `
  query getTemplatesByType ($type: TemplateType!, $universal: Boolean) {
    templates (filter: { types: [$type], universal: $universal }) {
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

export const GET_TEMPLATE_DETAIL = `
  query getTemplateDetails ($key: ID!) {
    templates (filter: { keys: [$key] }) {
      ${templateDetailsWithAreas}
    }
  }
`

export const GET_TEMPLATES_WITH_AREAS_BY_TYPE = `
  query getTemplatesWithAreasByType ($type: TemplateType!) {
    templates (filter: { types: [$type] }) {
      ${templateDetailsWithAreas}
    }
  }
`

export const GET_TEMPLATE_AREAS = `
  query getTemplateAreas ($key: ID!) {
    templates (filter: { keys: [$key]}) {
      ${templateDetailsWithAreas}
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

export const GET_TEMPLATE_PAGETREES = `
  query getTemplatePagetrees ($key: ID!) {
    templates (filter: { keys: [$key]}) {
      key
      pagetrees {
        id
        name
        type
      }
    }
  }
`

export const SET_TEMPLATE_UNIVERSAL = `
  mutation setTemplateUniversal ($templateKey: ID!, $universal: Boolean!) {
    setTemplateUniversal (templateId: $templateKey, universal: $universal) {
      ${mutationResponse}
    }
  }
`

export const AUTHORIZE_TEMPLATE_SITE = `
  mutation authorizeTemplateForSite ($templateKey:ID!, $siteId: ID!) {
    authorizeTemplateForSite (templateKey: $templateKey, siteId: $siteId) {
      ${mutationResponse}
    }
  }
`

export const AUTHORIZE_TEMPLATE_PAGETREES = `
  mutation authorizeTemplateForPagetrees($templateKey:ID!, $pagetreeIds: [ID!]!) {
    authorizeTemplateForPagetrees (templateKey: $templateKey, pagetreeIds: $pagetreeIds) {
      ${mutationResponse}
    }
  }
`

export const DEAUTHORIZE_TEMPLATE = `
  mutation deauthorizeTemplate($templateKey:ID!, $siteId: ID!) {
    deauthorizeTemplate(templateKey: $templateKey, siteId: $siteId ) {
      ${mutationResponse}
    }
  }
`
