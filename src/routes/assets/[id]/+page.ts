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
  checksum: string
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
}

export async function getAssetDetail (id: string) {
  const { assets } = await api.query<{ assets: AssetDetail[] }>(`
    query getAssetDetail ($id: ID!) {
      assets (filter: { ids: [$id] }) {
        id
        name
        filename
        path
        size
        mime
        checksum
        box { width height }
        resizes { id width height mime extension size }
      }
    }
  `, { id })
  const asset = assets[0]
  if (asset) subnavStore.open('assets', { href: `${base}/assets/${asset.id}`, label: asset.filename, icon: iconForMime(asset.mime) })
  return asset
}

export const load: Load<{ id: string }> = async ({ params }) => {
  const asset = await getAssetDetail(params.id)
  if (!asset) throw error(404)
  return { asset }
}
