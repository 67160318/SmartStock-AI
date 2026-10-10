'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileUp, Upload } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import {
  MAX_SALES_CSV_BYTES,
  MAX_SALES_CSV_ROWS,
  exceedsSalesRowLimit,
  parseSalesCsv,
  validateSalesCsvRows,
  type ParsedSaleRow,
} from '@/lib/sales-csv'

type ImportRecord = {
  id: string
  fileName: string
  importedAt: string | null
  createdAt: string
  recordCount: number
  status: string
  errorMessage: string | null
}

function localizeCsvReason(reason: string, isThai: boolean) {
  if (!isThai) return reason
  const translations: [string, string][] = [
    ['The encoded data was not valid.', 'ไฟล์ต้องเข้ารหัสเป็น UTF-8'],
    ['The CSV contains an unclosed quoted field.', 'ไฟล์ CSV มีเครื่องหมายอัญประกาศที่เปิดไว้แต่ไม่ได้ปิด'],
    ['The CSV contains invalid characters after a quoted field.', 'ไฟล์ CSV มีอักขระที่ไม่ถูกต้องหลังช่องข้อมูลที่ใส่เครื่องหมายอัญประกาศ'],
    ['The CSV contains a quote inside an unquoted field.', 'ไฟล์ CSV มีเครื่องหมายอัญประกาศในช่องข้อมูลที่ไม่ได้ครอบด้วยเครื่องหมายอัญประกาศ'],
    ['The CSV needs a header and at least one data row.', 'ไฟล์ CSV ต้องมีแถวหัวตารางและข้อมูลอย่างน้อยหนึ่งแถว'],
    ['Missing required CSV column', 'ขาดคอลัมน์ที่จำเป็นในไฟล์ CSV'],
    ['row field count does not match the CSV header', 'จำนวนช่องข้อมูลไม่ตรงกับหัวตาราง CSV'],
    ['product is missing or longer than 160 characters', 'ไม่มีชื่อสินค้า หรือชื่อยาวเกิน 160 ตัวอักษร'],
    ['quantity must be greater than zero with at most 4 decimals', 'จำนวนต้องมากกว่าศูนย์และมีทศนิยมไม่เกิน 4 ตำแหน่ง'],
    ['unit price must be non-negative with at most 4 decimals', 'ราคาต่อหน่วยต้องไม่ติดลบและมีทศนิยมไม่เกิน 4 ตำแหน่ง'],
    ['sale date/time is invalid', 'วันที่หรือเวลาขายไม่ถูกต้อง'],
    ['transaction ID is longer than 200 characters', 'รหัสธุรกรรมยาวเกิน 200 ตัวอักษร'],
  ]
  return translations.reduce((localized, [english, thai]) => localized.replaceAll(english, thai), reason)
}

type ImportResponse = {
  imported?: number
  duplicateCount?: number
  invalidRows?: { rowNumber: number; reason: string }[]
  invalidRowCount?: number
  error?: string
  reason?: string
  limit?: number
  warning?: boolean
}

