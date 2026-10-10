export type DemoIngredient = {
  name: string
  category: string
  stock: number
  unit: string
  status: 'Healthy' | 'Low stock' | 'Critical'
  supplier: string
}

export const demoIngredients: DemoIngredient[] = [
  { name: 'Jasmine rice', category: 'Dry goods', stock: 18, unit: 'kg', status: 'Healthy', supplier: 'Siam Fresh Co.' },
  { name: 'Chicken breast', category: 'Meat & poultry', stock: 3.2, unit: 'kg', status: 'Low stock', supplier: 'Farm to Table' },
  { name: 'Fresh milk', category: 'Dairy', stock: 1.5, unit: 'L', status: 'Critical', supplier: 'Daily Dairy' },
  { name: 'Thai basil', category: 'Produce', stock: 2.4, unit: 'kg', status: 'Low stock', supplier: 'Siam Fresh Co.' },
  { name: 'Coconut milk', category: 'Pantry', stock: 12, unit: 'cans', status: 'Healthy', supplier: 'Market Pantry' },
]

export const demoSales = [
  { day: 'Mon', sales: 21800, orders: 124 },
  { day: 'Tue', sales: 24600, orders: 139 },
  { day: 'Wed', sales: 22100, orders: 128 },
  { day: 'Thu', sales: 29100, orders: 161 },
  { day: 'Fri', sales: 34700, orders: 192 },
  { day: 'Sat', sales: 41200, orders: 234 },
  { day: 'Sun', sales: 36800, orders: 208 },
]

export const demoMenuItems = [
  { name: 'Basil chicken rice', category: 'Rice plates', price: '฿89', recipes: 5, sales: 186 },
  { name: 'Green curry chicken', category: 'Curry', price: '฿129', recipes: 8, sales: 142 },
  { name: 'Coconut latte', category: 'Drinks', price: '฿95', recipes: 3, sales: 128 },
  { name: 'Mango sticky rice', category: 'Dessert', price: '฿119', recipes: 4, sales: 86 },
]

export const demoPurchases = [
  { ingredient: 'Chicken breast', quantity: '12 kg', supplier: 'Farm to Table', urgency: 'Order today' },
  { ingredient: 'Fresh milk', quantity: '8 L', supplier: 'Daily Dairy', urgency: 'Order today' },
  { ingredient: 'Thai basil', quantity: '5 kg', supplier: 'Siam Fresh Co.', urgency: 'Within 2 days' },
]

export const demoSuppliers = [
  { name: 'Siam Fresh Co.', contact: 'orders@siamfresh.example', lead: '1 day', items: 8, status: 'Active' },
  { name: 'Farm to Table', contact: 'hello@farmtable.example', lead: '2 days', items: 4, status: 'Active' },
  { name: 'Daily Dairy', contact: 'sales@dailydairy.example', lead: '1 day', items: 3, status: 'Active' },
]

export const demoImportHistory = [
  { file: 'sales-september.csv', date: '24 Sep 2025', rows: '1,248', status: 'Imported' },
  { file: 'sales-august.csv', date: '31 Aug 2025', rows: '1,106', status: 'Imported' },
  { file: 'pos-export-07.csv', date: '29 Jul 2025', rows: '986', status: 'Imported' },
]

export const demoPurchaseOrders = [
  { id: 'PO-2025-018', supplier: 'Siam Fresh Co.', date: '24 Sep 2025', items: 4, total: '฿2,840', status: 'Pending' },
  { id: 'PO-2025-017', supplier: 'Farm to Table', date: '22 Sep 2025', items: 3, total: '฿1,960', status: 'In transit' },
  { id: 'PO-2025-016', supplier: 'Daily Dairy', date: '20 Sep 2025', items: 2, total: '฿860', status: 'Received' },
]

export const demoForecast = [
  { ingredient: 'Chicken breast', predicted: '18.4 kg', onHand: '3.2 kg', suggested: '18 kg', confidence: 'High' },
  { ingredient: 'Jasmine rice', predicted: '26 kg', onHand: '18 kg', suggested: '12 kg', confidence: 'High' },
  { ingredient: 'Thai basil', predicted: '6.2 kg', onHand: '2.4 kg', suggested: '5 kg', confidence: 'Medium' },
  { ingredient: 'Fresh milk', predicted: '12 L', onHand: '1.5 L', suggested: '12 L', confidence: 'Medium' },
]

