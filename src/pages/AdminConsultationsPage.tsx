import { useEffect, useState, type ReactNode } from 'react'
import { getErrorMessage } from '../api/client'
import { consultationService } from '../api/services'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import type { ConsultationInterviewType, ConsultationPriority, ConsultationRequestDetail, ConsultationRequestListItem, ConsultationRequestStatus, ConsultationType } from '../types/api'
import './AdminConsultationsPage.css'

const statuses: ConsultationRequestStatus[] = ['Pending', 'Contacted', 'Confirmed', 'Completed', 'Declined', 'Cancelled']

const typeLabels: Record<ConsultationType, { en: string; ar: string }> = {
  RemoteConsulting: { en: 'Remote consulting', ar: 'استشارة عن بُعد' },
  FieldConsulting: { en: 'Field consulting', ar: 'استشارة ميدانية' },
  ExecutiveConsulting: { en: 'Executive consulting', ar: 'استشارة تنفيذية' },
  ConsultingContract: { en: 'Comprehensive consulting contract', ar: 'عقد استشاري شامل' },
}

const priorityLabels: Record<ConsultationPriority, { en: string; ar: string }> = {
  Low: { en: 'Low', ar: 'منخفضة' },
  Normal: { en: 'Normal', ar: 'عادية' },
  High: { en: 'High', ar: 'عالية' },
  Urgent: { en: 'Urgent', ar: 'عاجلة' },
}

const interviewTypeLabels: Record<ConsultationInterviewType, { en: string; ar: string }> = {
  Phone: { en: 'Phone call', ar: 'مكالمة هاتفية' },
  LiveZoom: { en: 'Live Zoom meeting', ar: 'اجتماع مباشر عبر زووم' },
  FieldVisit: { en: 'Field visit', ar: 'زيارة ميدانية' },
}

const statusLabels: Record<ConsultationRequestStatus, { en: string; ar: string }> = {
  Pending: { en: 'Pending', ar: 'قيد الانتظار' },
  Contacted: { en: 'Contacted', ar: 'تم التواصل' },
  Confirmed: { en: 'Confirmed', ar: 'تم التأكيد' },
  Completed: { en: 'Completed', ar: 'مكتملة' },
  Declined: { en: 'Declined', ar: 'مرفوضة' },
  Cancelled: { en: 'Cancelled', ar: 'ملغاة' },
}

function dateLabel(value: string, language: 'en' | 'ar', includeTime = false) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(parsed)
}