export function SalesImportManager({ imports }: { imports: ImportRecord[] }) {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ParsedSaleRow[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [validCount, setValidCount] = useState(0)
  const [invalidCount, setInvalidCount] = useState(0)
  const [skippedRows, setSkippedRows] = useState<{ rowNumber: number; reason: string }[]>([])
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  const isThai = locale === 'th'
  const dateFormatter = new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-US', { dateStyle: 'medium' })
  const text = {
    uploadTitle: isThai ? 'นำเข้ารายการขาย' : 'Import sales records',
    uploadCopy: isThai ? 'อัปโหลดไฟล์ CSV เพื่อบันทึกรายการขายในพื้นที่ร้านที่คุณเข้าถึงได้' : 'Upload a CSV to save sales records to your authorized restaurant workspace.',
    chooseFile: isThai ? 'เลือกไฟล์ CSV' : 'Choose CSV file',
    noFile: isThai ? 'ยังไม่ได้เลือกไฟล์' : 'No file selected',
    maxFile: isThai ? `ไฟล์ CSV ต้องมีขนาดไม่เกิน 2 MB และ ${MAX_SALES_CSV_ROWS.toLocaleString()} แถว` : `CSV files must be 2 MB or smaller and contain no more than ${MAX_SALES_CSV_ROWS.toLocaleString()} rows.`,
    import: isThai ? 'นำเข้าข้อมูล' : 'Import sales',
    importing: isThai ? 'กำลังนำเข้า…' : 'Importing…',
    preview: isThai ? 'ตัวอย่างข้อมูล' : 'CSV preview',
    history: isThai ? 'ประวัติการนำเข้า' : 'Import history',
    noImports: isThai ? 'ยังไม่มีการนำเข้ารายการขาย' : 'No sales imports have been recorded for this restaurant yet.',
    records: isThai ? 'รายการ' : 'records',
    success: isThai ? 'นำเข้าสำเร็จ' : 'Import complete',
    duplicates: isThai ? 'ข้ามรายการซ้ำ' : 'duplicates skipped',
    invalid: isThai ? 'ข้ามแถวที่ไม่ถูกต้อง' : 'invalid rows skipped',
    genericError: isThai ? 'นำเข้าไม่สำเร็จ โปรดตรวจสอบไฟล์และลองอีกครั้ง' : 'The import could not be completed. Check the file and try again.',
    selectFirst: isThai ? 'กรุณาเลือกไฟล์ CSV ก่อน' : 'Choose a CSV file first.',
    date: isThai ? 'วันที่' : 'Date',
    status: isThai ? 'สถานะ' : 'Status',
    file: isThai ? 'ไฟล์' : 'File',
    invalidRows: isThai ? 'แถวที่ข้าม' : 'Skipped rows',
    downloadTemplate: isThai ? 'ดาวน์โหลดไฟล์ตัวอย่าง' : 'Download CSV template',
    confirmImport: isThai ? 'ตรวจสอบแล้วและยืนยันการนำเข้า' : 'I reviewed the preview and confirm this import',
    noValidRows: isThai ? 'ไม่พบแถวที่ถูกต้องให้นำเข้า โปรดแก้ไขไฟล์ตามข้อผิดพลาดด้านล่าง' : 'No valid rows are available to import. Fix the CSV errors below and try again.',
  }

  async function selectFile(nextFile?: File) {
    setFile(nextFile ?? null)
    setPreview([])
    setRowCount(0)
    setValidCount(0)
    setInvalidCount(0)
    setSkippedRows([])
    setConfirmed(false)
    setError('')
    setNotice('')
    if (!nextFile) return
    if (!nextFile.name.toLowerCase().endsWith('.csv') || nextFile.size === 0 || nextFile.size > MAX_SALES_CSV_BYTES) {
      setError(text.maxFile)
      return
    }

    try {
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(await nextFile.arrayBuffer())
      if (exceedsSalesRowLimit(decoded)) {
        setError(text.maxFile)
        return
      }
      const parsed = parseSalesCsv(decoded)
      const totalRows = parsed.validRows.length + parsed.invalidRows.length
      if (!validateSalesCsvRows(totalRows)) {
        setError(text.maxFile)
        return
      }
      setRowCount(totalRows)
      setValidCount(parsed.validRows.length)
      setInvalidCount(parsed.invalidRows.length)
      setSkippedRows(parsed.invalidRows)
      setPreview(parsed.validRows.slice(0, 5))
      if (parsed.validRows.length === 0) setError(text.noValidRows)
    } catch (caught) {
      setError(localizeCsvReason(caught instanceof Error ? caught.message : '', isThai) || text.genericError)
    }
  }

  async function importFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError(text.selectFirst)
      return
    }
    setPending(true)
    setError('')
    setNotice('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/sales/import', { method: 'POST', body: formData })
      const result = await response.json() as ImportResponse
      if (!response.ok) {
        setSkippedRows(result.invalidRows ?? [])
        const localizedErrors: Record<string, string> = isThai ? {
          sign_in_required: 'เซสชันหมดอายุ โปรดเข้าสู่ระบบอีกครั้ง',
          workspace_required: 'ไม่พบบัญชีร้านที่คุณมีสิทธิ์เข้าถึง',
          workspace_unavailable: 'ไม่สามารถตรวจสอบพื้นที่ร้านได้ โปรดลองอีกครั้ง',
          file_size_invalid: text.maxFile,
          too_many_rows: text.maxFile,
          csv_file_required: 'โปรดเลือกไฟล์ .csv',
          csv_encoding_invalid: 'ไฟล์ต้องเข้ารหัสเป็น UTF-8',
          no_valid_rows: text.noValidRows,
          duplicate_check_failed: 'ตรวจสอบรายการซ้ำไม่สำเร็จ โปรดลองอีกครั้ง',
          product_lookup_failed: 'ไม่สามารถจับคู่รายการกับเมนูของร้านได้ โปรดลองอีกครั้ง',
          import_create_failed: 'สร้างประวัติการนำเข้าไม่สำเร็จ โปรดลองอีกครั้ง',
          records_save_failed: 'บันทึกรายการขายไม่สำเร็จ ไม่มีการนำเข้ารายการจากไฟล์นี้',
        } : {
          sign_in_required: 'Your session has expired. Sign in again and retry.',
          workspace_required: 'No authorized restaurant workspace was found for this account.',
          workspace_unavailable: 'The restaurant workspace could not be verified. Try again.',
          file_size_invalid: text.maxFile,
          too_many_rows: text.maxFile,
          csv_file_required: 'Choose a .csv file.',
          csv_encoding_invalid: 'The file must use UTF-8 encoding.',
          no_valid_rows: text.noValidRows,
          duplicate_check_failed: 'Duplicate sales could not be checked. Try again.',
          product_lookup_failed: 'Menu products could not be matched. Try again.',
          import_create_failed: 'The import history could not be created. Try again.',
          records_save_failed: 'Sales records could not be saved. No rows from this file were imported.',
        }
        const localizedError = result.error === 'csv_invalid'
          ? localizeCsvReason(result.reason ?? '', isThai) || text.genericError
          : localizedErrors[result.error ?? ''] ?? text.genericError
        setError(localizedError)
        return
      }
      setNotice(`${text.success}: ${result.imported ?? 0} ${text.records}. ${result.duplicateCount ? `${result.duplicateCount} ${text.duplicates}.` : ''} ${result.invalidRowCount ? `${result.invalidRowCount} ${text.invalid}.` : ''} ${result.warning ? (isThai ? 'บันทึกรายการแล้ว แต่ไม่สามารถอัปเดตสถานะประวัติได้' : 'Records saved, but the import history status could not be updated.') : ''}`.trim())
      setSkippedRows(result.invalidRows ?? [])
      setFile(null)
      setPreview([])
      setRowCount(0)
      setValidCount(0)
      setInvalidCount(0)
      setConfirmed(false)
      if (inputRef.current) inputRef.current.value = ''
      router.refresh()
    } catch {
      setError(text.genericError)
    } finally {
      setPending(false)
    }
  }

  function formatDate(value: string | null) {
    if (!value) return '—'
    const parsedDate = new Date(value)
    return Number.isNaN(parsedDate.getTime()) ? '—' : dateFormatter.format(parsedDate)
  }

  return (
    <div className="flex flex-col gap-5">
      <form id="sales-import-form" onSubmit={importFile} aria-busy={pending} className="scroll-mt-24 rounded-2xl border border-[#e8ece6] bg-white p-5 sm:p-7">
        <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
          <div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#edf5ed] text-[#4c8058]"><FileUp size={18} aria-hidden="true" /></span>
            <h2 className="mt-4 text-base font-semibold text-[#314b3a]">{text.uploadTitle}</h2>
            <p className="mt-2 max-w-md text-xs leading-5 text-[#849087]">{text.uploadCopy}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-[#dfe7de] bg-white px-3.5 text-xs font-semibold text-[#49634f] hover:bg-[#f8faf7]">
                <FileUp size={14} aria-hidden="true" />{text.chooseFile}
                <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => void selectFile(event.target.files?.[0])} />
              </label>
              <span className="max-w-[220px] truncate text-[11px] text-[#98a198]">{file?.name ?? text.noFile}</span>
            </div>
            <p className="mt-3 text-[10px] leading-5 text-[#929c92]">{text.maxFile}. {isThai ? 'ต้องมี product, quantity, unit_price และ sold_at; transaction_id เป็นตัวเลือก' : 'Required columns: product, quantity, unit_price, and sold_at. transaction_id is optional.'}</p>
            <a href="/api/sales/import?template=1" download className="mt-2 inline-flex text-[11px] font-semibold text-[#4c8058] underline underline-offset-2">{text.downloadTemplate}</a>
          </div>
          <div className="rounded-xl border border-dashed border-[#dce5d9] bg-[#f8faf7] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold text-[#506b55]">{text.preview}</p>
              {rowCount > 0 && <span className="text-[10px] text-[#8b988d]">{rowCount} {text.records}{invalidCount ? ` · ${invalidCount} ${text.invalid}` : ''}</span>}
            </div>
            {preview.length > 0 ? <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-[10px]">
                <thead className="text-[#9aa49a]"><tr>{['transaction_id', 'product', 'quantity', 'unit_price', 'sold_at'].map((header) => <th key={header} className="pb-2 pr-4 font-medium">{header}</th>)}</tr></thead>
                <tbody className="text-[#6b7c6e]">{preview.map((row) => <tr key={row.rowNumber}><td className="max-w-28 truncate py-1 pr-4">{row.transactionId || '—'}</td><td className="max-w-36 truncate py-1 pr-4">{row.productName}</td><td className="py-1 pr-4">{row.quantity}</td><td className="py-1 pr-4">{row.unitPrice}</td><td className="py-1 pr-4">{row.soldAt}</td></tr>)}</tbody>
              </table>
            </div> : <p className="mt-3 text-[11px] text-[#929c92]">{file ? (invalidCount ? `${invalidCount} ${text.invalid}` : text.noFile) : text.noFile}</p>}
            {skippedRows.length > 0 && <div className="mt-3 border-t border-[#e7eee5] pt-3"><ul aria-label={text.invalidRows} className="flex max-h-48 flex-col gap-1 overflow-y-auto text-[10px] text-[#9a6a58]">{skippedRows.slice(0, 30).map((row) => <li key={row.rowNumber}>{row.rowNumber}: {localizeCsvReason(row.reason, isThai)}</li>)}</ul>{skippedRows.length > 30 && <p className="mt-2 text-[10px] text-[#929c92]">{isThai ? `แสดง 30 จาก ${skippedRows.length} แถวที่มีปัญหา` : `Showing 30 of ${skippedRows.length} rows with issues.`}</p>}</div>}
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-[#efd9d3] bg-[#fff7f5] px-4 py-3 text-xs text-[#874e43]">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-xl border border-[#dce9da] bg-[#f0f6ee] px-4 py-3 text-xs text-[#47654c]">{notice}</p>}
        {rowCount > 0 && <label className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-[#52675a]"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 accent-[#1b4838]" />{text.confirmImport} — {validCount} {text.records}{invalidCount ? `; ${invalidCount} ${text.invalid}` : ''}</label>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0eb] pt-4">
          <p className="text-[11px] leading-5 text-[#929c92]">{rowCount ? `${rowCount} ${text.records}` : text.maxFile}</p>
          <button type="submit" disabled={pending || !file || !validCount || !confirmed || Boolean(error)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1b4838] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#143a2c] disabled:cursor-not-allowed disabled:opacity-50">
            <Upload size={14} aria-hidden="true" />{pending ? text.importing : text.import}
          </button>
        </div>
      </form>

      <section aria-labelledby="sales-import-history" className="rounded-2xl border border-[#e8ece6] bg-white">
        <div className="border-b border-[#edf0eb] px-4 py-3.5 sm:px-5"><h2 id="sales-import-history" className="text-sm font-semibold text-[#2d4b39]">{text.history}</h2></div>
        {imports.length === 0 ? <p className="px-5 py-8 text-center text-xs text-[#849087]">{text.noImports}</p> : <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead><tr className="border-b border-[#edf0eb] bg-[#fafbf9]">{[text.file, text.date, text.records, text.status].map((header) => <th key={header} className="px-4 py-3 text-[10px] font-semibold text-[#8a968b] sm:px-5">{header}</th>)}</tr></thead>
            <tbody>{imports.map((record) => <tr key={record.id} className="border-b border-[#f0f2ee] last:border-0"><td className="px-4 py-3.5 text-[11px] font-semibold text-[#395441] sm:px-5"><span>{record.fileName}</span>{record.errorMessage && <p className="mt-1 max-w-sm whitespace-normal text-[10px] font-normal leading-4 text-[#9a6a58]">{record.errorMessage}</p>}</td><td className="px-4 py-3.5 text-[11px] text-[#738075] sm:px-5">{formatDate(record.importedAt ?? record.createdAt)}</td><td className="px-4 py-3.5 text-[11px] text-[#738075] sm:px-5">{record.recordCount}</td><td className="px-4 py-3.5 text-[11px] capitalize text-[#738075] sm:px-5">{record.status.replaceAll('_', ' ')}</td></tr>)}</tbody>
          </table>
        </div>}
      </section>
    </div>
  )
}
