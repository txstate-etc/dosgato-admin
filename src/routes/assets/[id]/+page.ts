import { base } from '$app/paths'
import { api, subnavStore } from '$lib'
import { iconForMime } from '@dosgato/dialog'
import { error, type Load } from '@sveltejs/kit'

export interface AssetDetail {
  id: string
  name: string
  filename: string
  path: string
  size: number
  mime: string
  box?: {
    width: number
    height: number
  }
  resizes: {
    id: string
    width: number
    height: number
    extension: string
  }[]
}

export const load: Load<{ id: string }> = async ({ params }) => {
  const { assets } = await api.query<{ assets: AssetDetail[] }>(`
    query getAssetDetail ($id: ID!) {
      assets (filter: { ids: [$id] }) {
        id
        name
        filename
        path
        size
        mime
        box { width height }
        resizes { id width height extension }
      }
    }
  `, { id: params.id })
  if (!assets.length) throw error(404)
  const asset = assets[0]
  subnavStore.open('assets', { href: `${base}/assets/${asset.id}`, label: asset.filename, icon: iconForMime(asset.mime) })
  return { asset }
}