export function AdminConsultationsPage() {
  const { language } = useLanguage()
  const { show } = useToast()
  const [items, setItems] = useState<ConsultationRequestListItem[]>([])
  const [selected, setSelected] = useState<ConsultationRequestDetail | null>(null)
  const [filter, setFilter] = useState<ConsultationRequestStatus | ''>('')
  const [status, setStatus] = useState<ConsultationRequestStatus>('Pending')
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const text = (en: string, ar: string) => language === 'ar' ? ar : en
  const labelForStatus = (value: ConsultationRequestStatus) => statusLabels[value][language]
  const labelForType = (value: ConsultationType) => typeLabels[value][language]
  const labelForPriority = (value: ConsultationPriority) => priorityLabels[value][language]
  const labelForInterviewType = (value: ConsultationInterviewType) => interviewTypeLabels[value][language]

  async function loadRequests(nextFilter = filter) {
    setLoading(true)
    setError('')
    try {
      setItems(await consultationService.adminList(nextFilter || undefined))
    } catch (reason) {
      const message = text(getErrorMessage(reason), 'تعذر تحميل طلبات الاستشارات. حاول مرة أخرى.')
      setError(message)
      show(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadRequests(filter) }, [filter])

  async function viewRequest(id: string) {
    setLoadingDetail(true)
    setError('')
    try {
      const request = await consultationService.adminDetail(id)
      setSelected(request)
      setStatus(request.status)
      setAdminNotes(request.adminNotes ?? '')
    } catch (reason) {
      const message = text(getErrorMessage(reason), 'تعذر تحميل تفاصيل طلب الاستشارة. حاول مرة أخرى.')
      setError(message)
      show(message, 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  async function saveRequestStatus() {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      const updated = await consultationService.updateStatus(selected.id, status, adminNotes)
      setSelected(updated)
      await loadRequests(filter)
      show(text('Consultation request updated.', 'تم تحديث طلب الاستشارة.'), 'success')
    } catch (reason) {
      const message = text(getErrorMessage(reason), 'تعذر تحديث طلب الاستشارة. حاول مرة أخرى.')
      setError(message)
      show(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return <section className="admin-page consultation-admin" dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <header className="page-heading consultation-admin__heading">
      <p className="eyebrow">{text('Administration', 'الإدارة')}</p>
      <h1>{text('Consultation requests', 'طلبات الاستشارات')}</h1>
      <p>{text('Review business enquiries, follow up with prospective clients, and keep each request’s status accurate.', 'راجع طلبات الأعمال، وتابع مع العملاء المحتملين، وحافظ على حالة كل طلب محدثة.')}</p>
    </header>

    {error && <p className="form-error" role="alert">{error}</p>}

    <section className="admin-section consultation-admin__list" aria-labelledby="consultation-requests-title">
      <div className="consultation-admin__toolbar">
        <div>
          <h2 id="consultation-requests-title">{text('All requests', 'كل الطلبات')}</h2>
          <p>{loading ? text('Loading requests…', 'جارٍ تحميل الطلبات…') : text(`${items.length} request${items.length === 1 ? '' : 's'} shown`, `عرض ${items.length} طلب`)}</p>
        </div>
        <label className="consultation-admin__filter">
          <span>{text('Filter by status', 'تصفية حسب الحالة')}</span>
          <select value={filter} onChange={(event) => { setSelected(null); setFilter(event.target.value as ConsultationRequestStatus | '') }}>
            <option value="">{text('All statuses', 'كل الحالات')}</option>
            {statuses.map((item) => <option key={item} value={item}>{labelForStatus(item)}</option>)}
          </select>
        </label>
      </div>

      {loading ? <div className="consultation-admin__loading" aria-live="polite"><span /><span /><span /></div>
        : items.length === 0 ? <div className="empty consultation-admin__empty"><p>{text('No consultation requests match this view yet.', 'لا توجد طلبات استشارات مطابقة لهذا العرض بعد.')}</p></div>
          : <div className="admin-table-wrap consultation-admin__table"><table>
            <thead><tr>
              <th>{text('Business', 'المنشأة')}</th>
              <th>{text('Consultation', 'نوع الاستشارة')}</th>
              <th>{text('Preferred time', 'الموعد المفضل')}</th>
              <th>{text('Priority', 'الأولوية')}</th>
              <th>{text('Status', 'الحالة')}</th>
              <th><span className="sr-only">{text('Actions', 'الإجراءات')}</span></th>
            </tr></thead>
            <tbody>{items.map((item) => <tr key={item.id}>
              <td><strong>{item.companyName}</strong><small>{item.emailAddress}</small></td>
              <td>{labelForType(item.consultationType)}</td>
              <td><strong>{dateLabel(item.preferredInterviewDate, language)}</strong><small>{item.preferredTimeFrom} – {item.preferredTimeTo}</small></td>
              <td><span className="consultation-admin__priority">{labelForPriority(item.priority)}</span></td>
              <td><span className={`consultation-admin__status consultation-admin__status--${item.status.toLowerCase()}`}>{labelForStatus(item.status)}</span></td>
              <td><button className="text-button" type="button" onClick={() => void viewRequest(item.id)} disabled={loadingDetail || saving}>{loadingDetail && selected?.id === item.id ? text('Loading…', 'جارٍ التحميل…') : text('View', 'عرض')}</button></td>
            </tr>)}</tbody>
          </table></div>}
    </section>

    {selected && <section className="admin-section consultation-admin__detail" aria-labelledby="consultation-request-detail-title">
      <div className="consultation-admin__detail-heading">
        <div>
          <p className="eyebrow">{text('Selected request', 'الطلب المحدد')}</p>
          <h2 id="consultation-request-detail-title">{selected.companyName}</h2>
          <p>{text('Submitted', 'تم الإرسال')} {dateLabel(selected.submittedAt, language, true)}</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => setSelected(null)}>{text('Close details', 'إغلاق التفاصيل')}</button>
      </div>

      <div className="consultation-admin__detail-grid">
        <DetailGroup title={text('Contact', 'التواصل')}>
          <DetailItem label={text('Email', 'البريد الإلكتروني')} value={selected.emailAddress} />
          <DetailItem label={text('WhatsApp', 'واتساب')} value={selected.whatsappNumber} />
          <DetailItem label={text('Preferred interview', 'المقابلة المفضلة')} value={`${labelForInterviewType(selected.interviewType)} · ${dateLabel(selected.preferredInterviewDate, language)} · ${selected.preferredTimeFrom} – ${selected.preferredTimeTo}`} />
        </DetailGroup>
        <DetailGroup title={text('Business profile', 'بيانات النشاط')}>
          <DetailItem label={text('Business name', 'اسم النشاط')} value={selected.businessName} />
          <DetailItem label={text('Field', 'المجال')} value={selected.businessField} />
          <DetailItem label={text('Established', 'تاريخ التأسيس')} value={dateLabel(selected.establishmentDate, language)} />
          <DetailItem label={text('Partners', 'عدد الشركاء')} value={selected.numberOfPartners == null ? text('Not provided', 'غير محدد') : String(selected.numberOfPartners)} />
          <DetailItem label={text('Position', 'المنصب')} value={selected.positionInCompany} />
        </DetailGroup>
        <DetailGroup title={text('Request brief', 'ملخص الطلب')} wide>
          <DetailItem label={text('Consultation package', 'حزمة الاستشارة')} value={labelForType(selected.consultationType)} />
          <DetailItem label={text('Priority', 'الأولوية')} value={labelForPriority(selected.priority)} />
          <DetailItem label={text('Business activity', 'طبيعة النشاط')} value={selected.businessActivity} />
          <DetailItem label={text('Products or services', 'المنتجات أو الخدمات')} value={selected.mainProductsOrServices} />
          <DetailItem label={text('Consultation topic', 'موضوع الاستشارة')} value={selected.consultationTopic} />
          <DetailItem label={text('Reason for consultation', 'سبب طلب الاستشارة')} value={selected.reasonForConsultation} />
        </DetailGroup>
      </div>

      <div className="consultation-admin__status-editor">
        <div>
          <h3>{text('Manage request', 'إدارة الطلب')}</h3>
          <p>{text('Only administrators can change the request status or leave internal follow-up notes.', 'يمكن للمديرين فقط تغيير حالة الطلب أو إضافة ملاحظات متابعة داخلية.')}</p>
        </div>
        <label>
          <span>{text('Request status', 'حالة الطلب')}</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as ConsultationRequestStatus)} disabled={saving}>
            {statuses.map((item) => <option key={item} value={item}>{labelForStatus(item)}</option>)}
          </select>
        </label>
        <label className="consultation-admin__notes">
          <span>{text('Internal notes (optional)', 'ملاحظات داخلية اختيارية')}</span>
          <textarea rows={5} maxLength={2000} value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} disabled={saving} placeholder={text('Visible only to administrators.', 'تظهر للمديرين فقط.')} />
        </label>
        <div className="consultation-admin__detail-actions"><button type="button" onClick={() => void saveRequestStatus()} disabled={saving}>{saving ? text('Saving…', 'جارٍ الحفظ…') : text('Save request', 'حفظ الطلب')}</button></div>
      </div>
    </section>}
  </section>
}

function DetailGroup({ title, children, wide = false }: { title: string; children: ReactNode; wide?: boolean }) {
  return <section className={`consultation-admin__detail-group${wide ? ' consultation-admin__detail-group--wide' : ''}`}><h3>{title}</h3><dl>{children}</dl></section>
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value || '—'}</dd></div>
}
