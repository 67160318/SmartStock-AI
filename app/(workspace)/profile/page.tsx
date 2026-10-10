import { WorkspacePage } from '@/components/workspace-page'
import { getWorkspacePageData } from '@/lib/workspace-data'

export default async function ProfilePage() {
  const data = await getWorkspacePageData('/profile')
  return <WorkspacePage path="/profile" data={data} />
}
