import { api } from '$lib'
import { updateAuthSubnav } from '../authsubnav'

export const load = async () => {
  updateAuthSubnav('users')
  const allTrainings = await api.getTrainings()
  return { allTrainings }
}
