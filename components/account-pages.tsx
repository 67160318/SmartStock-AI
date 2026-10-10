'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, CircleAlert, Leaf, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import type { AuthError } from '@supabase/supabase-js'
import { LanguageToggle, useLanguage } from '@/components/language-provider'
import { createClient } from '@/lib/supabase/client'
import type { TranslationKey } from '@/lib/demo-data'

function getAuthRedirectUrl(next: string) {
  const redirectUrl = new URL(
    process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
    window.location.origin,
  )
  redirectUrl.searchParams.set('next', next)
  return redirectUrl.toString()
}

function authErrorMessage(error: AuthError, t: (key: TranslationKey) => string) {
  if (error.code === 'email_not_confirmed') return t('confirmYourEmail')
  if (error.status === 429 || error.code === 'over_email_send_rate_limit') return t('authRateLimit')
  if (error.code === 'weak_password') return error.message
  if (error.code === 'invalid_credentials' || error.code === 'user_not_found') return t('invalidCredentials')
  return t('unexpectedAuthError')
}

export function AuthPage({ mode }: { mode: 'login' | 'register' | 'account' }) {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const [notice, setNotice] = useState('')
  const [isPending, setIsPending] = useState(false)
  const heading = mode === 'login' ? t('signInTitle') : mode === 'register' ? t('signUpTitle') : t('accountTitle')
  const subheading = mode === 'login' ? t('signInCopy') : mode === 'register' ? t('signUpCopy') : t('accountCopy')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setIsPending(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const password = String(form.get('password') ?? '')

    try {
      const supabase = createClient()

      if (mode === 'account') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getAuthRedirectUrl('/update-password'),
        })
        setNotice(error ? authErrorMessage(error, t) : t('recoveryEmailSent'))
        return
      }

      if (mode === 'register') {
        const fullName = String(form.get('full_name') ?? '').trim()
        if (fullName.length < 1 || fullName.length > 120) {
          setNotice(t('invalidFullName'))
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl('/onboarding'),
            data: { full_name: fullName },
          },
        })

        if (error) {
          setNotice(error.code === 'user_already_exists' ? t('confirmationEmailSent') : authErrorMessage(error, t))
          return
        }

        if (data.session) {
          router.replace('/onboarding')
          router.refresh()
          return
        }

        setNotice(t('confirmationEmailSent'))
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setNotice(authErrorMessage(error, t))
        return
      }

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setNotice(t('unexpectedAuthError'))
    } finally {
      setIsPending(false)
    }
  }
  return <main className="flex min-h-screen bg-[#f7f8f4] text-[#1c3c2d]"><section className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#1b4838] p-12 text-white lg:flex xl:p-16"><div className="absolute -right-28 top-28 size-96 rounded-full border border-white/10" /><div className="absolute -right-8 top-56 size-60 rounded-full border border-white/10" /><Link href="/" className="relative flex items-center gap-3 text-base font-semibold"><span className="flex size-9 items-center justify-center rounded-xl bg-white/10"><Leaf size={17} /></span>SmartStock <span className="text-[#aad2a7]">AI</span></Link><div className="relative max-w-md"><span className="mb-6 inline-flex size-12 items-center justify-center rounded-2xl bg-white/10 text-[#d5ead2]"><ShieldCheck size={22} /></span><h2 className="text-4xl font-semibold leading-tight tracking-[-.04em]">{t('tagline')}</h2><p className="mt-5 text-sm leading-7 text-white/65">{t('kitchenCopy')}</p><div className="mt-8 rounded-2xl border border-white/10 bg-white/[.06] p-4"><p className="text-xs font-medium text-white/80">Little Fern Kitchen · {t('preview')}</p><p className="mt-1.5 text-[10px] text-white/55">{t('sampleWorkspaceOnly')}</p></div></div><p className="relative text-[10px] text-white/50">© 2026 SmartStock AI</p></section><section className="flex flex-1 flex-col"><div className="flex items-center justify-between px-5 py-5 sm:px-9 lg:justify-end"><Link href="/" className="flex items-center gap-2 text-sm font-semibold lg:hidden"><span className="flex size-8 items-center justify-center rounded-lg bg-[#1b4838] text-white"><Leaf size={15} /></span>SmartStock AI</Link><LanguageToggle /></div><div className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-9"><div className="w-full max-w-[410px]"><Link href="/" className="mb-7 inline-flex items-center gap-2 text-xs font-medium text-[#88958a] transition hover:text-[#31513c]"><ArrowLeft size={14} />{t('brand')}</Link><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#77a17a]">{t('brand')}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[#1c3c2d]">{heading}</h1><p className="mt-2 text-sm text-[#89948b]">{subheading}</p>
    {mode !== 'account' ? <form onSubmit={handleSubmit} aria-busy={isPending} className="mt-8 flex flex-col gap-4"><Field name="email" autoComplete="email" label={t('email')} type="email" placeholder="you@restaurant.com" icon={<Mail size={15} />} required />{mode === 'register' && <Field name="full_name" autoComplete="name" label={t('fullName')} type="text" placeholder={locale === 'th' ? 'ชื่อ-นามสกุล' : 'Full name'} required />}<Field name="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} label={t('password')} minLength={mode === 'register' ? 6 : undefined} type="password" placeholder="••••••••" icon={<LockKeyhole size={15} />} required />{mode === 'login' && <div className="-mt-1 flex justify-end"><Link href="/account" className="text-[11px] font-medium text-[#5e8462] hover:text-[#315d3e]">{t('forgotPassword')}</Link></div>}<button type="submit" disabled={isPending} className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1b4838] text-sm font-semibold text-white transition hover:bg-[#143a2c] disabled:cursor-wait disabled:opacity-60">{isPending ? t('working') : mode === 'login' ? t('logIn') : t('createAccount')}<ArrowRight size={15} /></button>{notice && <p role="status" className="flex items-start gap-2 rounded-xl border border-[#e6e5d3] bg-[#fbfaef] px-3.5 py-3 text-[11px] leading-5 text-[#786e3b]"><CircleAlert size={14} className="mt-0.5 shrink-0" />{notice}</p>}</form> : <form onSubmit={handleSubmit} aria-busy={isPending} className="mt-7 flex flex-col gap-4 rounded-2xl border border-[#e8ece6] bg-white p-5"><span className="flex size-10 items-center justify-center rounded-xl bg-[#eff5ed] text-[#628465]"><Mail size={18} /></span><Field name="email" autoComplete="email" label={t('email')} type="email" placeholder="you@restaurant.com" icon={<Mail size={15} />} required /><button type="submit" disabled={isPending} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1b4838] text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-60">{isPending ? t('working') : t('sendResetLink')}<ArrowRight size={14} /></button>{notice && <p role="status" className="rounded-xl border border-[#e6e5d3] bg-[#fbfaef] px-3.5 py-3 text-[11px] leading-5 text-[#786e3b]">{notice}</p>}<Link href="/login" className="text-center text-xs font-medium text-[#477452]">{t('logIn')}</Link></form>}
    <p className="mt-6 text-center text-xs text-[#87938a]">{mode === 'login' ? t('noAccount') : t('haveAccount')} <Link href={mode === 'login' ? '/register' : '/login'} className="font-semibold text-[#477452] hover:text-[#214c33]">{mode === 'login' ? t('createAccount') : t('logIn')}</Link></p><p className="mt-7 text-center text-[10px] leading-5 text-[#a0aaa1]">{t('authPrivacyNotice')}</p></div></div></section></main>
}

export function AuthCallbackErrorPage() {
  const { t } = useLanguage()

  return <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] px-5 py-12 text-[#1c3c2d]"><section className="w-full max-w-[410px] rounded-2xl border border-[#e7ece5] bg-white p-6 text-center sm:p-8"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#eff5ed] text-[#628465]"><CircleAlert size={21} /></span><h1 className="mt-5 text-xl font-semibold tracking-tight">{t('authLinkErrorTitle')}</h1><p className="mt-2 text-sm leading-6 text-[#839087]">{t('authLinkErrorCopy')}</p><Link href="/account" className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#1b4838] text-xs font-semibold text-white">{t('requestNewLink')}</Link></section></main>
}

export function OnboardingPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [notice, setNotice] = useState('')
  const [isPending, setIsPending] = useState(false)

  async function handleOnboardingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setIsPending(true)

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const restaurantType = String(form.get('restaurant_type') ?? '')
    const location = String(form.get('location') ?? '').trim()
    const currency = String(form.get('currency') ?? 'THB')

    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('create_restaurant_with_owner', {
        p_name: name,
        p_restaurant_type: restaurantType || null,
        p_location: location || null,
        p_currency: currency,
      })

      if (error) {
        if (error.code === '23505') {
          const { data: { user } } = await supabase.auth.getUser()
          const { data: existingMembership, error: membershipError } = await supabase
            .from('restaurant_members')
            .select('restaurant_id')
            .eq('user_id', user?.id ?? '')
            .order('joined_at', { ascending: true })
            .limit(1)
            .maybeSingle()

          if (!membershipError && existingMembership) {
            router.replace('/dashboard')
            router.refresh()
            return
          }
        }

        setNotice(t('onboardingSaveError'))
        return
      }

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setNotice(t('onboardingSaveError'))
    } finally {
      setIsPending(false)
    }
  }
  return <main className="min-h-screen bg-[#f7f8f4] text-[#1c3c2d]"><header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/" className="flex items-center gap-2.5 text-sm font-bold"><span className="flex size-9 items-center justify-center rounded-xl bg-[#1b4838] text-white"><Leaf size={17} /></span>SmartStock AI</Link><LanguageToggle /></header><div className="mx-auto max-w-[650px] px-5 pb-16 pt-8 sm:px-8 sm:pt-12"><div className="mb-8 flex items-center gap-2"><span className="h-1.5 flex-1 rounded-full bg-[#3c7852]" /><span className="h-1.5 flex-1 rounded-full bg-[#e4eae1]" /><span className="h-1.5 flex-1 rounded-full bg-[#e4eae1]" /><span className="ml-2 text-[10px] text-[#9aa49a]">1 / 3</span></div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#77a17a]">SMARTSTOCK AI</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em]">{t('onboardingTitle')}</h1><p className="mt-2 text-sm text-[#89948b]">{t('onboardingCopy')}</p><form onSubmit={handleOnboardingSubmit} aria-busy={isPending} className="mt-8 flex flex-col gap-5 rounded-2xl border border-[#e7ece5] bg-white p-5 sm:p-7"><PlainField name="name" label={t('restaurantName')} placeholder="Little Fern Kitchen" required /><div className="grid gap-5 sm:grid-cols-2"><label className="flex flex-col gap-2"><span className="text-xs font-medium text-[#536457]">{t('restaurantType')}</span><select name="restaurant_type" defaultValue="" className="h-11 rounded-xl border border-[#e5ebe3] bg-white px-3 text-xs text-[#647268] outline-none focus:border-[#9db9a1]"><option value="" disabled>{t('selectType')}</option><option value="cafe">{t('cafe')}</option><option value="restaurant">{t('restaurant')}</option><option value="bakery">{t('bakery')}</option><option value="shabu-buffet-bbq">{t('shabuBuffetBbq')}</option></select></label><PlainField name="location" label={t('location')} placeholder="Bangkok" /></div><label className="flex flex-col gap-2"><span className="text-xs font-medium text-[#536457]">{t('currency')}</span><select name="currency" defaultValue="THB" className="h-11 rounded-xl border border-[#e5ebe3] bg-white px-3 text-xs text-[#647268] outline-none focus:border-[#9db9a1]"><option value="THB">THB · Thai baht (฿)</option><option value="USD">USD · US dollar ($)</option></select></label><div className="flex items-start gap-2 rounded-xl bg-[#f3f7f1] p-3 text-[11px] leading-5 text-[#718071]"><CircleAlert size={14} className="mt-0.5 shrink-0 text-[#739073]" />{t('onboardingDemoNotice')}</div>{notice && <p role="status" className="text-xs text-[#766a3a]">{notice}</p>}<button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1b4838] text-sm font-semibold text-white">{t('next')}<ArrowRight size={15} /></button></form><p className="mt-5 text-center text-[10px] leading-5 text-[#a0aaa1]">{t('notConnected')}</p></div></main>
}

