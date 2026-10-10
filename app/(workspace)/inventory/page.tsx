import { InventoryManager } from '@/components/inventory-manager'
import { getWorkspaceContext } from '@/lib/workspace-context'

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string | string[] }>
}) {
  const { add } = await searchParams
  const { supabase, membership, restaurant } = await getWorkspaceContext()
  const restaurantId = membership.restaurantId

  const [{ data: ingredients, error: ingredientsError }, { data: suppliers, error: suppliersError }] = await Promise.all([
    supabase.from('ingredients').select('id, name, category, unit, current_stock, reorder_level, supplier_id').eq('restaurant_id', restaurantId).order('name'),
    supabase.from('suppliers').select('id, name').eq('restaurant_id', restaurantId).eq('is_active', true).order('name'),
  ])

  return (
    <InventoryManager
      key={restaurantId}
      restaurantId={restaurantId}
      restaurantName={restaurant.name}
      initialFormOpen={add === '1'}
      ingredients={ingredients ?? []}
      suppliers={suppliers ?? []}
      loadError={ingredientsError || suppliersError ? 'Restaurant inventory could not be loaded. Refresh the page to try again.' : undefined}
    />
  )
}
