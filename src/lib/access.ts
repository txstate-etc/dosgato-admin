import type { AccessDetailAssetRule, AccessDetailDataRule, AccessDetailPageRule, AccessDetailSiteRule } from '$lib'
import { isNotBlank } from 'txstate-utils'

export interface SiteAccessRole {
  id: string
  name: string
  assetRules: AccessDetailAssetRule[]
  dataRules: AccessDetailDataRule[]
  siteRules: AccessDetailSiteRule[]
  pageRules: AccessDetailPageRule[]
}

type AccessDetailRule = AccessDetailAssetRule | AccessDetailPageRule | AccessDetailSiteRule

const pageperms = ['create', 'move', 'update', 'delete']
const assetperms = ['create', 'move', 'update', 'delete']

export function getSiteAccess (rules: AccessDetailRule[]) {
  let readonly = false
  let limited = false
  let other = false
  const pageperm = pageperms.reduce((acc, curr) => ({ ...acc, [curr]: false }), {})
  const assetperm = assetperms.reduce((acc, curr) => ({ ...acc, [curr]: false }), {})
  for (const rule of rules) {
    if (rule.type === 'SITE') {
      other = true
      continue
    }
    if ((rule as (AccessDetailPageRule | AccessDetailAssetRule)).grants?.view) readonly = true
    if (rule.type === 'PAGE') {
      for (const p of pageperms) {
        if (rule.grants) {
          // if rule has a path it cannot count toward `editor`
          if (rule.grants[p]) limited = true
          if ((rule as AccessDetailPageRule).path === '/') pageperm[p] ||= rule.grants[p]
        }
      }
      if ((rule as AccessDetailPageRule).grants?.undelete) other = true
    } else if (rule.type === 'ASSET') {
      for (const p of assetperms) {
        if (rule.grants) {
          // if rule has a path it cannot count toward `editor`
          if (rule.grants[p]) limited = true
          if ((rule as AccessDetailAssetRule).path === '/') assetperm[p] ||= rule.grants[p]
        }
      }
      if ((rule as AccessDetailAssetRule).grants?.undelete) other = true
    }
  }
  const editor = pageperms.every(p => pageperm[p]) && assetperms.every(p => assetperm[p])
  return [editor ? 'Editor' : (limited ? 'Limited' : (readonly ? 'Read-Only' : '')), other ? 'Other' : ''].filter(isNotBlank)
}

const dataperms = ['create', 'move', 'update', 'delete']

// TODO: This does not take into account whether the data rule applies to a particular site or all sites
export function getDataAccess (rules: AccessDetailDataRule[]) {
  let readonly = false
  let limited = false
  let other = false
  const dataperm = dataperms.reduce((acc, curr) => ({ ...acc, [curr]: false }), {})
  for (const rule of rules) {
    if (rule.grants?.view) readonly = true
    for (const dp of dataperms) {
      if (rule.grants) {
        if (rule.grants[dp]) limited = true
        dataperm[dp] ||= rule.grants[dp]
      }
    }
    if (rule.grants?.undelete) other = true
  }
  const editor = dataperms.every(p => dataperm[p])
  return [editor ? 'Editor' : (limited ? 'Limited' : (readonly ? 'Read-Only' : '')), other ? 'Other' : ''].filter(isNotBlank)
}
