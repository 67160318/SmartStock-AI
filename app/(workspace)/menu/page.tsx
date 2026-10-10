import { WorkspacePage } from '@/components/workspace-page'
import { getWorkspacePageData } from '@/lib/workspace-data'

export default async function MenuRoutePage() {
  const data = await getWorkspacePageData('/menu')
  return <WorkspacePage path="/menu" data={data} />
}
