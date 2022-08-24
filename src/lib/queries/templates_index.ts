import { mutationResponse } from './global'

const templateDetails = `
  name
  key
  universal
`
export interface TemplateListTemplate {
  id: string
  name: string
  key: string
  universal: boolean
  permissions: {
    setUniversal: boolean
  }
}

export const GET_ALL_TEMPLATES = `
  query getAllTemplates {
    templates {
      name
      key
      universal
      permissions {
        setUniversal
      }
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
