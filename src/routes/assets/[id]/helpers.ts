import { iconForMime } from '@dosgato/dialog'
import { base } from '$app/paths'
import { api, subnavStore, type PagetreeTypes } from '$lib'
import type { AssetData } from '@dosgato/templating'

export interface AssetDetail {
  id: string
  name: string
  filename: string
  uploadedFilename: string
  createdAt: string
  createdBy: { id: string, name: string }
  modifiedAt: string
  modifiedBy: { id: string, name: string }
  path: string
  size: number
  mime: string
  checksum: string
  data: AssetData
  box?: {
    width: number
    height: number
  }
  resizes: {
    id: string
    width: number
    height: number
    mime: string
    extension: string
    size: number
  }[]
  pagetree: {
    type: PagetreeTypes
  }
  corrupt: boolean
}

export async function getAssetDetail (id: string) {
  const { assets } = await api.query<{ assets: AssetDetail[] }>(`
    query getAssetDetail ($id: ID!) {
      assets (filter: { ids: [$id] }) {
        id
        name
        filename
        uploadedFilename
        createdAt
        createdBy { id name }
        modifiedAt
        modifiedBy { id name }
        path
        size
        mime
        checksum
        data
        box { width height }
        resizes { id width height mime extension size }
        pagetree { type }
        corrupt
      }
    }
  `, { id })
  const asset = assets[0]
  if (asset) subnavStore.open('assets', { href: `${base}/assets/${asset.id}`, label: asset.filename, icon: iconForMime(asset.mime) })
  return asset
}