export function PasswordUpdatePage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [notice, setNotice] = useState('')
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    const confirmation = String(form.get('password_confirmation') ?? '')

    if (password.length < 6) {
      setNotice(t('passwordTooShort'))
      return
    }
    if (password !== confirmation) {
      setNotice(t('passwordMismatch'))
      return
    }

    setIsPending(true)
    setNotice('')
    try {
      const { error } = await createClient().auth.updateUser({ password })
      if (error) {
        setNotice(error.code === 'weak_password' ? error.message : t('unexpectedAuthError'))
        return
      }
      router.replace('/dashboard')
      router.refresh()
    } catch {
      setNotice(t('unexpectedAuthError'))
    } finally {
      setIsPending(false)
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] px-5 py-12 text-[#1c3c2d]"><section className="w-full max-w-[410px] rounded-2xl border border-[#e7ece5] bg-white p-6 sm:p-8"><Link href="/" className="flex items-center gap-2 text-sm font-semibold"><span className="flex size-8 items-center justify-center rounded-lg bg-[#1b4838] text-white"><Leaf size={15} /></span>SmartStock AI</Link><h1 className="mt-8 text-2xl font-semibold tracking-tight">{t('passwordUpdateTitle')}</h1><p className="mt-2 text-sm leading-6 text-[#839087]">{t('passwordUpdateCopy')}</p><form onSubmit={handleSubmit} aria-busy={isPending} className="mt-6 flex flex-col gap-4"><Field name="password" autoComplete="new-password" label={t('newPassword')} minLength={6} type="password" placeholder="••••••••" required /><Field name="password_confirmation" autoComplete="new-password" label={t('confirmPassword')} minLength={6} type="password" placeholder="••••••••" required /><button type="submit" disabled={isPending} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1b4838] text-sm font-semibold text-white disabled:opacity-60">{isPending ? t('working') : t('savePassword')}</button>{notice && <p role="status" className="rounded-xl border border-[#e6e5d3] bg-[#fbfaef] px-3.5 py-3 text-xs leading-5 text-[#786e3b]">{notice}</p>}</form></section></main>
}

function Field({ name, label, type, placeholder, icon, required = false, autoComplete, minLength }: { name: string; label: string; type: string; placeholder: string; icon?: React.ReactNode; required?: boolean; autoComplete?: string; minLength?: number }) {
  return <label className="flex flex-col gap-2"><span className="text-xs font-medium text-[#536457]">{label}</span><span className="flex h-11 items-center gap-2.5 rounded-xl border border-[#e5ebe3] bg-white px-3 text-[#98a499] focus-within:border-[#9db9a1]">{icon}<input name={name} autoComplete={autoComplete} required={required} minLength={minLength} type={type} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-xs text-[#3f5746] outline-none placeholder:text-[#b3bcb3]" /></span></label>
}

function PlainField({ name, label, placeholder, required = false }: { name: string; label: string; placeholder: string; required?: boolean }) {
  return <label className="flex flex-col gap-2"><span className="text-xs font-medium text-[#536457]">{label}</span><input name={name} required={required} placeholder={placeholder} className="h-11 rounded-xl border border-[#e5ebe3] bg-white px-3 text-xs text-[#3f5746] outline-none placeholder:text-[#b3bcb3] focus:border-[#9db9a1]" /></label>
}
