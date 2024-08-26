import { api } from './api.js'
import { type TagClient } from '@dosgato/dialog'

export class TagClientByLink implements TagClient {
  constructor (public pagetreeId?: string) {}

  async availableForTarget (targetLink: string, publicTags?: boolean) {
    return (await api.getAvailableTagsForLink(targetLink, this.pagetreeId)).filter(g => !publicTags || !g.internal)
  }
}

export class TagClientBySiteId implements TagClient {
  async availableForTarget (siteId: string, publicTags?: boolean) {
    return (await api.getAvailableTags(siteId)).filter(g => !publicTags || !g.internal)
  }
}
export const tagClientBySiteId = new TagClientBySiteId()
