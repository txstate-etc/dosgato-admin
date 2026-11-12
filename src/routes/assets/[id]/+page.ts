import { error, type Load } from '@sveltejs/kit'
import { getAssetDetail, openAssetSubnav } from './helpers'

export const load: Load<{ id: string }> = async ({ params }) => {
  const asset = await getAssetDetail(params.id)
  if (!asset) throw error(404)
  openAssetSubnav(asset)
  return { asset }
}
