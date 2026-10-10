export type ParsedSaleRow = {
  rowNumber: number
  transactionId: string | null
  productName: string
  quantity: number
  unitPrice: number
  soldAt: string
}

export type InvalidSaleRow = { rowNumber: number; reason: string }

const headerAliases = {
  transactionId: ['transaction_id', 'transaction id', 'order_id', 'order id', 'receipt_id', 'receipt id'],
  productName: ['product', 'product_name', 'product name', 'menu_item', 'menu item', 'item', 'item_name', 'item name'],
  quantity: ['quantity', 'qty', 'units'],
  unitPrice: ['unit_price', 'unit price', 'price', 'item_price', 'item price'],
  soldAt: ['sold_at', 'sold at', 'date', 'datetime', 'timestamp', 'sale_date', 'sale date'],
} as const

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let closedQuote = false

  const finishRow = () => {
    row.push(field)
    if (row.some((value) => value.trim() !== '')) rows.push(row)
    row = []
    field = ''
    closedQuote = false
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
        closedQuote = true
      } else {
        field += character
      }
      continue
    }

    if (closedQuote) {
      if (character === ',' ) {
        row.push(field)
        field = ''
        closedQuote = false
      } else if (character === '\n' || character === '\r') {
        if (character === '\r' && text[index + 1] === '\n') index += 1
        finishRow()
      } else if (character !== ' ' && character !== '\t') {
        throw new Error('The CSV contains invalid characters after a quoted field.')
      }
    } else if (character === '"') {
      if (field.length !== 0) throw new Error('The CSV contains a quote inside an unquoted field.')
      quoted = true
    } else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      finishRow()
    } else field += character
  }

  if (quoted) throw new Error('The CSV contains an unclosed quoted field.')
  if (row.length > 0 || field.length > 0 || closedQuote) finishRow()
  return rows
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function findColumn(headers: string[], aliases: readonly string[]) {
  const accepted = new Set(aliases.map(normalizeHeader))
  return headers.findIndex((header) => accepted.has(normalizeHeader(header)))
}

function parseDecimal(value: string, allowZero: boolean) {
  const input = value.trim()
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,4})?$/.test(input)) return null
  const parsed = Number(input.replaceAll(',', ''))
  if (!Number.isFinite(parsed) || parsed > 9_999_999_999.9999 || (allowZero ? parsed < 0 : parsed <= 0)) return null
  return parsed
}

export function parseSalesCsv(text: string) {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''))
  if (rows.length < 2) throw new Error('The CSV needs a header and at least one data row.')

  const headers = rows[0]
  const columns = {
    transactionId: findColumn(headers, headerAliases.transactionId),
    productName: findColumn(headers, headerAliases.productName),
    quantity: findColumn(headers, headerAliases.quantity),
    unitPrice: findColumn(headers, headerAliases.unitPrice),
    soldAt: findColumn(headers, headerAliases.soldAt),
  }
  const missing = (['productName', 'quantity', 'unitPrice', 'soldAt'] as const).filter((key) => columns[key] < 0)
  if (missing.length) {
    const labels: Record<(typeof missing)[number], string> = {
      productName: 'product',
      quantity: 'quantity',
      unitPrice: 'unit price',
      soldAt: 'sale date/time',
    }
    throw new Error(`Missing required CSV column${missing.length > 1 ? 's' : ''}: ${missing.map((key) => labels[key]).join(', ')}.`)
  }

  const validRows: ParsedSaleRow[] = []
  const invalidRows: InvalidSaleRow[] = []
  for (let index = 1; index < rows.length; index += 1) {
    const cells = rows[index]
    const rowNumber = index + 1
    if (cells.length !== headers.length) {
      invalidRows.push({ rowNumber, reason: 'row field count does not match the CSV header' })
      continue
    }
    const productName = (cells[columns.productName] ?? '').trim()
    const quantity = parseDecimal(cells[columns.quantity] ?? '', false)
    const unitPrice = parseDecimal(cells[columns.unitPrice] ?? '', true)
    const dateValue = (cells[columns.soldAt] ?? '').trim()
    const soldAtValue = Date.parse(dateValue)
    const transactionId = columns.transactionId < 0 ? '' : (cells[columns.transactionId] ?? '').trim()

    const problems: string[] = []
    if (!productName || productName.length > 160) problems.push('product is missing or longer than 160 characters')
    if (quantity === null) problems.push('quantity must be greater than zero with at most 4 decimals')
    if (unitPrice === null) problems.push('unit price must be non-negative with at most 4 decimals')
    if (!dateValue || !Number.isFinite(soldAtValue)) problems.push('sale date/time is invalid')
    if (transactionId.length > 200) problems.push('transaction ID is longer than 200 characters')

    if (problems.length) {
      invalidRows.push({ rowNumber, reason: problems.join('; ') })
      continue
    }

    validRows.push({
      rowNumber,
      transactionId: transactionId || null,
      productName,
      quantity: quantity as number,
      unitPrice: unitPrice as number,
      soldAt: new Date(soldAtValue).toISOString(),
    })
  }

  return { validRows, invalidRows }
}

