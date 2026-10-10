'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight, BarChart3, Boxes, Check, Leaf, PackageCheck, ShoppingBasket, Sparkles, TrendingUp } from 'lucide-react'
import { useLanguage, LanguageToggle } from '@/components/language-provider'

export function LandingPage() {
  const { t } = useLanguage()
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f4] text-[#17352b]">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label={t('brand')}>
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#1b4838] text-white"><Leaf size={18} strokeWidth={2.2} /></span>
          <span className="text-[17px] font-bold tracking-tight">SmartStock <span className="text-[#5a9b76]">AI</span></span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#617068] md:flex" aria-label="Main navigation">
          <a href="#features" className="transition hover:text-[#17352b]">{t('featureTitle')}</a>
          <a href="#how-it-works" className="transition hover:text-[#17352b]">{t('howTitle')}</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <Link href="/login" className="hidden px-2 py-2 text-sm font-semibold text-[#375347] transition hover:text-[#1b4838] sm:block">{t('logIn')}</Link>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#1b4838] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123c2d]">{t('getStarted')}<ArrowRight size={15} /></Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 md:grid-cols-[0.88fr_1.12fr] md:px-10 md:pb-28 md:pt-16">
        <div className="relative z-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dce6dc] bg-white/80 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#547660]"><Sparkles size={14} />{t('heroEyebrow')}</div>
          <h1 className="max-w-xl whitespace-pre-line text-[clamp(3.2rem,6.8vw,6.15rem)] font-semibold leading-[0.98] tracking-[-0.065em] text-[#153a2d]">{t('heroHeadline')}</h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#65736b] md:text-lg md:leading-8">{t('heroCopy')}</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-3 rounded-full bg-[#1b4838] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(27,72,56,.17)] transition hover:-translate-y-0.5 hover:bg-[#123c2d]">{t('startFree')}<ArrowRight size={16} /></Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-full border border-[#dce4dc] bg-white px-5 py-3.5 text-sm font-semibold text-[#385448] transition hover:border-[#96b5a0]">{t('seeHow')}<ArrowDown size={14} /></a>
          </div>
          <div className="mt-9 flex items-center gap-3 text-xs text-[#839087]"><span className="flex -space-x-2"><span className="flex size-7 items-center justify-center rounded-full border-2 border-[#f7f8f4] bg-[#dce8d8] text-[10px] font-bold text-[#4b7653]">B</span><span className="flex size-7 items-center justify-center rounded-full border-2 border-[#f7f8f4] bg-[#f3e5c9] text-[10px] font-bold text-[#98743e]">C</span><span className="flex size-7 items-center justify-center rounded-full border-2 border-[#f7f8f4] bg-[#e7dff1] text-[10px] font-bold text-[#705b8a]">R</span></span><span>{t('trusted')}</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-[620px]">
          <div className="absolute -right-16 -top-16 size-72 rounded-full bg-[#e6eee0] blur-3xl" />
          <div className="absolute -bottom-12 -left-10 size-52 rounded-full bg-[#dbe9df] blur-3xl" />
          <div className="relative rounded-[26px] border border-[#e3e9e0] bg-white p-4 shadow-[0_32px_100px_rgba(35,70,50,.12)] sm:p-6">
            <div className="flex items-center justify-between border-b border-[#edf0eb] pb-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#98a39a]">{t('demoDate')}</p><p className="mt-1 text-sm font-semibold text-[#214637]">{t('mockRestaurantOverview')}</p></div><span className="rounded-full bg-[#f0f6ee] px-3 py-1.5 text-[10px] font-bold text-[#4c805d]">{t('demoPreview')}</span></div>
            <div className="grid grid-cols-3 gap-2.5 py-5 sm:gap-3"><MetricTile label={t('salesLabel')} value="฿28,450" change="+12.8%" /><MetricTile label={t('ordersLabel')} value="186" change="+8.2%" /><MetricTile label={t('stockAlertsLabel')} value="3" change={t('needsReview')} alert /></div>
            <div className="rounded-2xl bg-[#f8faf7] p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold text-[#355344]">{t('weeklySales')}</p><p className="mt-1 text-[10px] text-[#a0aaa1]">{t('weeklyTrendSub')}</p></div><span className="rounded-lg border border-[#e6ebe5] bg-white px-2.5 py-1.5 text-[10px] font-medium text-[#68776d]">{t('thisWeekShort')}⌄</span></div><MiniChart t={t} /></div>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-[#edf0eb] p-3.5"><div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fff5e6] text-[#bd873a]"><ShoppingBasket size={17} /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#294839]">Chicken breast</p><p className="mt-0.5 text-[10px] text-[#99a49b]">3.2 kg {t('remaining')} · {t('lowStock')}</p></div></div><span className="shrink-0 rounded-full bg-[#fff4e4] px-2.5 py-1 text-[10px] font-semibold text-[#a97128]">{t('orderTodayShort')}</span></div>
            <div className="absolute -left-5 top-[29%] hidden items-center gap-2.5 rounded-2xl border border-[#edf0eb] bg-white px-3.5 py-3 shadow-[0_12px_32px_rgba(40,75,53,.12)] sm:flex"><span className="flex size-8 items-center justify-center rounded-xl bg-[#edf5ea] text-[#53805b]"><PackageCheck size={16} /></span><span><span className="block text-[10px] font-semibold text-[#53655a]">{t('stockGood')}</span><span className="mt-0.5 block text-[9px] text-[#a0aaa1]">{t('teamOnTrack')}</span></span></div>
            <div className="absolute -right-4 bottom-[16%] hidden items-center gap-2.5 rounded-2xl border border-[#edf0eb] bg-white px-3.5 py-3 shadow-[0_12px_32px_rgba(40,75,53,.12)] sm:flex"><span className="flex size-8 items-center justify-center rounded-xl bg-[#edf5ea] text-[#53805b]"><TrendingUp size={16} /></span><span><span className="block text-[10px] font-semibold text-[#53655a]">{t('demandForecast')}</span><span className="mt-0.5 block text-[9px] text-[#a0aaa1]">{t('readyToPlan')}</span></span></div>
          </div>
          <p className="mt-3 text-center text-[10px] text-[#9ca69e]">{t('allFiguresDemo')}</p>
        </div>
      </section>

      <section id="features" className="border-y border-[#e7ebe4] bg-white/70 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-10"><div className="mb-9 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#6d9476]">{t('featuresEyebrow')}</p><h2 className="max-w-xl text-3xl font-semibold tracking-[-0.04em] text-[#183c2e] md:text-4xl">{t('featureTitle')}</h2></div><p className="max-w-sm text-sm leading-6 text-[#77837b]">{t('kitchenCopy')}</p></div>
          <div className="grid gap-4 md:grid-cols-3"><FeatureCard icon={<Boxes size={19} />} title={t('featureInventory')} copy={t('featureInventoryCopy')} /><FeatureCard icon={<BarChart3 size={19} />} title={t('featureForecast')} copy={t('featureForecastCopy')} /><FeatureCard icon={<TrendingUp size={19} />} title={t('featureSales')} copy={t('featureSalesCopy')} /></div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24"><div className="mb-10 text-center"><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#6d9476]">{t('stepsEyebrow')}</p><h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#183c2e] md:text-4xl">{t('howTitle')}</h2></div><div className="grid gap-4 md:grid-cols-3"><Step t={t} number="01" title={t('howOne')} copy={t('howOneCopy')} /><Step t={t} number="02" title={t('howTwo')} copy={t('howTwoCopy')} /><Step t={t} number="03" title={t('howThree')} copy={t('howThreeCopy')} /></div><div className="mt-12 flex flex-col items-center gap-4 rounded-[28px] bg-[#1b4838] px-6 py-10 text-center text-white md:py-14"><span className="flex size-11 items-center justify-center rounded-full bg-white/10 text-[#d8eddb]"><Leaf size={19} /></span><h3 className="max-w-xl text-2xl font-semibold tracking-tight md:text-3xl">{t('tagline')}</h3><Link href="/register" className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#204a38] transition hover:bg-[#edf4ec]">{t('startFree')}<ArrowRight size={15} /></Link></div></section>
      <footer className="border-t border-[#e7ebe4] bg-white/60"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-7 text-xs text-[#849087] md:flex-row md:px-10"><Link href="/" className="font-semibold text-[#365344]">SmartStock AI</Link><span>{t('footer')}</span><span>© 2026 SmartStock AI</span></div></footer>
    </main>
  )
}

function MetricTile({ label, value, change, alert = false }: { label: string; value: string; change: string; alert?: boolean }) {
  return <div className="rounded-xl border border-[#eef1ec] bg-white p-2.5 sm:p-3.5"><p className="truncate text-[9px] font-medium text-[#919d93] sm:text-[10px]">{label}</p><p className={`mt-1.5 text-base font-semibold tracking-tight sm:text-xl ${alert ? 'text-[#a87532]' : 'text-[#234535]'}`}>{value}</p><p className={`mt-1 text-[9px] font-semibold sm:text-[10px] ${alert ? 'text-[#b2813d]' : 'text-[#65a171]'}`}>{change}</p></div>
}

function MiniChart({ t }: { t: (key: import('@/lib/demo-data').TranslationKey) => string }) {
  const heights = [32, 47, 38, 66, 57, 78, 91]
  const days = t('weekdaysShort').split(',')
  return <div className="flex h-[105px] items-end gap-2 border-b border-[#e9eee7] px-1 sm:h-[122px] sm:gap-3">{heights.map((height, index) => <div key={index} className="group flex h-full flex-1 flex-col items-center justify-end gap-2"><div className={`w-full max-w-10 rounded-t-md transition-colors ${index === 5 ? 'bg-[#397454]' : 'bg-[#d9e9d9] group-hover:bg-[#8fb49a]'}`} style={{ height: `${height}%` }} /><span className="mb-1 text-[9px] text-[#9aa59c]">{days[index]}</span></div>)}</div>
}

function FeatureCard({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <article className="rounded-[22px] border border-[#e8ece6] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(39,72,51,.07)]"><span className="flex size-10 items-center justify-center rounded-xl bg-[#edf5ed] text-[#3f7855]">{icon}</span><h3 className="mt-5 text-base font-semibold text-[#274536]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#7b887e]">{copy}</p></article>
}

function Step({ number, title, copy, t }: { number: string; title: string; copy: string; t: (key: import('@/lib/demo-data').TranslationKey) => string }) {
  return <article className="rounded-[22px] border border-[#e8ece6] bg-white p-6"><span className="font-mono text-xs font-semibold text-[#70a17a]">{number}</span><h3 className="mt-5 text-lg font-semibold text-[#274536]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#7b887e]">{copy}</p><span className="mt-5 flex items-center gap-1 text-[10px] font-medium text-[#92a095]"><Check size={13} />{t('noGuesswork')}</span></article>
}
