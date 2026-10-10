'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/components/language-provider'

type Ingredient = {
  id: string
  name: string
  category: string | null
  unit: string
  current_stock: number
  reorder_level: number
  supplier_id: string | null
}

type Supplier = { id: string; name: string }
type MovementOperation = 'set_stock' | 'receive' | 'withdraw' | 'waste' | 'adjust'
type Draft = {
  name: string
  category: string
  unit: string
  movement_quantity: string
  stock_reason: string
  reorder_level: string
  supplier_id: string | null
}

const emptyDraft: Draft = {
  name: '',
  category: '',
  unit: '',
  movement_quantity: '0',
  stock_reason: '',
  reorder_level: '0',
  supplier_id: null,
}

export function InventoryManager({
  restaurantId,
  restaurantName,
  ingredients: initialIngredients,
  suppliers,
  loadError,
  initialFormOpen = false,
}: {
  restaurantId: string
  restaurantName: string
  ingredients: Ingredient[]
  suppliers: Supplier[]
  loadError?: string
  initialFormOpen?: boolean
}) {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const [ingredients, setIngredients] = useState(initialIngredients)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [movementOperation, setMovementOperation] = useState<MovementOperation>('set_stock')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(initialFormOpen)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [movementIdempotencyKey, setMovementIdempotencyKey] = useState<string | null>(null)
  const [error, setError] = useState(loadError ?? '')
  const [status, setStatus] = useState('')

  const lowStockCount = ingredients.filter((item) => Number(item.current_stock) <= Number(item.reorder_level)).length
  const labels = locale === 'th' ? {
    invalid: 'กรอกชื่อ หน่วย และจำนวนให้ถูกต้อง (ไม่เกิน 4 ตำแหน่งทศนิยม; ปรับยอดสามารถใช้จำนวนติดลบได้)',
    reasonRequired: 'ระบุเหตุผลเมื่อมีการเปลี่ยนแปลงสต็อก (ไม่เกิน 500 ตัวอักษร)',
    supplierInvalid: 'ซัพพลายเออร์นี้ไม่ได้อยู่ในพื้นที่ร้านปัจจุบัน โปรดเลือกใหม่',
    permission: 'ไม่มีสิทธิ์บันทึกวัตถุดิบในพื้นที่ร้านนี้ โปรดตรวจสอบบัญชีและพื้นที่ทำงานแล้วลองอีกครั้ง',
    saveError: 'บันทึกวัตถุดิบไม่สำเร็จ โปรดตรวจสอบข้อมูลและลองอีกครั้ง',
    movementError: 'บันทึกการเปลี่ยนแปลงสต็อกไม่สำเร็จ ข้อมูลวัตถุดิบถูกบันทึกแล้ว คุณสามารถลองเปลี่ยนสต็อกอีกครั้ง',
    partialCreate: 'บันทึกวัตถุดิบแล้ว แต่สต็อกยังเป็นศูนย์ โปรดลองบันทึกอีกครั้งเพื่อปรับสต็อก',
    deleteHistory: 'ลบวัตถุดิบนี้ไม่ได้ เนื่องจากมีประวัติสต็อกหรือรายการที่เชื่อมโยงอยู่',
    reason: 'เหตุผลในการเปลี่ยนสต็อก',
    operation: 'ประเภทรายการสต็อก',
    quantity: 'จำนวน',
    setStock: 'กำหนดยอดคงเหลือ',
    receive: 'รับเข้า',
    withdraw: 'เบิกใช้',
    waste: 'ของเสีย / ทิ้ง',
    adjust: 'ปรับยอด (+ หรือ −)',
    missing: 'ไม่พบวัตถุดิบนี้ หรือไม่มีสิทธิ์แก้ไขในพื้นที่ร้านนี้',
    manageCopy: 'จัดการสต็อกจริงของร้านอาหารนี้',
    unit: 'หน่วย',
    reorder: 'ระดับที่ควรสั่งเพิ่ม',
    noSupplier: 'ไม่มีซัพพลายเออร์',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    confirmDelete: 'ยืนยันการลบ?',
    empty: 'ยังไม่มีวัตถุดิบ',
    emptyCopy: 'เพิ่มรายการแรกเพื่อเริ่มติดตามสต็อกของร้านนี้',
    added: 'เพิ่มวัตถุดิบแล้ว',
    updated: 'อัปเดตวัตถุดิบแล้ว',
    movementRecorded: 'บันทึกรายการเปลี่ยนแปลงสต็อกแล้ว',
    deleted: 'ลบวัตถุดิบแล้ว',
  } : {
    invalid: 'Enter a name, unit, and a valid quantity with at most 4 decimal places. Adjustments may be negative.',
    reasonRequired: 'Enter a reason when changing stock (up to 500 characters).',
    supplierInvalid: 'This supplier is not part of the current restaurant workspace. Choose another supplier.',
    permission: 'You do not have permission to save ingredients in this restaurant workspace. Check your account and workspace, then try again.',
    saveError: 'Could not save this ingredient. Check the details and try again.',
    movementError: 'The stock movement could not be recorded. Ingredient details were saved; you can retry the stock change.',
    partialCreate: 'Ingredient saved with zero stock. Retry to apply the stock change.',
    deleteHistory: 'This ingredient cannot be deleted because it has inventory history or other linked records.',
    reason: 'Reason for stock change',
    operation: 'Stock movement',
    quantity: 'Quantity',
    setStock: 'Set current stock',
    receive: 'Receive stock',
    withdraw: 'Withdraw stock',
    waste: 'Record waste',
    adjust: 'Adjust stock (+ or −)',
    missing: 'This ingredient was not found or you do not have permission to edit it in this workspace.',
    manageCopy: 'Manage the live stock record for this restaurant.',
    unit: 'Unit',
    reorder: 'Reorder level',
    noSupplier: 'No supplier',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Delete?',
    empty: 'No ingredients yet',
    emptyCopy: 'Add your first stock item to start tracking inventory for this restaurant.',
    added: 'Ingredient added.',
    updated: 'Ingredient updated.',
    movementRecorded: 'Stock movement recorded.',
    deleted: 'Ingredient deleted.',
  }

  function openNewForm() {
    setError('')
    setStatus('')
    setMovementIdempotencyKey(null)
    setMovementOperation('set_stock')
    setEditingId(null)
    setDraft(emptyDraft)
    setFormOpen(true)
  }

  function openEditForm(item: Ingredient) {
    setError('')
    setStatus('')
    setMovementIdempotencyKey(null)
    setConfirmDeleteId(null)
    setMovementOperation('set_stock')
    setEditingId(item.id)
    setDraft({
      name: item.name,
      category: item.category ?? '',
      unit: item.unit,
      movement_quantity: String(item.current_stock),
      stock_reason: '',
      reorder_level: String(item.reorder_level),
      supplier_id: item.supplier_id,
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setMovementOperation('set_stock')
    setMovementIdempotencyKey(null)
    setDraft(emptyDraft)
  }

  async function saveIngredient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setStatus('')

    const recordId = editingId
    const existingIngredient = recordId ? ingredients.find((item) => item.id === recordId) : null
    const name = draft.name.trim()
    const unit = draft.unit.trim()
    const reason = draft.stock_reason.trim()
    const maximumQuantity = 9_999_999_999.9999
    const parseQuantity = (value: string, allowNegative = false) => {
      const pattern = allowNegative ? /^-?\d+(?:\.\d{1,4})?$/ : /^\d+(?:\.\d{1,4})?$/
      if (!pattern.test(value)) return null
      const quantity = Number(value)
      return Number.isFinite(quantity) && Math.abs(quantity) <= maximumQuantity ? quantity : null
    }
    const movementQuantity = parseQuantity(draft.movement_quantity, movementOperation === 'adjust')
    const reorderLevel = parseQuantity(draft.reorder_level)
    const invalidMovement = movementQuantity === null
      || (movementOperation === 'set_stock' && movementQuantity < 0)
      || (movementOperation !== 'set_stock' && movementOperation !== 'adjust' && movementQuantity <= 0)
      || (movementOperation === 'adjust' && movementQuantity === 0)
    if (!name || name.length > 160 || !unit || invalidMovement || reorderLevel === null) {
      setError(labels.invalid)
      return
    }
    if (recordId && !existingIngredient) {
      setError(labels.missing)
      return
    }
    if (draft.supplier_id && !suppliers.some((supplier) => supplier.id === draft.supplier_id)) {
      setError(labels.supplierInvalid)
      return
    }

    const stockChanged = movementOperation === 'set_stock'
      ? recordId
        ? movementQuantity !== Number(existingIngredient?.current_stock)
        : movementQuantity > 0
      : true
    if (stockChanged && (!reason || reason.length > 500)) {
      setError(labels.reasonRequired)
      return
    }

    setPending(true)
    const values = {
      name,
      category: draft.category.trim() || null,
      unit,
      reorder_level: reorderLevel,
      supplier_id: draft.supplier_id || null,
    }
    const wasCreating = recordId === null

    let savedIngredientId: string | null = null
    try {
      const supabase = createClient()
      const request = recordId
        ? supabase.from('ingredients').update(values).eq('id', recordId).eq('restaurant_id', restaurantId).select('id, name, category, unit, current_stock, reorder_level, supplier_id').single()
        : supabase.from('ingredients').insert({ ...values, restaurant_id: restaurantId }).select('id, name, category, unit, current_stock, reorder_level, supplier_id').single()
      const { data, error: mutationError } = await request

      if (mutationError || !data) {
        const code = mutationError?.code
        const isPermissionError = code === '42501'
        const isMissingRecord = code === 'PGRST116'
        const isForeignKeyError = code === '23503'
        const message = isPermissionError
          ? labels.permission
          : isMissingRecord
            ? labels.missing
            : isForeignKeyError
              ? labels.supplierInvalid
              : labels.saveError
        setError(`${message}${code ? ` (${code})` : ''}`)
        return
      }

      savedIngredientId = data.id
      setIngredients((current) => {
        const next = wasCreating
          ? [...current, data]
          : current.map((item) => item.id === data.id ? data : item)
        return next.sort((a, b) => a.name.localeCompare(b.name))
      })

      if (stockChanged) {
        const idempotencyKey = movementIdempotencyKey ?? crypto.randomUUID()
        setMovementIdempotencyKey(idempotencyKey)
        const { error: movementError } = await supabase.rpc('record_inventory_movement', {
          p_restaurant_id: restaurantId,
          p_ingredient_id: data.id,
          p_operation: movementOperation,
          p_quantity: movementQuantity,
          p_reason: reason,
          p_idempotency_key: idempotencyKey,
        })

        if (movementError) {
          if (wasCreating) setEditingId(data.id)
          setStatus(wasCreating ? labels.partialCreate : '')
          setError(`${labels.movementError}${movementError.code ? ` (${movementError.code})` : ''}`)
          router.refresh()
          return
        }

        const currentStock = Number(data.current_stock)
        const nextStock = movementOperation === 'set_stock'
          ? movementQuantity
          : movementOperation === 'receive' || movementOperation === 'adjust'
            ? currentStock + movementQuantity
            : currentStock - movementQuantity
        setIngredients((current) => current.map((item) =>
          item.id === data.id ? { ...item, current_stock: nextStock } : item,
        ))
      }

      setMovementIdempotencyKey(null)
      setStatus(wasCreating ? labels.added : stockChanged ? labels.movementRecorded : labels.updated)
      closeForm()
      router.refresh()
    } catch {
      if (savedIngredientId) {
        if (wasCreating) setEditingId(savedIngredientId)
        setStatus(wasCreating ? labels.partialCreate : '')
        setError(labels.movementError)
        router.refresh()
      } else {
        setError(labels.saveError)
      }
    } finally {
      setPending(false)
    }
  }

  async function deleteIngredient(id: string) {
    setError('')
    setStatus('')
    setPending(true)
    try {
      const { data: deletedIngredient, error: deleteError } = await createClient()
        .from('ingredients')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', restaurantId)
        .select('id')
        .maybeSingle()

      if (deleteError || !deletedIngredient) {
        const message = deleteError?.code === '42501'
          ? labels.permission
          : deleteError?.code === '23503'
            ? labels.deleteHistory
            : labels.missing
        setError(`${message}${deleteError?.code ? ` (${deleteError.code})` : ''}`)
        return
      }

      setIngredients((current) => current.filter((item) => item.id !== id))
      setConfirmDeleteId(null)
      setStatus(labels.deleted)
      router.refresh()
    } catch {
      setError(labels.saveError)
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#7e9a82]">{restaurantName}</p>
          <h1 className="text-[26px] font-semibold tracking-[-.04em] text-[#1c3c2d] sm:text-[30px]">{t('inventoryTitle')}</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-[#839087]">{t('inventorySubtitle')}</p>
        </div>
        <button type="button" onClick={openNewForm} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#1b4838] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#143a2c]">
          <span aria-hidden="true">+</span>{t('newIngredient')}
        </button>
      </div>

      {error && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[#efd9d3] bg-[#fff7f5] px-4 py-3 text-xs text-[#874e43] sm:flex-row sm:items-center sm:justify-between"><span>{error}</span>{loadError && <button type="button" onClick={() => router.refresh()} className="font-semibold underline underline-offset-2">Try again</button>}</div>}
      {status && <p role="status" className="rounded-xl border border-[#dce9da] bg-[#f0f6ee] px-4 py-3 text-xs text-[#47654c]">{status}</p>}

      {formOpen && <form onSubmit={saveIngredient} aria-busy={pending} className="flex flex-col gap-4 rounded-2xl border border-[#e5ece4] bg-white p-4 sm:p-5">
        <div><h2 className="text-sm font-semibold text-[#314b3a]">{editingId ? t('edit') : t('newIngredient')}</h2><p className="mt-1 text-[11px] text-[#849087]">{labels.manageCopy}</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-[#536457]">{t('name')}</span><input autoFocus required disabled={pending} maxLength={160} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="h-10 rounded-xl border border-[#e5ebe3] bg-white px-3 text-xs text-[#3f5746] outline-none focus:border-[#9db9a1]" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-[#536457]">{t('category')}</span><input disabled={pending} maxLength={120} value={draft.category ?? ''} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className="h-10 rounded-xl border border-[#e5ebe3] bg-white px-3 text-xs text-[#3f5746] outline-none focus:border-[#9db9a1]" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-[#536457]">{labels.unit}</span><input required disabled={pending} maxLength={40} value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} placeholder="kg, L, pcs" className="h-10 rounded-xl border border-[#e5ebe3] bg-white px-3 text-xs text-[#3f5746] outline-none focus:border-[#9db9a1]" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-[#536457]">{labels.operation}</span><select disabled={pending} value={movementOperation} onChange={(event) => { const operation = event.target.value as MovementOperation; setMovementOperation(operation); setMovementIdempotencyKey(null); setDraft({ ...draft, movement_quantity: operation === 'set_stock' ? String(ingredients.find((item) => item.id === editingId)?.current_stock ?? 0) : '' }) }} className="h-10 rounded-xl border border-[#e5ebe3] bg-white px-3 text-xs text-[#647268] outline-none focus:border-[#9db9a1]"><option value="set_stock">{labels.setStock}</option><option value="receive">{labels.receive}</option><option value="withdraw">{labels.withdraw}</option><option value="waste">{labels.waste}</option><option value="adjust">{labels.adjust}</option></select></label>
          <label className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-[#536457]">{labels.quantity} ({draft.unit || labels.unit})</span><input required disabled={pending} type="number" min={movementOperation === 'adjust' ? '-9999999999.9999' : '0'} max="9999999999.9999" step="0.0001" value={draft.movement_quantity} onChange={(event) => { setMovementIdempotencyKey(null); setError(''); setStatus(''); setDraft({ ...draft, movement_quantity: event.target.value }) }} className="h-10 rounded-xl border border-[#e5ebe3] bg-white px-3 text-xs text-[#3f5746] outline-none focus:border-[#9db9a1]" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-[#536457]">{labels.reorder}</span><input required disabled={pending} type="number" min="0" max="9999999999.9999" step="0.0001" value={draft.reorder_level} onChange={(event) => setDraft({ ...draft, reorder_level: event.target.value })} className="h-10 rounded-xl border border-[#e5ebe3] bg-white px-3 text-xs text-[#3f5746] outline-none focus:border-[#9db9a1]" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-[#536457]">{t('supplier')}</span><select disabled={pending} value={draft.supplier_id ?? ''} onChange={(event) => setDraft({ ...draft, supplier_id: event.target.value || null })} className="h-10 rounded-xl border border-[#e5ebe3] bg-white px-3 text-xs text-[#647268] outline-none focus:border-[#9db9a1]"><option value="">{labels.noSupplier}</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
          <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3"><span className="text-[11px] font-medium text-[#536457]">{labels.reason}</span><input disabled={pending} maxLength={500} value={draft.stock_reason} onChange={(event) => { setMovementIdempotencyKey(null); setDraft({ ...draft, stock_reason: event.target.value }) }} className="h-10 rounded-xl border border-[#e5ebe3] bg-white px-3 text-xs text-[#3f5746] outline-none focus:border-[#9db9a1]" /></label>
        </div>
        <div className="flex justify-end gap-2"><button type="button" disabled={pending} onClick={closeForm} className="h-9 rounded-xl border border-[#e3e9e1] bg-white px-3.5 text-xs font-medium text-[#52675a]">{labels.cancel}</button><button type="submit" disabled={pending} className="h-9 rounded-xl bg-[#1b4838] px-3.5 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-60">{pending ? t('working') : t('saveChanges')}</button></div>
      </form>}

      {!loadError && <>
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-[#e8ece6] bg-white p-4"><p className="text-[11px] font-medium text-[#829087]">{t('ingredients')}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-[#244634]">{ingredients.length}</p></article>
          <article className="rounded-2xl border border-[#e8ece6] bg-white p-4"><p className="text-[11px] font-medium text-[#829087]">{t('lowStock')}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-[#a47b3f]">{lowStockCount}</p></article>
          <article className="rounded-2xl border border-[#e8ece6] bg-white p-4"><p className="text-[11px] font-medium text-[#829087]">{t('healthy')}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-[#4b8058]">{ingredients.length - lowStockCount}</p></article>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#e8ece6] bg-white">
          {ingredients.length === 0 ? <div className="flex flex-col items-center px-5 py-14 text-center"><span className="flex size-11 items-center justify-center rounded-xl bg-[#eff5ed] text-[#52805a]" aria-hidden="true">+</span><h2 className="mt-4 text-sm font-semibold text-[#314b3a]">{labels.empty}</h2><p className="mt-1 max-w-sm text-xs leading-5 text-[#849087]">{labels.emptyCopy} ({restaurantName}).</p><button type="button" onClick={openNewForm} className="mt-4 h-9 rounded-xl bg-[#1b4838] px-3.5 text-xs font-semibold text-white">{t('newIngredient')}</button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[740px] border-collapse text-left"><thead><tr className="border-b border-[#edf0eb] bg-[#fafbf9]">{[t('name'), t('category'), t('stock'), t('supplier'), 'Reorder level', t('status'), t('action')].map((header) => <th key={header} className="px-4 py-3 text-[10px] font-semibold text-[#8a968b] sm:px-5">{header}</th>)}</tr></thead><tbody>{ingredients.map((item) => {
            const isLow = Number(item.current_stock) <= Number(item.reorder_level)
            const supplierName = suppliers.find((supplier) => supplier.id === item.supplier_id)?.name ?? '—'
            return <tr key={item.id} className="border-b border-[#f0f2ee] last:border-0 hover:bg-[#fcfdfa]"><td className="px-4 py-3.5 text-[11px] font-semibold text-[#395441] sm:px-5">{item.name}</td><td className="px-4 py-3.5 text-[11px] text-[#738075] sm:px-5">{item.category || '—'}</td><td className="px-4 py-3.5 text-[11px] text-[#52675a] sm:px-5">{Number(item.current_stock).toLocaleString()} {item.unit}</td><td className="px-4 py-3.5 text-[11px] text-[#738075] sm:px-5">{supplierName}</td><td className="px-4 py-3.5 text-[11px] text-[#738075] sm:px-5">{Number(item.reorder_level).toLocaleString()} {item.unit}</td><td className="px-4 py-3.5 sm:px-5"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-semibold ${isLow ? 'bg-[#fff5e6] text-[#a47b3f]' : 'bg-[#edf5ed] text-[#59805e]'}`}><span className={`size-1.5 rounded-full ${isLow ? 'bg-[#d4a459]' : 'bg-[#7aab7e]'}`} />{isLow ? t('lowStock') : t('healthy')}</span></td><td className="px-4 py-3.5 text-[11px] sm:px-5"><div className="flex items-center gap-3">{confirmDeleteId === item.id ? <><span className="text-[#874e43]">{labels.confirmDelete}</span><button type="button" disabled={pending} onClick={() => deleteIngredient(item.id)} className="font-semibold text-[#a34f43] disabled:opacity-60">Confirm</button><button type="button" disabled={pending} onClick={() => setConfirmDeleteId(null)} className="text-[#738075]">Cancel</button></> : <><button type="button" onClick={() => openEditForm(item)} className="font-medium text-[#5d8065]">{t('edit')}</button><button type="button" onClick={() => setConfirmDeleteId(item.id)} className="font-medium text-[#a34f43]">{labels.delete}</button></>}</div></td></tr>
          })}</tbody></table></div>}
          {ingredients.length > 0 && <div className="border-t border-[#edf0eb] px-4 py-3 text-[10px] text-[#99a399]">{t('showing')} {ingredients.length} {t('recordsCount')}</div>}
        </div>
      </>}
    </section>
  )
}
