import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getWorkspaceContext() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: membership, error: membershipError } = await supabase
    .from('restaurant_members')
    .select('restaurant_id, role')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membershipError) throw new Error('Unable to verify restaurant access.')
  if (!membership) redirect('/onboarding')

  const [{ data: restaurant, error: restaurantError }, { data: profile, error: profileError }] = await Promise.all([
    supabase
      .from('restaurants')
      .select('id, name, restaurant_type, location, currency')
      .eq('id', membership.restaurant_id)
      .maybeSingle(),
    supabase.from('profiles').select('full_name, email, avatar_url').eq('id', user.id).maybeSingle(),
  ])

  if (restaurantError || profileError || !restaurant) {
    throw new Error('Unable to load the authorized restaurant workspace.')
  }

  const metadata = user.user_metadata ?? {}
  const metadataName = [metadata.full_name, metadata.name, metadata.display_name]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
  const fullName = [profile?.full_name, metadataName]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ?.trim() || 'ผู้ใช้งาน'

  return {
    supabase,
    user,
    membership: { restaurantId: membership.restaurant_id, role: membership.role },
    restaurant,
    profile: {
      fullName,
      email: profile?.email || user.email || '',
      avatarUrl: profile?.avatar_url ?? null,
    },
  }
}

export type WorkspaceContext = Awaited<ReturnType<typeof getWorkspaceContext>>
export type WorkspaceRestaurant = WorkspaceContext['restaurant']
export type WorkspaceRole = WorkspaceContext['membership']['role']
export type WorkspaceProfile = WorkspaceContext['profile']
export type WorkspaceSupabase = WorkspaceContext['supabase']

export async function getPrimaryRestaurantMembership(supabase: WorkspaceSupabase, userId: string) {
  const { data, error } = await supabase
    .from('restaurant_members')
    .select('restaurant_id, role')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return { membership: data, error }
}

export function isWorkspaceAccessError(code?: string) {
  return code === '42501' || code === 'PGRST116'
}

export function workspaceHasAccess(membership: { restaurant_id: string } | null | undefined, restaurantId: string) {
  return membership?.restaurant_id === restaurantId
}

export function handleWorkspaceError(error?: { code?: string } | null) {
  return isWorkspaceAccessError(error?.code)
}

export { redirect }
export { createClient }
