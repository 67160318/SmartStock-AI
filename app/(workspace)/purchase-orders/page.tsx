import { WorkspacePage } from '@/components/workspace-page'
import { getWorkspacePageData } from '@/lib/workspace-data'

export default async function PurchaseOrdersPage() {
  const data = await getWorkspacePageData('/purchase-orders')
  return <WorkspacePage path="/purchase-orders" data={data} />
}