export const demoMetric = (value: string, label: string, change: string, icon: string) => ({ value, label, change, icon })

export const isDemoData = true
export const demoDataNotice = 'This is sample data for preview only. Connect your POS and inventory to see your own restaurant data.'

export const navigationItems = [
  { href: '/dashboard', key: 'dashboard', icon: 'dashboard' },
  { href: '/inventory', key: 'inventory', icon: 'inventory' },
  { href: '/menu', key: 'menu', icon: 'menu' },
  { href: '/sales', key: 'sales', icon: 'sales' },
  { href: '/forecast', key: 'forecast', icon: 'forecast' },
  { href: '/purchase-orders', key: 'purchaseOrders', icon: 'orders' },
  { href: '/suppliers', key: 'suppliers', icon: 'suppliers' },
]

export const routeDetails = {
  '/dashboard': ['dashboardTitle', 'dashboardSubtitle'],
  '/inventory': ['inventoryTitle', 'inventorySubtitle'],
  '/menu': ['menuTitle', 'menuSubtitle'],
  '/sales': ['salesTitle', 'salesSubtitle'],
  '/forecast': ['forecastTitle', 'forecastSubtitle'],
  '/purchase-orders': ['ordersTitle', 'ordersSubtitle'],
  '/suppliers': ['suppliersTitle', 'suppliersSubtitle'],
  '/settings': ['settingsTitle', 'settingsSubtitle'],
  '/profile': ['profileTitle', 'profileSubtitle'],
} as const

export type RoutePath = keyof typeof routeDetails
export type TranslationKey = keyof typeof translations.en

