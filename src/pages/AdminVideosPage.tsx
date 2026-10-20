import { type FormEvent, useEffect, useState } from 'react'
import { categoryService, courseService, lessonService, videoService } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useToast } from '../context/ToastContext'
import type { Category, ContentListItem, ExternalVideo, Lesson } from '../types/api'
import { useContentCopy } from '../components/ContentHubShared'
import { ImageUploadField } from '../components/ImageUploadField'
import '../components/ContentHub.css'

type Values = {
  title: string; url: string; description: string; categoryId: string; tags: string
  isFeatured: boolean; status: 'draft' | 'published' | 'unpublished'
  relatedCourseId: string; relatedLessonId: string; thumbnail?: File
}

const empty: Values = { title: '', url: '', description: '', categoryId: '', tags: '', isFeatured: false, status: 'draft', relatedCourseId: '', relatedLessonId: '' }

export function AdminVideosPage() {
  const { text } = useContentCopy()
  const { show } = useToast()
  const [items, setItems] = useState<ContentListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [values, setValues] = useState<Values>(empty)
  const [editing, setEditing] = useState<ExternalVideo | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [videos, categoryData, courseData] = await Promise.all([videoService.adminList(), categoryService.list(), courseService.adminList()])
      setItems(videos.items); setCategories(categoryData); setCourses(courseData.items.map(course => ({ id: course.id, title: course.title })))
    } catch (reason) { setError(getErrorMessage(reason)) }
  }
  useEffect(() => { void load() }, [])
  useEffect(() => { if (!values.relatedCourseId) { setLessons([]); return }; void lessonService.list(values.relatedCourseId).then(setLessons).catch(() => setLessons([])) }, [values.relatedCourseId])
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues(current => ({ ...current, [key]: value }))
  const formData = () => {
    const form = new FormData()
    form.append('Title', values.title.trim()); form.append('Url', values.url.trim()); form.append('Description', values.description.trim())
    form.append('CategoryId', values.categoryId); form.append('IsFeatured', String(values.isFeatured)); form.append('Status', values.status)
    form.append('RelatedCourseId', values.relatedCourseId); form.append('RelatedLessonId', values.relatedLessonId)
    values.tags.split(',').map(tag => tag.trim()).filter(Boolean).forEach(tag => form.append('Tags', tag))
    if (values.thumbnail) form.append('Thumbnail', values.thumbnail)
    return form
  }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!values.title.trim() || !values.url.trim()) { setError(text('Title and a supported public video URL are required.', 'العنوان ورابط فيديو عام مدعوم مطلوبان.')); return }
    setBusy(true); setError('')
    try {
      if (editing) await videoService.update(editing.id, formData()); else await videoService.create(formData())
      show(text('Video saved.', 'تم حفظ الفيديو.'), 'success'); setValues(empty); setEditing(null); await load()
    } catch (reason) { const message = getErrorMessage(reason); setError(message); show(message, 'error') } finally { setBusy(false) }
  }
  const edit = async (item: ContentListItem) => {
    setBusy(true); setError('')
    try {
      const video = await videoService.adminDetail(item.slug)
      setEditing(video); setValues({ title: video.title, url: video.url, description: video.description ?? '', categoryId: video.categoryId ?? '', tags: video.tags.join(', '), isFeatured: video.isFeatured, status: video.status as Values['status'], relatedCourseId: video.relatedCourseId ?? '', relatedLessonId: video.relatedLessonId ?? '' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (reason) { setError(getErrorMessage(reason)) } finally { setBusy(false) }
  }
  const remove = async (item: ContentListItem) => { if (!window.confirm(text(`Delete “${item.title}”?`, `حذف «${item.title}»؟`))) return; setBusy(true); try { await videoService.remove(item.id); show(text('Video deleted.', 'تم حذف الفيديو.'), 'success'); await load() } catch (reason) { const message = getErrorMessage(reason); setError(message); show(message, 'error') } finally { setBusy(false) } }
  const togglePublish = async (item: ContentListItem) => { setBusy(true); try { item.status === 'published' ? await videoService.unpublish(item.id) : await videoService.publish(item.id); show(item.status === 'published' ? text('Video unpublished.', 'تم إلغاء النشر.') : text('Video published.', 'تم نشر الفيديو.'), 'success'); await load() } catch (reason) { const message = getErrorMessage(reason); setError(message); show(message, 'error') } finally { setBusy(false) } }

  return <section className="admin-page"><div className="page-heading"><p className="eyebrow">{text('Content management', 'إدارة المحتوى')}</p><h1>{text('Videos', 'الفيديوهات')}</h1><p>{text('Store external video metadata and upload an optional local thumbnail.', 'احفظ بيانات الفيديوهات الخارجية وارفع صورة مصغرة اختيارية محليًا.')}</p></div><section className="admin-section"><h2>{editing ? text('Edit video', 'تعديل الفيديو') : text('Add video', 'إضافة فيديو')}</h2><form className="admin-form" onSubmit={save}><div className="form-grid"><label>{text('Title', 'العنوان')}<input required maxLength={160} value={values.title} onChange={event => set('title', event.target.value)} /></label><label>{text('External video URL', 'رابط الفيديو الخارجي')}<input required type="url" placeholder="https://youtube.com/..." value={values.url} onChange={event => set('url', event.target.value)} /></label><label>{text('Category', 'التصنيف')}<select value={values.categoryId} onChange={event => set('categoryId', event.target.value)}><option value="">{text('No category', 'بدون تصنيف')}</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>{text('Tags', 'الوسوم')}<input value={values.tags} onChange={event => set('tags', event.target.value)} placeholder={text('marketing, strategy', 'تسويق، استراتيجية')} /></label><label>{text('Status', 'الحالة')}<select value={values.status} onChange={event => set('status', event.target.value as Values['status'])}>{['draft', 'published', 'unpublished'].map(status => <option key={status} value={status}>{status}</option>)}</select></label><label>{text('Related course', 'الدورة المرتبطة')}<select value={values.relatedCourseId} onChange={event => { set('relatedCourseId', event.target.value); set('relatedLessonId', '') }}><option value="">{text('None', 'لا يوجد')}</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label>{text('Related lesson', 'الدرس المرتبط')}<select disabled={!values.relatedCourseId} value={values.relatedLessonId} onChange={event => set('relatedLessonId', event.target.value)}><option value="">{text('None', 'لا يوجد')}</option>{lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.orderIndex}. {lesson.title}</option>)}</select></label></div><div className="wide"><ImageUploadField label={text('Video thumbnail', 'الصورة المصغرة للفيديو')} helpText={text('JPG, PNG, or WebP. Up to 5 MB.', 'JPG أو PNG أو WebP. حتى 5 ميجابايت.')} existingImageUrl={editing?.thumbnailUrl} value={values.thumbnail} disabled={busy} onChange={thumbnail => set('thumbnail', thumbnail)} clearLabel={text('Cancel selection', 'إلغاء الاختيار')} selectLabel={text('Choose a video thumbnail', 'اختر صورة مصغرة للفيديو')} dropLabel={text('Drop an image here, or choose a file.', 'اسحب صورة هنا أو اختر ملفاً.')} invalidTypeMessage={text('Choose a JPG, PNG, or WebP image.', 'اختر صورة بصيغة JPG أو PNG أو WebP.')} tooLargeMessage={text('Choose an image smaller than 5 MB.', 'اختر صورة بحجم أقل من 5 ميجابايت.')} /></div><label className="wide">{text('Short description', 'وصف مختصر')}<textarea rows={4} maxLength={2000} value={values.description} onChange={event => set('description', event.target.value)} /></label><label className="form-check"><input type="checkbox" checked={values.isFeatured} onChange={event => set('isFeatured', event.target.checked)} /> {text('Feature this video', 'تمييز هذا الفيديو')}</label>{error && <p className="form-error" role="alert">{error}</p>}<div className="button-row"><button disabled={busy}>{busy ? text('Saving…', 'جار الحفظ…') : editing ? text('Save video', 'حفظ الفيديو') : text('Add video', 'إضافة فيديو')}</button>{editing && <button type="button" className="secondary-button" onClick={() => { setEditing(null); setValues(empty); setError('') }}>{text('Cancel', 'إلغاء')}</button>}</div></form></section><section className="admin-section"><h2>{text('All videos', 'كل الفيديوهات')}</h2>{items.length === 0 ? <p>{text('No videos yet.', 'لا توجد فيديوهات بعد.')}</p> : <div className="admin-table-wrap"><table><thead><tr><th>{text('Title', 'العنوان')}</th><th>{text('Platform', 'المنصة')}</th><th>{text('Status', 'الحالة')}</th><th>{text('Actions', 'الإجراءات')}</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.categoryName}</small></td><td>{item.platform}</td><td><span className={`status status-${item.status}`}>{item.status}</span></td><td><div className="button-row"><button className="text-button" disabled={busy} onClick={() => void edit(item)}>{text('Edit', 'تعديل')}</button><button className="text-button" disabled={busy} onClick={() => void togglePublish(item)}>{item.status === 'published' ? text('Unpublish', 'إلغاء النشر') : text('Publish', 'نشر')}</button><button className="danger-link" disabled={busy} onClick={() => void remove(item)}>{text('Delete', 'حذف')}</button></div></td></tr>)}</tbody></table></div>}</section></section>
}