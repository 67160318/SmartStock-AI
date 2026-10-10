'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Boxes, ChevronDown, ClipboardList, LayoutDashboard, Leaf, LogOut, Menu as MenuIcon, Search, Settings2, ShoppingCart, TrendingUp, Truck, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { navigationItems } from '@/lib/demo-data'
import { LanguageToggle, useLanguage } from '@/components/language-provider'
import { createClient } from '@/lib/supabase/client'

const icons = { dashboard: LayoutDashboard, inventory: Boxes, menu: MenuIcon, sales: ClipboardList, forecast: TrendingUp, orders: ShoppingCart, suppliers: Truck } as const

export function WorkspaceShell({ children, restaurantName, profileName, role }: { children: ReactNode; restaurantName: string; profileName: string; role: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const initials = profileName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'
  const roleLabel = role === 'owner' ? t('ownerRole') : role === 'manager' ? t('managerRole') : role === 'viewer' ? t('viewerRole') : t('memberRole')

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.replace('/login')
    router.refresh()
  }
  return (
    <div className="min-h-screen bg-[#f5f7f3] text-[#213b2e]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-[#e6ebe5] bg-white lg:flex">
        <Link href="/dashboard" className="flex h-[76px] items-center gap-3 border-b border-[#edf0eb] px-6"><span className="flex size-9 items-center justify-center rounded-xl bg-[#1b4838] text-white"><Leaf size={18} /></span><span className="text-[16px] font-bold tracking-tight">SmartStock <span className="text-[#67a37a]">AI</span></span></Link>
        <div className="mx-4 mt-5 rounded-xl border border-[#eaf0e7] bg-[#f8faf7] px-3.5 py-3"><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#96a197]">{t('currentWorkspace')}</p><div className="mt-1.5 flex items-center justify-between"><span className="truncate text-xs font-semibold text-[#385344]">{restaurantName}</span><ChevronDown size={14} className="shrink-0 text-[#99a69b]" /></div></div>
        <nav className="mt-6 flex flex-1 flex-col gap-1 px-3" aria-label="Workspace navigation">{navigationItems.map(({ href, key, icon }) => { const Icon = icons[icon as keyof typeof icons]; const active = pathname === href; return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition ${active ? 'bg-[#edf5ed] text-[#24543d]' : 'text-[#6d7a70] hover:bg-[#f6f8f5] hover:text-[#294c38]'}`}><Icon size={17} strokeWidth={1.8} /><span>{t(key as keyof typeof import('@/lib/demo-data').translations.en)}</span>{key === 'forecast' && <span className="ml-auto rounded-full bg-[#e5f0e4] px-2 py-0.5 text-[9px] font-bold text-[#54845a]">NEW</span>}</Link> })}</nav>
        <div className="flex flex-col gap-1 border-t border-[#edf0eb] p-3"><Link href="/settings" className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium ${pathname === '/settings' ? 'bg-[#edf5ed] text-[#24543d]' : 'text-[#6d7a70] hover:bg-[#f6f8f5]'}`}><Settings2 size={17} strokeWidth={1.8} />{t('settings')}</Link><Link href="/profile" className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium ${pathname === '/profile' ? 'bg-[#edf5ed] text-[#24543d]' : 'text-[#6d7a70] hover:bg-[#f6f8f5]'}`}><UserRound size={17} strokeWidth={1.8} />{t('profile')}</Link><div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[#f7f8f5] p-3"><span className="flex size-8 items-center justify-center rounded-full bg-[#dae9dc] text-[11px] font-bold text-[#477355]">{initials}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#40594b]">{profileName}</p><p className="truncate text-[10px] text-[#9aa49b]">{roleLabel}</p></div><ChevronDown size={14} className="text-[#9aa49b]" /></div></div>
      </aside>
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between gap-3 border-b border-[#e6ebe5] bg-white/95 px-4 backdrop-blur-md sm:px-7 lg:px-9"><div className="flex min-w-0 items-center gap-3"><span className="flex size-8 items-center justify-center rounded-lg bg-[#eff5ee] text-[#477755] lg:hidden"><Leaf size={16} /></span><div className="hidden items-center gap-2 rounded-xl border border-[#e9ede8] bg-[#fbfcfa] px-3 py-2 text-xs text-[#9aa39b] sm:flex"><Search size={14} /><span>{t('search')}</span><kbd className="ml-8 rounded border border-[#e9ede8] bg-white px-1.5 py-0.5 text-[9px]">⌘ K</kbd></div><span className="truncate text-[13px] font-semibold text-[#41614d] sm:hidden">SmartStock AI</span></div><div className="flex items-center gap-2.5"><LanguageToggle /><button type="button" aria-label="Notifications" className="relative flex size-9 items-center justify-center rounded-xl text-[#6f7f73] transition hover:bg-[#f4f7f2]"><Bell size={17} /><span className="absolute right-[9px] top-[8px] size-1.5 rounded-full bg-[#d58b4b] ring-2 ring-white" /></button><button type="button" onClick={handleSignOut} aria-label={t('signOut')} title={t('signOut')} className="flex size-9 items-center justify-center rounded-xl text-[#6f7f73] transition hover:bg-[#f4f7f2]"><LogOut size={16} /></button><Link href="/profile" aria-label={profileName} className="ml-0.5 flex size-9 items-center justify-center rounded-full bg-[#dae9dc] text-[11px] font-bold text-[#477355]">{initials}</Link></div></header>
        <div className="flex gap-2 overflow-x-auto border-b border-[#e6ebe5] bg-white px-4 py-2.5 lg:hidden">{navigationItems.map(({ href, key, icon }) => { const Icon = icons[icon as keyof typeof icons]; return <Link key={href} href={href} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium ${pathname === href ? 'bg-[#edf5ed] text-[#24543d]' : 'text-[#718075]'}`}><Icon size={14} />{t(key as keyof typeof import('@/lib/demo-data').translations.en)}</Link> })}</div>
        <main className="mx-auto max-w-[1440px] px-4 pb-12 pt-7 sm:px-7 sm:pt-9 lg:px-9">{children}</main>
        <footer className="mx-auto flex max-w-[1440px] flex-col gap-1 border-t border-[#e6ebe5] px-4 py-5 text-[10px] text-[#99a49a] sm:flex-row sm:justify-between sm:px-7 lg:px-9"><span>SmartStock AI · {restaurantName}</span><span>Restaurant workspace data is access-controlled.</span></footer>
      </div>
    </div>
  )
}
