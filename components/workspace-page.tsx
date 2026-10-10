'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CalendarDays, ClipboardList, Plus, TrendingUp, Warehouse } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RoutePath, TranslationKey } from '@/lib/demo-data'
import { routeDetails } from '@/lib/demo-data'
import { SalesImportManager } from '@/components/sales-import-manager'
import { useLanguage } from '@/components/language-provider'
import type { WorkspacePageData } from '@/lib/workspace-data'

type Props = { path: RoutePath; data: WorkspacePageData }

export function WorkspacePage({ path, data }: Props) {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const [feedback, setFeedback] = useState('')
  const action = (label: string) => setFeedback(`${label} · ${t('comingStage')}`)
  const handlePrimaryAction = () => path === '/inventory'
    ? router.push('/inventory?add=1')
    : path === '/sales'
      ? document.getElementById('sales-import-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      : action(buttonLabel(path, t))
  const [titleKey, subtitleKey] = routeDetails[path]
  const title = path === '/dashboard' ? `สวัสดี ${data.profileName}` : t(titleKey as TranslationKey)
  const subtitle = t(subtitleKey as TranslationKey)
  const formatter = new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', { style: 'currency', currency: data.currency || 'THB' })

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-7 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-medium text-[#839087]">{data.restaurantName}</p>
          <h1 className="text-[26px] font-semibold tracking-[-.04em] text-[#1c3c2d] sm:text-[30px]">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-[#839087]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => action(t('today'))} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e3e9e1] bg-white px-3 text-xs font-medium text-[#627268] hover:border-[#b6cabb]"><CalendarDays size={14} />{t('thisWeek')}</button>
          <ActionButton onClick={handlePrimaryAction} label={buttonLabel(path, t)} />
        </div>
      </div>
      {feedback && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-[#e7e9d5] bg-[#fbfaed] px-4 py-3 text-xs text-[#786e3b]"><AlertTriangle size={15} aria-hidden="true" />{feedback}<button onClick={() => setFeedback('')} className="ml-auto font-semibold" aria-label="Dismiss">×</button></div>}
      <LiveWorkspaceContent path={path} data={data} t={t} locale={locale} formatter={formatter} />
    </>
  )
}

function buttonLabel(path: RoutePath, t: (key: TranslationKey) => string) {
  const labels: Record<RoutePath, TranslationKey> = {
    '/dashboard': 'runForecast',
    '/inventory': 'newIngredient',
    '/menu': 'addProduct',
    '/sales': 'uploadSales',
    '/forecast': 'runForecast',
    '/purchase-orders': 'createOrder',
    '/suppliers': 'addSupplier',
    '/settings': 'saveChanges',
    '/profile': 'saveChanges',
  }
  return t(labels[path])
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1b4838] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#143a2c]"><Plus size={14} />{label}</button>
}

function LiveWorkspaceContent({ path, data, t, locale, formatter }: { path: RoutePath; data: WorkspacePageData; t: (key: TranslationKey) => string; locale: 'en' | 'th'; formatter: Intl.NumberFormat }) {
  const dateFormatter = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium' })
  const date = (value: string | null) => value ? dateFormatter.format(new Date(value)) : '—'
  const displayStatus = (value: string) => {
    const normalized = value.toLowerCase().replaceAll('_', ' ')
    return normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }
  const emptyState = (label: string) => <p className="rounded-2xl border border-dashed border-[#dce5d9] bg-white px-5 py-8 text-center text-xs text-[#849087]">{locale === 'th' ? 'ยังไม่มีข้อมูลสำหรับรายการนี้' : label}</p>
  const money = (value: number) => formatter.format(value)

  if (path === '/dashboard') {
    const dashboard = data.dashboard
    const stats = [
      { label: t('netSales'), value: money(dashboard.weeklySales), icon: TrendingUp },
      { label: t('ordersCount'), value: formatter.format(dashboard.orderCount), icon: ClipboardList },
      { label: t('ingredients'), value: formatter.format(dashboard.ingredientCount), icon: Warehouse },
      { label: t('needsAttention'), value: formatter.format(dashboard.lowStockCount), icon: AlertTriangle },
    ]
    return <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <article key={stat.label} className="rounded-2xl border border-[#e8ece6] bg-white p-4 sm:p-5"><div className="flex items-start justify-between"><span className="text-[11px] font-medium text-[#829087]">{stat.label}</span><span className="flex size-8 items-center justify-center rounded-xl bg-[#edf5ed] text-[#4b8058]"><stat.icon size={16} /></span></div><p className="mt-3 text-[26px] font-semibold tracking-[-.04em] text-[#244634]">{stat.value}</p></article>)}</div>
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-2xl border border-[#e8ece6] bg-white p-4 sm:p-5"><h2 className="mb-4 text-sm font-semibold text-[#2d4b39]">{t('weeklyTrend')}</h2>{dashboard.salesSeries.length ? <div className="h-[225px] w-full" role="img" aria-label={t('weeklyTrend')}><ResponsiveContainer width="100%" height="100%"><LineChart data={dashboard.salesSeries} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}><CartesianGrid stroke="#edf1eb" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9aa49a', fontSize: 10 }} dy={9} /><YAxis tickFormatter={(value: number) => `${value / 1000}k`} axisLine={false} tickLine={false} tick={{ fill: '#9aa49a', fontSize: 10 }} /><Tooltip formatter={(value) => [money(Number(value)), t('netSales')]} contentStyle={{ border: '1px solid #e6ece3', borderRadius: 12, fontSize: 11 }} /><Line type="monotone" dataKey="sales" stroke="#43825a" strokeWidth={2.5} dot={{ r: 3, fill: '#43825a', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} isAnimationActive={false} /></LineChart></ResponsiveContainer></div> : emptyState('Sales will appear here after imported transactions are available.')}</section>
        <section className="rounded-2xl border border-[#e8ece6] bg-white p-4 sm:p-5"><h2 className="mb-4 text-sm font-semibold text-[#2d4b39]">{t('stockAlerts')}</h2>{dashboard.stockAlerts.length ? <div className="flex flex-col divide-y divide-[#eef1ec]">{dashboard.stockAlerts.map((item) => <div key={item.name} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#43594b]">{item.name}</p><p className="mt-0.5 text-[10px] text-[#9aa49b]">{item.category || item.unit}</p></div><div className="text-right"><p className="text-xs font-semibold text-[#526d59]">{formatter.format(item.stock)} {item.unit}</p><StatusBadge status={item.status} t={t} /></div></div>)}</div> : dashboard.ingredientCount === 0 ? emptyState('Add ingredients to see stock alerts for this restaurant.') : emptyState('No ingredients need attention right now.')}</section>
      </div>
      <div className="rounded-2xl border border-[#e8ece6] bg-white p-4 sm:p-5"><h2 className="mb-4 text-sm font-semibold text-[#2d4b39]">{t('bestSellers')}</h2>{dashboard.bestSellers.length ? <DataTable t={t} headers={[t('name'), t('category'), t('price'), t('sold')]} rows={dashboard.bestSellers.map((item) => [<span className="font-semibold text-[#395441]">{item.name}</span>, item.category || '—', money(item.price), formatter.format(item.sales)])} /> : emptyState('Best sellers will appear here when sales are imported.')}</div>
    </div>
  }

  if (path === '/menu') return data.menuItems.length ? <DataTable t={t} headers={[t('name'), t('category'), t('price'), t('recipeItems'), t('sold')]} rows={data.menuItems.map((item) => [<span className="font-semibold text-[#395441]">{item.name}</span>, item.category || '—', money(item.price), formatter.format(item.recipeCount), formatter.format(item.sold)])} /> : emptyState('No menu products have been added to this restaurant yet.')

  if (path === '/sales') return <SalesImportManager imports={data.salesImports} />

  if (path === '/forecast') return data.forecast.run ? <div className="flex flex-col gap-4"><p className="rounded-xl border border-[#e6ece2] bg-[#f0f5ed] px-4 py-3 text-xs text-[#47654c]">{t('period')}: {date(data.forecast.run.windowStart)} – {date(data.forecast.run.windowEnd)}</p>{data.forecast.items.length ? <DataTable t={t} headers={[t('name'), t('predictedNeed'), t('onHand'), t('suggestedOrder'), t('confidence')]} rows={data.forecast.items.map((item) => [<span className="font-semibold text-[#395441]">{item.name}</span>, `${formatter.format(item.predicted)} ${item.unit}`, `${formatter.format(item.onHand)} ${item.unit}`, `${formatter.format(item.suggested)} ${item.unit}`, item.confidence === null ? '—' : <ConfidenceBadge value={item.confidence >= 0.75 ? 'High' : item.confidence >= 0.45 ? 'Medium' : 'Low'} t={t} />])} /> : emptyState('No ingredient details were saved for the latest forecast.')}</div> : emptyState('No forecast has been generated for this restaurant yet.')

  if (path === '/purchase-orders') return data.purchaseOrders.length ? <DataTable t={t} headers={[t('orderId'), t('supplier'), t('date'), t('items'), t('total'), t('status')]} rows={data.purchaseOrders.map((item) => [<span className="font-semibold text-[#426148]">{item.number}</span>, item.supplier || '—', date(item.date), formatter.format(item.itemCount), money(item.total), <StatusBadge status={displayStatus(item.status)} t={t} />])} /> : emptyState('No purchase orders have been created for this restaurant yet.')

  if (path === '/suppliers') return data.suppliers.length ? <DataTable t={t} headers={[t('name'), t('contact'), t('leadTime'), t('items'), t('status')]} rows={data.suppliers.map((item) => [<span className="font-semibold text-[#395441]">{item.name}</span>, item.contact || '—', `${formatter.format(item.leadTime)} days`, formatter.format(item.itemCount), <StatusBadge status={displayStatus(item.status)} t={t} />])} /> : emptyState('No suppliers have been added to this restaurant yet.')

  if (path === '/settings') return <div className="max-w-3xl rounded-2xl border border-[#e8ece6] bg-white p-5 sm:p-6"><h2 className="text-sm font-semibold text-[#324d39]">{t('restaurantDetails')}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><PreviewField label={t('restaurantName')} value={data.restaurantName} /><PreviewField label={t('restaurantType')} value={data.restaurantType || '—'} /><PreviewField label={t('location')} value={data.location || '—'} /><PreviewField label={t('currency')} value={data.currency} /></div></div>

  if (path === '/profile') return <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]"><section className="rounded-2xl border border-[#e8ece6] bg-white p-5 sm:p-6"><div className="flex items-center gap-3 border-b border-[#edf0eb] pb-5"><span className="flex size-12 items-center justify-center rounded-full bg-[#dceadd] text-sm font-bold text-[#477355]">{data.profileName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'}</span><div><h2 className="text-sm font-semibold text-[#324d39]">{data.profileName}</h2><p className="mt-1 text-[11px] text-[#8a968c]">{data.profileEmail}</p></div></div><h3 className="mt-5 text-xs font-semibold text-[#49634e]">{t('profileInfo')}</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><PreviewField label={t('fullName')} value={data.profileName || '—'} /><PreviewField label={t('email')} value={data.profileEmail || '—'} /><PreviewField label={t('restaurantName')} value={data.restaurantName} /><PreviewField label={t('ownerRole')} value={data.role === 'owner' ? t('ownerRole') : data.role === 'manager' ? t('managerRole') : data.role === 'viewer' ? t('viewerRole') : t('memberRole')} /></div></section></div>

  return null
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-1.5"><span className="text-[10px] font-medium text-[#8d998e]">{label}</span><span className="rounded-xl border border-[#e9ede8] bg-[#fbfcfa] px-3 py-2.5 text-xs text-[#506253]">{value}</span></div>
}

function DataTable({ headers, rows, t }: { headers: string[]; rows: React.ReactNode[][]; t: (key: TranslationKey) => string }) {
  return <div className="overflow-hidden rounded-2xl border border-[#e8ece6] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-left"><thead><tr className="border-b border-[#edf0eb] bg-[#fafbf9]">{headers.map((header) => <th key={header} className="px-4 py-3 text-[10px] font-semibold text-[#8a968b] sm:px-5">{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-[#f0f2ee] last:border-0 hover:bg-[#fcfdfa]">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3.5 text-[11px] text-[#738075] sm:px-5">{cell}</td>)}</tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-[#edf0eb] px-4 py-3 text-[10px] text-[#99a399]"><span>{t('showing')} {rows.length} {t('of')} {rows.length} {t('recordsCount')}</span><span>{t('page')} 1 {t('of')} 1</span></div></div>
}

function StatusBadge({ status, t }: { status: string; t: (key: TranslationKey) => string }) {
  const isHealthy = status === 'Healthy' || status === 'Active' || status === 'Imported' || status === 'Received'
  const isCritical = status === 'Critical'
  const label = status === 'Healthy' || status === 'Active' ? t('healthy') : status === 'Low stock' ? t('lowStock') : status === 'Critical' ? t('critical') : status === 'Imported' ? t('imported') : status === 'Pending' ? t('pending') : status === 'In transit' ? t('inTransit') : status === 'Received' ? t('received') : status
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-semibold ${isHealthy ? 'bg-[#edf5ed] text-[#59805e]' : isCritical ? 'bg-[#fff0ed] text-[#b36254]' : 'bg-[#fff5e6] text-[#a47b3f]'}`}><span className={`size-1.5 rounded-full ${isHealthy ? 'bg-[#7aab7e]' : isCritical ? 'bg-[#d57f6f]' : 'bg-[#d4a459]'}`} />{label}</span>
}

function ConfidenceBadge({ value, t }: { value: string; t: (key: TranslationKey) => string }) {
  const label = value === 'High' ? t('confidenceHigh') : value === 'Medium' ? t('confidenceMedium') : t('confidenceLow')
  return <span className="inline-flex items-center gap-1.5 text-[10px] text-[#718276]"><span className={`size-1.5 rounded-full ${value === 'High' ? 'bg-[#68a271]' : value === 'Medium' ? 'bg-[#d0a15c]' : 'bg-[#bd7c68]'}`} />{label}</span>
}
