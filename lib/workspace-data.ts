import type { RoutePath } from '@/lib/demo-data'
import { getWorkspaceContext } from '@/lib/workspace-context'

export type WorkspacePageData = {
  restaurantId: string
  restaurantName: string
  restaurantType: string
  location: string
  currency: string
  profileName: string
  profileEmail: string
  profileAvatar: string | null
  role: string
  dashboard: {
    salesSeries: { day: string; sales: number }[]
    weeklySales: number
    orderCount: number
    ingredientCount: number
    lowStockCount: number
    stockAlerts: { name: string; category: string; stock: number; unit: string; status: string; supplier: string }[]
    bestSellers: { name: string; category: string; price: number; sales: number }[]
  }
  menuItems: { id: string; name: string; category: string; price: number; recipeCount: number; sold: number }[]
  salesImports: { id: string; fileName: string; importedAt: string | null; createdAt: string; recordCount: number; status: string; errorMessage: string | null }[]
  forecast: { run: { windowStart: string; windowEnd: string; createdAt: string } | null; items: { name: string; predicted: number; suggested: number; onHand: number; unit: string; confidence: number | null }[] }
  purchaseOrders: { id: string; number: string; supplier: string; date: string; itemCount: number; total: number; status: string }[]
  suppliers: { id: string; name: string; contact: string; leadTime: number; itemCount: number; status: string }[]
}

const emptyDashboard: WorkspacePageData['dashboard'] = {
  salesSeries: [],
  weeklySales: 0,
  orderCount: 0,
  ingredientCount: 0,
  lowStockCount: 0,
  stockAlerts: [],
  bestSellers: [],
}

function assertQuery<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error('Unable to load restaurant data. Refresh the page and try again.')
  return data as T
}

function dayKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function currencyNumber(value: unknown) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

