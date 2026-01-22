import { api } from '$lib'
import { csv } from 'txstate-utils'

export async function downloadPageList (pagetreeId: string, pagetreeName: string, siteName: string) {
  const pages = await api.getPagetreePages(pagetreeId)
  const rows: string[][] = [['Path', 'Title', 'Template', 'Status', 'Last Modified', 'Modified By']]
  for (const page of pages) {
    rows.push([page.path, page.title ?? '', page.template?.name ?? '', (page.published ? 'Published' : 'Not Published'), page.modifiedAt, page.modifiedBy.id])
  }
  const csvString = csv(rows)
  const j = document.createElement('a')
  j.download = `${siteName}_${pagetreeName}_pages_` + Date.now() + '.csv'
  j.href = URL.createObjectURL(new Blob([csvString]))
  j.click()
  return { success: true, data: {}, messages: [] }
}