export function saleFingerprint(row: Pick<ParsedSaleRow, 'transactionId' | 'productName' | 'quantity' | 'unitPrice' | 'soldAt'>) {
  if (!row.transactionId) return null
  return [
    row.transactionId.trim(),
    row.productName.trim().toLocaleLowerCase(),
    row.quantity.toFixed(4),
    row.unitPrice.toFixed(4),
    new Date(row.soldAt).toISOString(),
  ].join('\u001f')
}

export function saleFingerprintFromRecord(row: {
  transaction_id: string | null
  source_product_name: string
  quantity: number | string
  unit_price: number | string
  sold_at: string
}) {
  return saleFingerprint({
    transactionId: row.transaction_id,
    productName: row.source_product_name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    soldAt: new Date(row.sold_at).toISOString(),
  })
}

export function groupBy<T>(items: T[], getKey: (item: T) => string | null) {
  const grouped = new Map<string, T[]>()
  for (const item of items) {
    const key = getKey(item)
    if (key === null) continue
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }
  return grouped
}

export function summarizeInvalidRows(rows: InvalidSaleRow[]) {
  if (!rows.length) return null
  const shown = rows.slice(0, 50).map((row) => `${row.rowNumber}: ${row.reason}`).join(' | ')
  return `Skipped ${rows.length} invalid row${rows.length === 1 ? '' : 's'}: ${shown}${rows.length > 50 ? ' | additional rows omitted' : ''}`
}

export function sanitizeCsvFileName(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 255) || 'sales.csv'
}

export const MAX_SALES_CSV_BYTES = 2 * 1024 * 1024
export const MAX_SALES_CSV_ROWS = 2000

export function exceedsSalesRowLimit(text: string) {
  let newlineCount = 0
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '"' && text[index + 1] === '"' && quoted) {
      index += 1
    } else if (text[index] === '"') {
      quoted = !quoted
    } else if (!quoted && (text[index] === '\n' || text[index] === '\r')) {
      newlineCount += 1
      if (text[index] === '\r' && text[index + 1] === '\n') index += 1
      if (newlineCount > MAX_SALES_CSV_ROWS + 1) return true
    }
  }
  return false
}

export function validateSalesCsvRows(rowCount: number) {
  return rowCount <= MAX_SALES_CSV_ROWS
}

export function salesImportErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to validate this CSV file.'
}

export function salesImportSkippedMessage(duplicateCount: number) {
  return duplicateCount > 0 ? `Skipped ${duplicateCount} previously imported duplicate row${duplicateCount === 1 ? '' : 's'}.` : null
}

export function mergeImportMessages(invalidMessage: string | null, duplicateMessage: string | null) {
  return [invalidMessage, duplicateMessage].filter(Boolean).join(' ') || null
}

export function countFingerprints<T>(items: T[], getFingerprint: (item: T) => string | null) {
  const counts = new Map<string, number>()
  for (const item of items) {
    const fingerprint = getFingerprint(item)
    if (fingerprint) counts.set(fingerprint, (counts.get(fingerprint) ?? 0) + 1)
  }
  return counts
}

export function consumeExistingFingerprint<T>(items: T[], existingCounts: Map<string, number>, getFingerprint: (item: T) => string | null) {
  const remaining: T[] = []
  let skipped = 0
  for (const item of items) {
    const fingerprint = getFingerprint(item)
    const existing = fingerprint ? existingCounts.get(fingerprint) ?? 0 : 0
    if (fingerprint && existing > 0) {
      existingCounts.set(fingerprint, existing - 1)
      skipped += 1
    } else remaining.push(item)
  }
  return { remaining, skipped }
}

export function normalizeProductName(value: string) {
  return value.trim().toLocaleLowerCase()
}
