import { useEffect, useState } from 'react'
import { courseAccessCodeService, courseService } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useLanguage } from '../context/LanguageContext'
import type { AdminCourse, AdminCourseAccessCode, GeneratedCourseAccessCode } from '../types/api'

export function AdminCourseAccessCodesPage() {
  const { language } = useLanguage()
  const text = (en: string, ar: string) => language === 'ar' ? ar : en
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [codes, setCodes] = useState<AdminCourseAccessCode[]>([])
  const [courseId, setCourseId] = useState('')
  const [generated, setGenerated] = useState<GeneratedCourseAccessCode | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const load = async () => {
    const [courseResult, codeResult] = await Promise.all([courseService.adminList(1, 100), courseAccessCodeService.list()])
    setCourses(courseResult.items); setCodes(codeResult)
  }
  useEffect(() => { void load().catch(err => setError(getErrorMessage(err))) }, [])
  const generate = async () => {
    if (!courseId) { setError(text('Select a course first.', 'اختر دورة أولاً.')); return }
    setBusy(true); setError('')
    try { const result = await courseAccessCodeService.generate(courseId); setGenerated(result); await load() } catch (err) { setError(getErrorMessage(err)) } finally { setBusy(false) }
  }
  const copy = async () => {
    if (!generated) return
    try { await navigator.clipboard.writeText(generated.code) } catch { setError(text('Copy the code manually from the field below.', 'انسخ الرمز يدويًا من الحقل أدناه.')) }
  }
  const revoke = async (id: string) => {
    setBusy(true); setError('')
    try { await courseAccessCodeService.revoke(id); await load() } catch (err) { setError(getErrorMessage(err)) } finally { setBusy(false) }
  }
  return <section className="admin-page access-code-admin">
    <div className="admin-heading"><div><p className="eyebrow">{text('Admin', 'الإدارة')}</p><h1>{text('Course access codes', 'أكواد وصول الدورات')}</h1><p>{text('Codes expire after 30 minutes, can be used once, and grant Sequential access only.', 'تنتهي الأكواد بعد 30 دقيقة، وتُستخدم مرة واحدة، وتمنح وصولًا متسلسلاً فقط.')}</p></div></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <section className="admin-form"><h2>{text('Generate code', 'إنشاء رمز')}</h2><label>{text('Course', 'الدورة')}<select value={courseId} onChange={event => setCourseId(event.target.value)} disabled={busy}><option value="">{text('Select a course', 'اختر دورة')}</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><button type="button" onClick={generate} disabled={busy}>{busy ? text('Generating…', 'جار الإنشاء…') : text('Generate one-time code', 'إنشاء رمز لمرة واحدة')}</button></section>
    {generated && <section className="notice access-code-generated" aria-live="polite"><strong>{text('Copy this code now — it will not be shown again.', 'انسخ هذا الرمز الآن — لن يظهر مرة أخرى.')}</strong><label>{text('Access code', 'رمز الوصول')}<input value={generated.code} readOnly aria-label={text('Generated access code', 'رمز الوصول المنشأ')} /></label><div className="button-row"><button type="button" className="secondary-button" onClick={copy}>{text('Copy code', 'نسخ الرمز')}</button><span>{generated.courseTitle} · {new Date(generated.expiresAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</span></div></section>}
    <section className="admin-section"><h2>{text('Issued codes', 'الأكواد المُنشأة')}</h2>{codes.length === 0 ? <p>{text('No course access codes have been generated.', 'لم يتم إنشاء أكواد وصول بعد.')}</p> : <div className="admin-table-wrap"><table><thead><tr><th>{text('Course', 'الدورة')}</th><th>{text('Code', 'الرمز')}</th><th>{text('Created', 'الإنشاء')}</th><th>{text('Expires', 'الانتهاء')}</th><th>{text('Status', 'الحالة')}</th><th>{text('Redeemer', 'المستخدم')}</th><th /></tr></thead><tbody>{codes.map(code => <tr key={code.id}><td>{code.courseTitle}</td><td><code>{code.maskedCode}</code></td><td>{new Date(code.createdAt).toLocaleString()}</td><td>{new Date(code.expiresAt).toLocaleString()}</td><td><span className={'status status-' + code.status}>{code.status}</span></td><td>{code.redeemedByStudentId ?? '—'}</td><td>{code.canRevoke && <button type="button" className="secondary-button" onClick={() => void revoke(code.id)} disabled={busy}>{text('Revoke', 'إلغاء')}</button>}</td></tr>)}</tbody></table></div>}</section>
  </section>
}