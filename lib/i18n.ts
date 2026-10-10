export type Locale = 'th' | 'en'

export function localize(locale: Locale, en: string, th: string) {
  return locale === 'th' ? th : en
}

export const copy = {
  appName: { en: 'SmartStock AI', th: 'SmartStock AI' },
  demo: { en: 'DEMO DATA', th: 'ข้อมูลตัวอย่าง' },
  dashboard: { en: 'Overview', th: 'ภาพรวม' },
  inventory: { en: 'Inventory', th: 'คลังวัตถุดิบ' },
  menu: { en: 'Menu & recipes', th: 'เมนูและสูตรอาหาร' },
  importSales: { en: 'Import sales', th: 'นำเข้ายอดขาย' },
  salesHistory: { en: 'Sales history', th: 'ประวัติยอดขาย' },
  forecast: { en: 'Forecast & buying', th: 'พยากรณ์และจัดซื้อ' },
  purchaseOrders: { en: 'Purchase orders', th: 'ใบสั่งซื้อ' },
  suppliers: { en: 'Suppliers', th: 'ซัพพลายเออร์' },
  settings: { en: 'Restaurant settings', th: 'ตั้งค่าร้านอาหาร' },
  profile: { en: 'My profile', th: 'โปรไฟล์ของฉัน' },
  restaurant: { en: 'Green Table Kitchen', th: 'ครัวกรีนเทเบิล' },
  demoRestaurant: { en: 'Bangkok · Demo workspace', th: 'กรุงเทพฯ · พื้นที่ตัวอย่าง' },
  today: { en: 'Today', th: 'วันนี้' },
  dashboardTitle: { en: 'Overview', th: 'ภาพรวม' },
  dashboardSubtitle: { en: 'Here\'s what\'s happening in your kitchen today.', th: 'สรุปภาพรวมการจัดการร้านของคุณในวันนี้' },
  salesToday: { en: 'Sales today', th: 'ยอดขายวันนี้' },
  stockValue: { en: 'Stock value', th: 'มูลค่าสต็อก' },
  lowStock: { en: 'Low stock items', th: 'วัตถุดิบใกล้หมด' },
  forecastAccuracy: { en: 'Forecast readiness', th: 'ความพร้อมของข้อมูล' },
  versusYesterday: { en: 'vs. yesterday', th: 'เทียบกับเมื่อวาน' },
  thisWeek: { en: 'Sales & demand', th: 'ยอดขายและความต้องการ' },
  lastSevenDays: { en: 'Illustrative demo · last 7 days', th: 'ตัวอย่างประกอบ · 7 วันที่ผ่านมา' },
  needsAttention: { en: 'Needs attention', th: 'รายการที่ต้องดูแล' },
  viewInventory: { en: 'View inventory', th: 'ดูคลังวัตถุดิบ' },
  recommended: { en: 'Recommended', th: 'แนะนำ' },
  recentOrders: { en: 'Recent purchase orders', th: 'ใบสั่งซื้อล่าสุด' },
  viewAll: { en: 'View all', th: 'ดูทั้งหมด' },
  demoNotice: { en: 'Preview only — sample values are not connected to a restaurant or database.', th: 'ตัวอย่างหน้าจอเท่านั้น — ข้อมูลนี้ไม่ได้เชื่อมต่อกับร้านอาหารหรือฐานข้อมูลจริง' },
  search: { en: 'Search ingredients, orders…', th: 'ค้นหาวัตถุดิบ ใบสั่งซื้อ…' },
  account: { en: 'Account', th: 'บัญชีผู้ใช้' },
  signOut: { en: 'Sign out', th: 'ออกจากระบบ' },
  language: { en: 'Language', th: 'ภาษา' },
  english: { en: 'English', th: 'English' },
  thai: { en: 'ไทย', th: 'ไทย' },
} as const

export type CopyKey = keyof typeof copy
export function t(locale: Locale, key: CopyKey) {
  return copy[key][locale]
}

export const defaultLocale: Locale = 'th'
export const locales: Locale[] = ['th', 'en']

export function localeTag(locale: Locale) {
  return locale === 'th' ? 'th-TH' : 'en-US'
}

export function formatCurrency(locale: Locale, amount: number) {
  return new Intl.NumberFormat(localeTag(locale), { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount)
}

export function formatCount(locale: Locale, value: number) {
  return new Intl.NumberFormat(localeTag(locale)).format(value)
}

export function formatDemoDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(localeTag(locale), { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`))
}
