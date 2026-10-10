import { WorkspacePage } from '@/components/workspace-page'
import { getWorkspacePageData } from '@/lib/workspace-data'

export default async function ForecastPage() {
  const data = await getWorkspacePageData('/forecast')
  return <WorkspacePage path="/forecast" data={data} />
}
