import { error, type Load } from '@sveltejs/kit'
import { getAssetDetail } from './helpers'

export const load: Load<{ id: string }> = async ({ params }) => {
  const asset = await getAssetDetail(params.id)
  if (!asset) throw error(404)
  return { asset }
}
