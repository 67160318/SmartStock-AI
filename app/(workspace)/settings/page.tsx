import { WorkspacePage } from '@/components/workspace-page'
import { getWorkspacePageData } from '@/lib/workspace-data'

export default async function SettingsPage() {
  const data = await getWorkspacePageData('/settings')
  return <WorkspacePage path="/settings" data={data} />
}
