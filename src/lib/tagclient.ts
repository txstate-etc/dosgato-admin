import { api } from './api.js'
import { type TagClient } from '@dosgato/dialog'
import { unique } from 'txstate-utils'

export class TagClientByLink implements TagClient {
  constructor (public pagetreeId?: string) {}

  async availableForTarget (targetLink: string, publicTags?: boolean)
  async availableForTarget (targetLinks: string[], publicTags?: boolean)
  async availableForTarget (targetLink: unknown, publicTags?: boolean) {
    if (Array.isArray(targetLink)) {
      const tags = await Promise.all(targetLink.map(async link => (await api.getAvailableTagsForLink(link, this.pagetreeId)).filter(g => !publicTags || !g.internal)))
      return unique(tags.flat())
    } else if (typeof targetLink === 'string') {
      return (await api.getAvailableTagsForLink(targetLink, this.pagetreeId)).filter(g => !publicTags || !g.internal)
    }
    return []
  }
}

export class TagClientBySiteId implements TagClient {
  async availableForTarget (siteId: string, publicTags?: boolean) {
    return (await api.getAvailableTags(siteId)).filter(g => !publicTags || !g.internal)
  }
}
export const tagClientBySiteId = new TagClientBySiteId()