export const translations = {
  en: {
    brand: 'SmartStock AI', tagline: 'Know what to buy, before you run out.',
    dashboard: 'Overview', inventory: 'Inventory', menu: 'Menu & recipes', sales: 'Sales imports', forecast: 'Forecast & buying', purchaseOrders: 'Purchase orders', suppliers: 'Suppliers', settings: 'Restaurant settings', profile: 'Your profile',
    dashboardTitle: 'Overview', dashboardSubtitle: 'Here’s what’s happening at your restaurant today.',
    inventoryTitle: 'Inventory', inventorySubtitle: 'Keep every ingredient in check, without the guesswork.',
    menuTitle: 'Menu & recipes', menuSubtitle: 'Connect what you sell to what you stock.',
    salesTitle: 'Sales imports', salesSubtitle: 'Bring your POS history together for clearer decisions.',
    forecastTitle: 'Forecast & buying', forecastSubtitle: 'Plan your next order with transparent demand forecasts.',
    ordersTitle: 'Purchase orders', ordersSubtitle: 'Track orders from supplier to receiving dock.',
    suppliersTitle: 'Suppliers', suppliersSubtitle: 'Keep your suppliers and lead times in one place.',
    settingsTitle: 'Restaurant settings', settingsSubtitle: 'Manage your restaurant workspace and preferences.',
    profileTitle: 'Your profile', profileSubtitle: 'Manage your account details and access.',
    search: 'Search', demo: 'DEMO DATA', demoNote: 'These are sample records for preview only. Connect your POS and inventory to see your own restaurant data.',
    today: 'Today', thisWeek: 'This week', thisMonth: 'This month', netSales: 'Net sales', ordersCount: 'Orders', ingredients: 'Ingredients', needsAttention: 'Need attention', weeklySales: 'Sales this week', bestSellers: 'Top-selling dishes', stockAlerts: 'Stock alerts', viewAll: 'View all', lowStock: 'Low stock', critical: 'Critical', healthy: 'Healthy',
    newIngredient: 'Add ingredient', addProduct: 'Add menu item', uploadSales: 'Import sales CSV', runForecast: 'Generate forecast', createOrder: 'New purchase order', addSupplier: 'Add supplier', edit: 'Edit', action: 'Actions', name: 'Name', category: 'Category', stock: 'In stock', supplier: 'Supplier', status: 'Status', price: 'Price', recipeItems: 'Recipe items', sold: 'Sold this month', contact: 'Contact', leadTime: 'Lead time', items: 'Items', file: 'File', importedAt: 'Imported', rows: 'Rows', importStatus: 'Import status', predictedNeed: 'Predicted need', onHand: 'On hand', suggestedOrder: 'Suggested order', confidence: 'Confidence', orderId: 'Order ID', date: 'Date', total: 'Total',
    weeklyTrend: 'Daily sales trend', weeklyTrendSub: 'Net sales · Thai baht', demoBanner: 'Preview workspace', demoBannerSub: 'All values below are demo data. They are not connected to a live restaurant account.',
    getStarted: 'Get started', logIn: 'Log in', startFree: 'Start free', seeHow: 'See how it works', trusted: 'Built for independent restaurants', heroEyebrow: 'RESTAURANT OPERATIONS, IN BETTER BALANCE', heroHeadline: 'Stock smarter.\nServe without pause.', heroCopy: 'Know what to prep, what to buy, and when — with a clear view of your restaurant’s inventory and sales.', featureTitle: 'Fewer surprises. Better service.', featureInventory: 'Stay ahead of low stock', featureInventoryCopy: 'See what’s running low before it interrupts service.', featureForecast: 'Plan purchases with confidence', featureForecastCopy: 'Turn real sales and recipes into understandable buying suggestions.', featureSales: 'One clear picture of your sales', featureSalesCopy: 'Bring your POS exports together and spot the trends that matter.', howTitle: 'A calmer way to run the kitchen', howOne: 'Connect the dots', howOneCopy: 'Add ingredients, suppliers, menu items, and recipes.', howTwo: 'Bring in your sales', howTwoCopy: 'Import a CSV from your point-of-sale system.', howThree: 'Make your next move', howThreeCopy: 'See demand forecasts and buying suggestions, with the math explained.', footer: 'A clearer view of what’s next.', mockRestaurantOverview: 'Restaurant overview', demoPreview: 'DEMO PREVIEW', salesLabel: 'Net sales', ordersLabel: 'Orders', stockAlertsLabel: 'Stock alerts', needsReview: 'Needs review', stockGood: 'Stock looking good', teamOnTrack: 'Your team is on track', demandForecast: 'Demand forecast', readyToPlan: 'Ready to plan ahead', remaining: 'remaining', orderTodayShort: 'Order today', thisWeekShort: 'This week', vsLastWeek: 'vs last week', allFiguresDemo: 'All figures shown are sample preview data.', noGuesswork: 'No guesswork', kitchenCopy: 'A thoughtful workspace for the people who keep restaurants running.', sampleWorkspaceOnly: 'Sample workspace only. No account data is connected.', recipeHelp: 'Recipes link each menu item to its ingredient quantities. Real recipes are required before forecasts can convert product demand into ingredient demand.', csvPreview: 'CSV format preview', transactionId: 'transaction_id', productColumn: 'product', quantityColumn: 'quantity', export: 'Export', refresh: 'Refresh', receiveStock: 'Receive', recordsCount: 'records', showing: 'Showing', of: 'of', page: 'Page', connectedDays: 'days connected', daysCount: 'days', categoryCafe: 'Cafe & casual dining', city: 'Bangkok, Thailand', noHistory: 'No verified sales history is connected.', selectType: 'Select a type', cafe: 'Cafe', restaurant: 'Restaurant', bakery: 'Bakery', shabuBuffetBbq: 'Shabu, buffet & BBQ', weekDays: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', weekdaysShort: 'M,T,W,T,F,S,S', demoDate: 'SUNDAY, OCTOBER 5', featuresEyebrow: 'SMARTER, FROM STOCK TO SERVICE', stepsEyebrow: 'THREE STEPS TO CLARITY', recipeTab: 'Recipes', recipeIngredients: 'ingredients', soldCount: 'sold', stockAttention: '3 ingredients need attention', receiveNote: 'Receiving an order will update inventory exactly once after backend operations are implemented.', footerDemoStatus: 'Demo data only · Supabase not connected', preview: 'Preview', previewWorkspace: 'Preview workspace', thaiLanguage: 'Thai', thaiBaht: 'THB · Thai baht',
    signInTitle: 'Welcome back', signInCopy: 'Sign in to your SmartStock workspace.', signUpTitle: 'Create your account', signUpCopy: 'Start building a clearer picture of your restaurant.', email: 'Email address', password: 'Password', fullName: 'Full name', restaurantName: 'Restaurant name', forgotPassword: 'Forgot password?', noAccount: 'New to SmartStock?', haveAccount: 'Already have an account?', continue: 'Continue', createAccount: 'Create account', or: 'or', authDemoNotice: 'Your account is protected by Supabase Auth.', accountTitle: 'Reset your password', accountCopy: 'Enter your email address and we’ll send you a secure password reset link.', onboardingTitle: 'Let’s set up your restaurant', onboardingCopy: 'A few details will make SmartStock feel like your own.', restaurantType: 'Restaurant type', location: 'City or region', currency: 'Currency', onboardingDemoNotice: 'Restaurant details are saved securely to your workspace.', next: 'Continue setup', authPrivacyNotice: 'Your credentials are securely managed by Supabase Auth.', invalidCredentials: 'Invalid email or password.', confirmYourEmail: 'Confirm your email using the link we sent before signing in.', authRateLimit: 'Too many attempts. Wait a moment and try again.', unexpectedAuthError: 'We couldn’t complete that request. Please try again.', recoveryEmailSent: 'If an account matches that email, a password reset link is on its way.', confirmationEmailSent: 'Check your inbox for a confirmation link to finish creating your account.', invalidFullName: 'Enter a name using 1–120 characters.', sendResetLink: 'Send reset link', working: 'Please wait…', restaurantAlreadyCreated: 'A restaurant workspace already exists for your account. Refresh to continue.', onboardingSaveError: 'We couldn’t save your restaurant details. Please try again.', passwordUpdateTitle: 'Choose a new password', passwordUpdateCopy: 'Use at least 6 characters for your new password.', newPassword: 'New password', confirmPassword: 'Confirm password', passwordMismatch: 'The passwords do not match.', passwordTooShort: 'Use at least 6 characters for your password.', passwordUpdated: 'Your password has been updated.', savePassword: 'Save new password', authLinkErrorTitle: 'This link is no longer valid', authLinkErrorCopy: 'Request a fresh email link and try again. For security, each link can only be used once.', requestNewLink: 'Request a new link',
    comingSoon: 'Ready for the next stage', notConnected: 'This section is a frontend preview. Connect Supabase and authentication before entering real business data.', saveChanges: 'Save changes', restaurantDetails: 'Restaurant details', workspacePreferences: 'Workspace preferences', defaultLanguage: 'Default language', currentWorkspace: 'Current workspace', teamAccess: 'Team access', ownerRole: 'Owner', managerRole: 'Manager', memberRole: 'Member', viewerRole: 'Viewer', plan: 'Preview plan', connectedStatus: 'Not connected', connectLater: 'Supabase connection is not configured yet.', profileInfo: 'Profile information', signOut: 'Sign out',
    period: 'Forecast window', days: 'Next 7 days', forecastWarning: 'Sample forecast only', forecastWarningCopy: 'Real forecasts require imported sales history and recipes. Recommendations are examples, not purchasing advice.', historicalData: 'Historical sales', insufficient: 'No verified sales history is connected.', confidenceHigh: 'High', confidenceMedium: 'Medium', confidenceLow: 'Low',
    importTitle: 'Import a POS export', importCopy: 'Upload your sales CSV to review its structure and map columns.', chooseFile: 'Choose CSV file', selectFile: 'No file selected', importNeedsSetup: 'CSV validation and saving will be available after the database is connected.', importHistory: 'Import history', records: 'records', imported: 'Imported', pending: 'Pending', inTransit: 'In transit', received: 'Received', orderToday: 'Order today', withinDays: 'Within 2 days',
    products: 'Menu items', purchaseSuggestions: 'Suggested purchases', openOrders: 'Open orders', ready: 'Ready', comingStage: 'Available in a future stage', alerts: 'Alerts',
  },
  th: {
    brand: 'SmartStock AI', tagline: 'รู้ก่อนหมด วางแผนสั่งซื้อได้ทันเวลา',
    dashboard: 'ภาพรวม', inventory: 'คลังวัตถุดิบ', menu: 'เมนูและสูตรอาหาร', sales: 'นำเข้ายอดขาย', forecast: 'พยากรณ์และสั่งซื้อ', purchaseOrders: 'ใบสั่งซื้อ', suppliers: 'ซัพพลายเออร์', settings: 'ตั้งค่าร้านอาหาร', profile: 'โปรไฟล์ของคุณ',
    dashboardTitle: 'ภาพรวม', dashboardSubtitle: 'ภาพรวมสิ่งที่เกิดขึ้นในร้านอาหารของคุณวันนี้',
    inventoryTitle: 'คลังวัตถุดิบ', inventorySubtitle: 'ติดตามวัตถุดิบทุกอย่างได้อย่างมั่นใจ',
    menuTitle: 'เมนูและสูตรอาหาร', menuSubtitle: 'เชื่อมโยงเมนูที่ขายกับวัตถุดิบที่ใช้',
    salesTitle: 'นำเข้ายอดขาย', salesSubtitle: 'รวมประวัติจากระบบขายเพื่อวางแผนได้ชัดเจนขึ้น',
    forecastTitle: 'พยากรณ์และสั่งซื้อ', forecastSubtitle: 'วางแผนคำสั่งซื้อถัดไปจากการคาดการณ์ที่เข้าใจง่าย',
    ordersTitle: 'ใบสั่งซื้อ', ordersSubtitle: 'ติดตามคำสั่งซื้อตั้งแต่ซัพพลายเออร์จนถึงร้าน',
    suppliersTitle: 'ซัพพลายเออร์', suppliersSubtitle: 'จัดการซัพพลายเออร์และระยะเวลาจัดส่งในที่เดียว',
    settingsTitle: 'ตั้งค่าร้านอาหาร', settingsSubtitle: 'จัดการพื้นที่ทำงานและการตั้งค่าของร้าน',
    profileTitle: 'โปรไฟล์ของคุณ', profileSubtitle: 'จัดการรายละเอียดบัญชีและสิทธิ์การเข้าถึง',
    search: 'ค้นหา', demo: 'ข้อมูลตัวอย่าง', demoNote: 'ข้อมูลต่อไปนี้เป็นตัวอย่างสำหรับดูหน้าจอเท่านั้น เชื่อมต่อ POS และคลังสินค้าของคุณเพื่อดูข้อมูลจริง',
    today: 'วันนี้', thisWeek: 'สัปดาห์นี้', thisMonth: 'เดือนนี้', netSales: 'ยอดขายสุทธิ', ordersCount: 'ออเดอร์', ingredients: 'วัตถุดิบ', needsAttention: 'ต้องตรวจสอบ', weeklySales: 'ยอดขายสัปดาห์นี้', bestSellers: 'เมนูขายดี', stockAlerts: 'แจ้งเตือนสต็อก', viewAll: 'ดูทั้งหมด', lowStock: 'ใกล้หมด', critical: 'วิกฤต', healthy: 'เพียงพอ',
    newIngredient: 'เพิ่มวัตถุดิบ', addProduct: 'เพิ่มเมนู', uploadSales: 'นำเข้า CSV ยอดขาย', runForecast: 'สร้างการพยากรณ์', createOrder: 'สร้างใบสั่งซื้อ', addSupplier: 'เพิ่มซัพพลายเออร์', edit: 'แก้ไข', action: 'การดำเนินการ', name: 'ชื่อ', category: 'หมวดหมู่', stock: 'คงเหลือ', supplier: 'ซัพพลายเออร์', status: 'สถานะ', price: 'ราคา', recipeItems: 'รายการวัตถุดิบ', sold: 'ขายเดือนนี้', contact: 'ติดต่อ', leadTime: 'ระยะเวลาจัดส่ง', items: 'รายการ', file: 'ไฟล์', importedAt: 'นำเข้าเมื่อ', rows: 'จำนวนแถว', importStatus: 'สถานะการนำเข้า', predictedNeed: 'คาดว่าจะใช้', onHand: 'คงเหลือ', suggestedOrder: 'แนะนำให้สั่ง', confidence: 'ความเชื่อมั่น', orderId: 'เลขที่ใบสั่งซื้อ', date: 'วันที่', total: 'รวม',
    weeklyTrend: 'แนวโน้มยอดขายรายวัน', weeklyTrendSub: 'ยอดขายสุทธิ · บาท', demoBanner: 'พื้นที่ทดลองใช้งาน', demoBannerSub: 'ตัวเลขทั้งหมดเป็นข้อมูลตัวอย่าง ไม่ได้เชื่อมต่อกับบัญชีร้านอาหารจริง',
    getStarted: 'เริ่มต้นใช้งาน', logIn: 'เข้าสู่ระบบ', startFree: 'เริ่มใช้งานฟรี', seeHow: 'ดูวิธีการทำงาน', trusted: 'สร้างมาเพื่อร้านอาหารอิสระ', heroEyebrow: 'จัดการร้านอาหารอย่างสมดุล', heroHeadline: 'จัดการสต็อกอย่างฉลาด\nพร้อมเสิร์ฟได้ทุกเวลา', heroCopy: 'รู้ว่าควรเตรียมอะไร ซื้ออะไร และเมื่อไหร่ — ด้วยภาพรวมยอดขายและคลังวัตถุดิบที่ชัดเจน', featureTitle: 'ลดเรื่องไม่คาดคิด เพิ่มบริการที่ดี', featureInventory: 'รู้ก่อนวัตถุดิบใกล้หมด', featureInventoryCopy: 'ตรวจสอบวัตถุดิบที่กำลังจะหมดก่อนกระทบการให้บริการ', featureForecast: 'วางแผนสั่งซื้ออย่างมั่นใจ', featureForecastCopy: 'แปลงยอดขายและสูตรอาหารจริงเป็นคำแนะนำที่เข้าใจง่าย', featureSales: 'เห็นภาพยอดขายในที่เดียว', featureSalesCopy: 'รวมไฟล์จาก POS และดูแนวโน้มที่สำคัญ', howTitle: 'จัดการครัวให้ราบรื่นกว่าเดิม', howOne: 'เชื่อมโยงข้อมูล', howOneCopy: 'เพิ่มวัตถุดิบ ซัพพลายเออร์ เมนู และสูตรอาหาร', howTwo: 'นำเข้ายอดขาย', howTwoCopy: 'นำเข้าไฟล์ CSV จากระบบขายของคุณ', howThree: 'วางแผนขั้นต่อไป', howThreeCopy: 'ดูการคาดการณ์และคำแนะนำ พร้อมคำอธิบายการคำนวณ', footer: 'เห็นภาพอนาคตได้ชัดเจนขึ้น', mockRestaurantOverview: 'ภาพรวมร้านอาหาร', demoPreview: 'ข้อมูลตัวอย่าง', salesLabel: 'ยอดขายสุทธิ', ordersLabel: 'ออเดอร์', stockAlertsLabel: 'แจ้งเตือนสต็อก', needsReview: 'ต้องตรวจสอบ', stockGood: 'สต็อกอยู่ในระดับดี', teamOnTrack: 'ทีมของคุณทำได้ตามแผน', demandForecast: 'การพยากรณ์ความต้องการ', readyToPlan: 'พร้อมวางแผนล่วงหน้า', remaining: 'คงเหลือ', orderTodayShort: 'สั่งซื้อวันนี้', thisWeekShort: 'สัปดาห์นี้', vsLastWeek: 'เทียบกับสัปดาห์ก่อน', allFiguresDemo: 'ตัวเลขทั้งหมดเป็นข้อมูลตัวอย่างสำหรับดูหน้าจอเท่านั้น', noGuesswork: 'ไม่ต้องคาดเดา', kitchenCopy: 'พื้นที่ทำงานที่ออกแบบมาเพื่อผู้ที่ทำให้ร้านอาหารดำเนินไปได้', sampleWorkspaceOnly: 'พื้นที่ร้านตัวอย่าง ยังไม่ได้เชื่อมต่อข้อมูลบัญชีจริง', recipeHelp: 'สูตรอาหารเชื่อมโยงเมนูแต่ละรายการกับปริมาณวัตถุดิบที่ใช้ ต้องมีสูตรอาหารจริงก่อนจึงจะแปลงยอดขายเป็นความต้องการวัตถุดิบได้', csvPreview: 'ตัวอย่างรูปแบบ CSV', transactionId: 'รหัสธุรกรรม', productColumn: 'สินค้า', quantityColumn: 'จำนวน', export: 'ส่งออก', refresh: 'รีเฟรช', receiveStock: 'รับสินค้า', recordsCount: 'รายการ', showing: 'แสดง', of: 'จาก', page: 'หน้า', connectedDays: 'วันที่เชื่อมต่อ', daysCount: 'วัน', categoryCafe: 'คาเฟ่และร้านอาหารทั่วไป', city: 'กรุงเทพฯ ประเทศไทย', noHistory: 'ยังไม่ได้เชื่อมต่อประวัติยอดขายที่ตรวจสอบแล้ว', selectType: 'เลือกประเภท', cafe: 'คาเฟ่', restaurant: 'ร้านอาหาร', bakery: 'เบเกอรี่', shabuBuffetBbq: 'ชาบู บุฟเฟต์ และบาร์บีคิว', weekDays: 'จ.,อ.,พ.,พฤ.,ศ.,ส.,อา.', weekdaysShort: 'จ,อ,พ,พฤ,ศ,ส,อา', demoDate: 'วันอาทิตย์ที่ 5 ตุลาคม', featuresEyebrow: 'จัดการตั้งแต่วัตถุดิบจนถึงการบริการ', stepsEyebrow: 'สามขั้นตอนสู่การวางแผนที่ชัดเจน', recipeTab: 'สูตรอาหาร', recipeIngredients: 'วัตถุดิบ', soldCount: 'รายการที่ขายได้', stockAttention: 'วัตถุดิบ 3 รายการต้องตรวจสอบ', receiveNote: 'เมื่อรับสินค้า ระบบจะปรับยอดคลังเพียงครั้งเดียวหลังจากเชื่อมต่อการทำงานฝั่งเซิร์ฟเวอร์', footerDemoStatus: 'ข้อมูลตัวอย่างเท่านั้น · ยังไม่ได้เชื่อมต่อ Supabase', preview: 'ตัวอย่าง', previewWorkspace: 'พื้นที่ทดลองใช้งาน', thaiLanguage: 'ไทย', thaiBaht: 'THB · บาท',
    signInTitle: 'ยินดีต้อนรับกลับ', signInCopy: 'เข้าสู่ระบบพื้นที่ทำงาน SmartStock ของคุณ', signUpTitle: 'สร้างบัญชีของคุณ', signUpCopy: 'เริ่มต้นมองเห็นภาพร้านอาหารของคุณได้ชัดเจนขึ้น', email: 'อีเมล', password: 'รหัสผ่าน', fullName: 'ชื่อ-นามสกุล', restaurantName: 'ชื่อร้านอาหาร', forgotPassword: 'ลืมรหัสผ่าน?', noAccount: 'ยังไม่มีบัญชี SmartStock?', haveAccount: 'มีบัญชีอยู่แล้ว?', continue: 'ดำเนินการต่อ', createAccount: 'สร้างบัญชี', or: 'หรือ', authDemoNotice: 'บัญชีของคุณได้รับการปกป้องด้วย Supabase Auth', accountTitle: 'ตั้งรหัสผ่านใหม่', accountCopy: 'กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่ที่ปลอดภัย', onboardingTitle: 'เริ่มตั้งค่าร้านอาหารของคุณ', onboardingCopy: 'ข้อมูลเล็กน้อยจะช่วยปรับ SmartStock ให้เข้ากับร้านของคุณ', restaurantType: 'ประเภทร้านอาหาร', location: 'จังหวัดหรือภูมิภาค', currency: 'สกุลเงิน', onboardingDemoNotice: 'บันทึกรายละเอียดร้านอาหารในพื้นที่ทำงานของคุณอย่างปลอดภัย', next: 'ตั้งค่าต่อ', authPrivacyNotice: 'จัดการข้อมูลเข้าสู่ระบบอย่างปลอดภัยด้วย Supabase Auth', invalidCredentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', confirmYourEmail: 'ยืนยันอีเมลจากลิงก์ที่ส่งให้ก่อนเข้าสู่ระบบ', authRateLimit: 'ทำรายการถี่เกินไป กรุณารอสักครู่แล้วลองใหม่', unexpectedAuthError: 'ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง', recoveryEmailSent: 'หากพบอีเมลนี้ในระบบ เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้', confirmationEmailSent: 'ตรวจสอบกล่องจดหมายเพื่อยืนยันและสร้างบัญชีให้เสร็จสมบูรณ์', invalidFullName: 'กรอกชื่อความยาว 1–120 ตัวอักษร', sendResetLink: 'ส่งลิงก์ตั้งรหัสผ่านใหม่', working: 'กำลังดำเนินการ…', restaurantAlreadyCreated: 'บัญชีนี้มีพื้นที่ร้านอาหารแล้ว โปรดรีเฟรชเพื่อดำเนินการต่อ', onboardingSaveError: 'บันทึกรายละเอียดร้านไม่สำเร็จ กรุณาลองอีกครั้ง', passwordUpdateTitle: 'ตั้งรหัสผ่านใหม่', passwordUpdateCopy: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', newPassword: 'รหัสผ่านใหม่', confirmPassword: 'ยืนยันรหัสผ่าน', passwordMismatch: 'รหัสผ่านไม่ตรงกัน', passwordTooShort: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', passwordUpdated: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', savePassword: 'บันทึกรหัสผ่านใหม่', authLinkErrorTitle: 'ลิงก์นี้ใช้ไม่ได้แล้ว', authLinkErrorCopy: 'ขอลิงก์ใหม่ทางอีเมลแล้วลองอีกครั้ง ลิงก์แต่ละรายการใช้ได้เพียงครั้งเดียวเพื่อความปลอดภัย', requestNewLink: 'ขอลิงก์ใหม่',
    comingSoon: 'เตรียมพร้อมสำหรับขั้นตอนถัดไป', notConnected: 'ส่วนนี้เป็นตัวอย่างหน้าจอ กรุณาเชื่อมต่อ Supabase และระบบยืนยันตัวตนก่อนเพิ่มข้อมูลธุรกิจจริง', saveChanges: 'บันทึกการเปลี่ยนแปลง', restaurantDetails: 'รายละเอียดร้านอาหาร', workspacePreferences: 'การตั้งค่าพื้นที่ทำงาน', defaultLanguage: 'ภาษาเริ่มต้น', currentWorkspace: 'พื้นที่ทำงานปัจจุบัน', teamAccess: 'สิทธิ์ทีม', ownerRole: 'เจ้าของ', managerRole: 'ผู้จัดการ', memberRole: 'สมาชิก', viewerRole: 'ผู้เข้าชม', plan: 'แพ็กเกจทดลอง', connectedStatus: 'ยังไม่เชื่อมต่อ', connectLater: 'ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase', profileInfo: 'ข้อมูลโปรไฟล์', signOut: 'ออกจากระบบ',
    period: 'ช่วงเวลาพยากรณ์', days: '7 วันถัดไป', forecastWarning: 'การพยากรณ์ตัวอย่างเท่านั้น', forecastWarningCopy: 'การพยากรณ์จริงต้องใช้ประวัติยอดขายและสูตรอาหารที่นำเข้า คำแนะนำนี้เป็นเพียงตัวอย่าง ไม่ใช่คำแนะนำในการสั่งซื้อจริง', historicalData: 'ยอดขายย้อนหลัง', insufficient: 'ยังไม่ได้เชื่อมต่อประวัติยอดขายที่ตรวจสอบแล้ว', confidenceHigh: 'สูง', confidenceMedium: 'ปานกลาง', confidenceLow: 'ต่ำ',
    importTitle: 'นำเข้าไฟล์ POS', importCopy: 'อัปโหลด CSV ยอดขายเพื่อตรวจสอบโครงสร้างและจับคู่คอลัมน์', chooseFile: 'เลือกไฟล์ CSV', selectFile: 'ยังไม่ได้เลือกไฟล์', importNeedsSetup: 'การตรวจสอบ CSV และการบันทึกจะเปิดใช้หลังเชื่อมต่อฐานข้อมูล', importHistory: 'ประวัติการนำเข้า', records: 'รายการ', imported: 'นำเข้าแล้ว', pending: 'รอดำเนินการ', inTransit: 'กำลังจัดส่ง', received: 'รับสินค้าแล้ว', orderToday: 'สั่งซื้อวันนี้', withinDays: 'ภายใน 2 วัน',
    products: 'เมนู', purchaseSuggestions: 'รายการแนะนำให้ซื้อ', openOrders: 'คำสั่งซื้อที่เปิดอยู่', ready: 'พร้อม', comingStage: 'จะเปิดใช้ในขั้นตอนถัดไป', alerts: 'แจ้งเตือน',
  },
} satisfies Record<'en' | 'th', Record<string, string>>
export type Locale = keyof typeof translations
