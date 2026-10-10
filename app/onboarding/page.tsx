import { redirect } from 'next/navigation'
import { OnboardingPage } from '@/components/account-pages'
import { createClient } from '@/lib/supabase/server'

export default async function RestaurantOnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership, error } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error('Unable to verify restaurant onboarding status.')
  if (membership) redirect('/dashboard')

  return <OnboardingPage />
}
