import { WorkspacePage } from '@/components/workspace-page'
import { getWorkspacePageData } from '@/lib/workspace-data'

export default async function SalesPage() {
  const data = await getWorkspacePageData('/sales')
  return <WorkspacePage path="/sales" data={data} />
}
