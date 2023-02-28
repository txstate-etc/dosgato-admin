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
export interface TemplateListTemplate {
  type: 'page' | 'component' | 'data'
  name: string
  key: string
  universal: boolean
  global?: boolean
  permissions: {
    setUniversal: boolean
    assign: boolean
  }
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

export const GET_AVAILABLE_TEMPLATE_INFO = `
  query getAvailableTemplateInfo ($keys: [String]) {
    templates (filter: { keys: $keys }) {
      ${templateDetails}
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
