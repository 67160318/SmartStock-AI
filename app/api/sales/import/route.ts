import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  countFingerprints,
  MAX_SALES_CSV_BYTES,
  MAX_SALES_CSV_ROWS,
  normalizeProductName,
  parseSalesCsv,
  saleFingerprint,
  saleFingerprintFromRecord,
  sanitizeCsvFileName,
  summarizeInvalidRows,
  salesImportSkippedMessage,
  mergeImportMessages,
} from '@/lib/sales-csv'

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status })
const MAX_MULTIPART_BYTES = MAX_SALES_CSV_BYTES + 64 * 1024

class UploadTooLargeError extends Error {}

async function readBoundedFormData(request: Request) {
  const declaredLength = request.headers.get('content-length')
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > MAX_MULTIPART_BYTES) {
    throw new UploadTooLargeError('Upload exceeds the multipart size limit.')
  }

  const reader = request.body?.getReader()
  if (!reader) throw new Error('Request body is empty.')

  const chunks: Uint8Array[] = []
  let totalBytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > MAX_MULTIPART_BYTES) {
      await reader.cancel()
      throw new UploadTooLargeError('Upload exceeds the multipart size limit.')
    }
    chunks.push(value)
  }

  const payload = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    payload.set(chunk, offset)
    offset += chunk.byteLength
  }

  const boundedRequest = new Response(payload, {
    headers: { 'content-type': request.headers.get('content-type') ?? '' },
  })
  return boundedRequest.formData()
}

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get('template') !== '1') return json({ error: 'not_found' }, 404)
  return new Response('transaction_id,product,quantity,unit_price,sold_at\nTX-1001,Pad Thai,2,120.00,2026-10-10T12:30:00Z\n', {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="sales-import-template.csv"',
      'cache-control': 'public, max-age=3600',
    },
  })
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const requestUrl = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || requestUrl.protocol.replace(':', '')
  const forwardedOrigin = forwardedHost ? `${forwardedProtocol}://${forwardedHost}` : null
  if (!origin || (origin !== requestUrl.origin && origin !== forwardedOrigin)) return json({ error: 'origin_not_allowed' }, 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data;')) {
    return json({ error: 'invalid_request' }, 415)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return json({ error: 'sign_in_required' }, 401)

  const { data: membership, error: membershipError } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membershipError) return json({ error: 'workspace_unavailable' }, 500)
  if (!membership) return json({ error: 'workspace_required' }, 403)
  const restaurantId = membership.restaurant_id

  let formData: FormData
  try {
    formData = await readBoundedFormData(request)
  } catch (error) {
    return json({ error: error instanceof UploadTooLargeError ? 'file_size_invalid' : 'invalid_request' }, error instanceof UploadTooLargeError ? 413 : 400)
  }

  const file = formData.get('file')
  if (!(file instanceof File)) return json({ error: 'file_required' }, 400)
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return json({ error: 'csv_file_required' }, 415)
  }
  if (file.size === 0 || file.size > MAX_SALES_CSV_BYTES) return json({ error: 'file_size_invalid' }, 413)

  let parsed: ReturnType<typeof parseSalesCsv>
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer())
    parsed = parseSalesCsv(text)
  } catch (error) {
    return json({ error: error instanceof TypeError ? 'csv_encoding_invalid' : 'csv_invalid', reason: error instanceof Error ? error.message : undefined }, 400)
  }

  const sourceRowCount = parsed.validRows.length + parsed.invalidRows.length
  if (sourceRowCount > MAX_SALES_CSV_ROWS) return json({ error: 'too_many_rows', limit: MAX_SALES_CSV_ROWS }, 413)
  if (parsed.validRows.length === 0 && parsed.invalidRows.length > 0) {
    return json({ error: 'no_valid_rows', invalidRows: parsed.invalidRows.slice(0, 30) }, 422)
  }

  const transactionIds = [...new Set(parsed.validRows.flatMap((row) => row.transactionId ? [row.transactionId] : []))]
  const existingRecords: {
    transaction_id: string | null
    source_product_name: string
    quantity: number | string
    unit_price: number | string
    sold_at: string
  }[] = []

  for (let index = 0; index < transactionIds.length; index += 100) {
    const idBatch = transactionIds.slice(index, index + 100)
    let offset = 0
    while (true) {
      const { data, error } = await supabase
        .from('sales_records')
        .select('transaction_id, source_product_name, quantity, unit_price, sold_at')
        .eq('restaurant_id', restaurantId)
        .in('transaction_id', idBatch)
        .range(offset, offset + 999)
      if (error) return json({ error: 'duplicate_check_failed' }, 500)
      existingRecords.push(...(data ?? []))
      if (!data || data.length < 1000) break
      offset += data.length
    }
  }

  const fingerprintCounts = countFingerprints(existingRecords, saleFingerprintFromRecord)
  const rowsToInsert = []
  let duplicateCount = 0
  for (const row of parsed.validRows) {
    const fingerprint = saleFingerprint(row)
    const existingCount = fingerprint ? fingerprintCounts.get(fingerprint) ?? 0 : 0
    if (fingerprint && existingCount > 0) {
      fingerprintCounts.set(fingerprint, existingCount - 1)
      duplicateCount += 1
      continue
    }
    if (fingerprint) fingerprintCounts.set(fingerprint, 1)
    rowsToInsert.push(row)
  }

  const { data: products, error: productsError } = await supabase
    .from('menu_products')
    .select('id, name')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
  if (productsError) return json({ error: 'product_lookup_failed' }, 500)
  const productIdsByName = new Map((products ?? []).map((product) => [normalizeProductName(product.name), product.id]))

  const { data: importRecord, error: importError } = await supabase
    .from('sales_imports')
    .insert({
      restaurant_id: restaurantId,
      file_name: sanitizeCsvFileName(file.name),
      status: 'processing',
      record_count: 0,
      created_by: user.id,
    })
    .select('id')
    .single()
  if (importError || !importRecord) return json({ error: 'import_create_failed' }, 500)

  if (rowsToInsert.length > 0) {
    const records = rowsToInsert.map((row) => ({
      restaurant_id: restaurantId,
      sales_import_id: importRecord.id,
      menu_product_id: productIdsByName.get(normalizeProductName(row.productName)) ?? null,
      transaction_id: row.transactionId,
      source_product_name: row.productName,
      import_row_number: row.rowNumber,
      quantity: row.quantity,
      unit_price: row.unitPrice,
      sold_at: row.soldAt,
    }))
    const { error: recordsError } = await supabase.from('sales_records').insert(records)
    if (recordsError) {
      await supabase
        .from('sales_imports')
        .update({ status: 'failed', error_message: 'Sales rows could not be saved.' })
        .eq('id', importRecord.id)
        .eq('restaurant_id', restaurantId)
      return json({ error: 'records_save_failed' }, 500)
    }
  }

  const importMessage = mergeImportMessages(
    summarizeInvalidRows(parsed.invalidRows),
    salesImportSkippedMessage(duplicateCount),
  )
  const { error: finalizeError } = await supabase
    .from('sales_imports')
    .update({ status: 'imported', record_count: rowsToInsert.length, imported_at: new Date().toISOString(), error_message: importMessage })
    .eq('id', importRecord.id)
    .eq('restaurant_id', restaurantId)
  if (finalizeError) return json({ error: 'import_finalize_warning', imported: rowsToInsert.length, duplicateCount, invalidRows: parsed.invalidRows.slice(0, 30), invalidRowCount: parsed.invalidRows.length, warning: true }, 200)

  return json({
    imported: rowsToInsert.length,
    duplicateCount,
    invalidRows: parsed.invalidRows.slice(0, 30),
    invalidRowCount: parsed.invalidRows.length,
  })
}