export async function getWorkspacePageData(path: RoutePath): Promise<WorkspacePageData> {
  const { supabase, user, membership, restaurant, profile } = await getWorkspaceContext()
  const restaurantId = membership.restaurantId

  const result: WorkspacePageData = {
    restaurantId,
    restaurantName: restaurant.name,
    restaurantType: restaurant.restaurant_type ?? '',
    location: restaurant.location ?? '',
    currency: restaurant.currency ?? 'THB',
    profileName: profile.fullName,
    profileEmail: profile.email,
    profileAvatar: profile.avatarUrl,
    role: membership.role,
    dashboard: emptyDashboard,
    menuItems: [],
    salesImports: [],
    forecast: { run: null, items: [] },
    purchaseOrders: [],
    suppliers: [],
  }

  if (path === '/dashboard') {
    const now = new Date()
    const firstDay = new Date(now)
    firstDay.setDate(now.getDate() - 6)
    firstDay.setHours(0, 0, 0, 0)
    const [{ data: ingredientsData, error: ingredientsError }, { data: salesData, error: salesError }, { data: menuData, error: menuError }] = await Promise.all([
      supabase.from('ingredients').select('id, name, category, current_stock, reorder_level, unit, supplier_id').eq('restaurant_id', restaurantId).order('name'),
      supabase.from('sales_records').select('id, transaction_id, menu_product_id, source_product_name, quantity, unit_price, sold_at').eq('restaurant_id', restaurantId).gte('sold_at', firstDay.toISOString()).order('sold_at', { ascending: true }).limit(10000),
      supabase.from('menu_products').select('id, name, category, price').eq('restaurant_id', restaurantId).eq('is_active', true).order('name'),
    ])
    const ingredients = assertQuery(ingredientsData, ingredientsError) ?? []
    const sales = assertQuery(salesData, salesError) ?? []
    const products = assertQuery(menuData, menuError) ?? []
    const { data: suppliersData, error: suppliersError } = await supabase.from('suppliers').select('id, name').eq('restaurant_id', restaurantId)
    const suppliers = assertQuery(suppliersData, suppliersError) ?? []
    const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]))
    const productById = new Map(products.map((product) => [product.id, product]))
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(firstDay)
      date.setDate(firstDay.getDate() + index)
      return { key: dayKey(date), day: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date), sales: 0 }
    })
    const salesByDay = new Map(days.map((day) => [day.key, day]))
    const transactions = new Set<string>()
    const soldByProduct = new Map<string, { name: string; category: string; price: number; sales: number }>()
    for (const sale of sales) {
      const day = salesByDay.get(dayKey(new Date(sale.sold_at)))
      if (day) day.sales += currencyNumber(sale.quantity) * currencyNumber(sale.unit_price)
      transactions.add(sale.transaction_id || sale.id)
      const product = sale.menu_product_id ? productById.get(sale.menu_product_id) : null
      const name = product?.name ?? sale.source_product_name
      const current = soldByProduct.get(name) ?? {
        name,
        category: product?.category ?? '',
        price: currencyNumber(product?.price ?? sale.unit_price),
        sales: 0,
      }
      current.sales += currencyNumber(sale.quantity)
      soldByProduct.set(name, current)
    }
    const lowStock = ingredients.filter((ingredient) => currencyNumber(ingredient.current_stock) <= currencyNumber(ingredient.reorder_level))
    result.dashboard = {
      salesSeries: sales.length ? days.map(({ day, sales: amount }) => ({ day, sales: amount })) : [],
      weeklySales: sales.reduce((total, sale) => total + currencyNumber(sale.quantity) * currencyNumber(sale.unit_price), 0),
      orderCount: transactions.size,
      ingredientCount: ingredients.length,
      lowStockCount: lowStock.length,
      stockAlerts: lowStock.slice(0, 6).map((ingredient) => ({
        name: ingredient.name,
        category: ingredient.category ?? '',
        stock: currencyNumber(ingredient.current_stock),
        unit: ingredient.unit,
        status: currencyNumber(ingredient.current_stock) <= 0 ? 'Critical' : 'Low stock',
        supplier: supplierById.get(ingredient.supplier_id) ?? '',
      })),
      bestSellers: [...soldByProduct.values()].sort((a, b) => b.sales - a.sales).slice(0, 5),
    }
  }

  if (path === '/menu') {
    const [{ data: productsData, error: productsError }, { data: recipesData, error: recipesError }, { data: salesData, error: salesError }] = await Promise.all([
      supabase.from('menu_products').select('id, name, category, price').eq('restaurant_id', restaurantId).order('name'),
      supabase.from('recipes').select('menu_product_id').eq('restaurant_id', restaurantId),
      supabase.from('sales_records').select('menu_product_id, quantity').eq('restaurant_id', restaurantId).gte('sold_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()).limit(10000),
    ])
    const products = assertQuery(productsData, productsError) ?? []
    const recipes = assertQuery(recipesData, recipesError) ?? []
    const sales = assertQuery(salesData, salesError) ?? []
    const recipeCounts = new Map<string, number>()
    for (const recipe of recipes) recipeCounts.set(recipe.menu_product_id, (recipeCounts.get(recipe.menu_product_id) ?? 0) + 1)
    const salesCounts = new Map<string, number>()
    for (const sale of sales) if (sale.menu_product_id) salesCounts.set(sale.menu_product_id, (salesCounts.get(sale.menu_product_id) ?? 0) + currencyNumber(sale.quantity))
    result.menuItems = products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category ?? '',
      price: currencyNumber(product.price),
      recipeCount: recipeCounts.get(product.id) ?? 0,
      sold: salesCounts.get(product.id) ?? 0,
    }))
  }

  if (path === '/sales') {
    const { data, error } = await supabase.from('sales_imports').select('id, file_name, status, record_count, imported_at, created_at, error_message').eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(50)
    result.salesImports = (assertQuery(data, error) ?? []).map((row) => ({
      id: row.id,
      fileName: row.file_name,
      importedAt: row.imported_at,
      createdAt: row.created_at,
      recordCount: row.record_count,
      status: row.status,
      errorMessage: row.error_message,
    }))
  }

  if (path === '/forecast') {
    const { data: runsData, error: runsError } = await supabase.from('forecast_runs').select('id, window_start, window_end, created_at').eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(1)
    const runs = assertQuery(runsData, runsError) ?? []
    const latestRun = runs[0]
    if (latestRun) {
      const [{ data: itemsData, error: itemsError }, { data: ingredientsData, error: ingredientsError }] = await Promise.all([
        supabase.from('forecast_items').select('ingredient_id, predicted_quantity, suggested_quantity, confidence, unit').eq('restaurant_id', restaurantId).eq('forecast_run_id', latestRun.id),
        supabase.from('ingredients').select('id, name, current_stock').eq('restaurant_id', restaurantId),
      ])
      const items = assertQuery(itemsData, itemsError) ?? []
      const ingredients = assertQuery(ingredientsData, ingredientsError) ?? []
      const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]))
      result.forecast = {
        run: { windowStart: latestRun.window_start, windowEnd: latestRun.window_end, createdAt: latestRun.created_at },
        items: items.flatMap((item) => {
          const ingredient = ingredientById.get(item.ingredient_id)
          return ingredient ? [{
            name: ingredient.name,
            predicted: currencyNumber(item.predicted_quantity),
            suggested: currencyNumber(item.suggested_quantity),
            onHand: currencyNumber(ingredient.current_stock),
            unit: item.unit,
            confidence: item.confidence === null ? null : currencyNumber(item.confidence),
          }] : []
        }),
      }
    }
  }

  if (path === '/purchase-orders') {
    const [{ data: ordersData, error: ordersError }, { data: suppliersData, error: suppliersError }, { data: itemsData, error: itemsError }] = await Promise.all([
      supabase.from('purchase_orders').select('id, order_number, supplier_id, status, placed_on, created_at').eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(100),
      supabase.from('suppliers').select('id, name').eq('restaurant_id', restaurantId),
      supabase.from('purchase_order_items').select('purchase_order_id, quantity, unit_cost').eq('restaurant_id', restaurantId),
    ])
    const orders = assertQuery(ordersData, ordersError) ?? []
    const suppliers = assertQuery(suppliersData, suppliersError) ?? []
    const items = assertQuery(itemsData, itemsError) ?? []
    const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]))
    const aggregates = new Map<string, { count: number; total: number }>()
    for (const item of items) {
      const current = aggregates.get(item.purchase_order_id) ?? { count: 0, total: 0 }
      current.count += 1
      current.total += currencyNumber(item.quantity) * currencyNumber(item.unit_cost)
      aggregates.set(item.purchase_order_id, current)
    }
    result.purchaseOrders = orders.map((order) => {
      const aggregate = aggregates.get(order.id) ?? { count: 0, total: 0 }
      return {
        id: order.id,
        number: order.order_number,
        supplier: supplierById.get(order.supplier_id) ?? '',
        date: order.placed_on ?? order.created_at,
        itemCount: aggregate.count,
        total: aggregate.total,
        status: order.status,
      }
    })
  }

  if (path === '/suppliers') {
    const [{ data: suppliersData, error: suppliersError }, { data: ingredientsData, error: ingredientsError }] = await Promise.all([
      supabase.from('suppliers').select('id, name, contact_name, contact_email, phone, lead_time_days, is_active').eq('restaurant_id', restaurantId).order('name'),
      supabase.from('ingredients').select('supplier_id').eq('restaurant_id', restaurantId),
    ])
    const suppliers = assertQuery(suppliersData, suppliersError) ?? []
    const ingredients = assertQuery(ingredientsData, ingredientsError) ?? []
    const counts = new Map<string, number>()
    for (const ingredient of ingredients) if (ingredient.supplier_id) counts.set(ingredient.supplier_id, (counts.get(ingredient.supplier_id) ?? 0) + 1)
    result.suppliers = suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      contact: supplier.contact_email || supplier.phone || supplier.contact_name || '',
      leadTime: supplier.lead_time_days,
      itemCount: counts.get(supplier.id) ?? 0,
      status: supplier.is_active ? 'Active' : 'Inactive',
    }))
  }

  return result
}

export function routePathForWorkspace(path: string): RoutePath {
  if (path in { '/dashboard': true, '/inventory': true, '/menu': true, '/sales': true, '/forecast': true, '/purchase-orders': true, '/suppliers': true, '/settings': true, '/profile': true }) {
    return path as RoutePath
  }
  return '/dashboard'
}

export function getWorkspaceProfileData(data: WorkspacePageData) {
  return {
    restaurantName: data.restaurantName,
    restaurantType: data.restaurantType,
    location: data.location,
    currency: data.currency,
    profileName: data.profileName,
    profileEmail: data.profileEmail,
    profileAvatar: data.profileAvatar,
  }
}
