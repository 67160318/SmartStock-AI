import { WorkspacePage } from '@/components/workspace-page'
import { getWorkspacePageData } from '@/lib/workspace-data'

export default async function SuppliersPage() {
  const data = await getWorkspacePageData('/suppliers')
  return <WorkspacePage path="/suppliers" data={data} />
}
