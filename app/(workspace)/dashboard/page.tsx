import { WorkspacePage } from '@/components/workspace-page'
import { getWorkspacePageData } from '@/lib/workspace-data'

export default async function DashboardPage() {
  const data = await getWorkspacePageData('/dashboard')
  return <WorkspacePage path="/dashboard" data={data} />
}
