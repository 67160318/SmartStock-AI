import { redirect } from 'next/navigation'
import { PasswordUpdatePage } from '@/components/account-pages'
import { createClient } from '@/lib/supabase/server'

export default async function UpdatePasswordRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <PasswordUpdatePage />
}
