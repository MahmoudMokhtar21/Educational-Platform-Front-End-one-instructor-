import { useEffect, useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { getErrorMessage, resolveMediaUrl } from "../api/client"
import { courseService, lessonService, trackService } from "../api/services"
import { CourseForm, courseFormData, type CourseFormValues } from "../components/CourseForm"
import { useLanguage } from "../context/LanguageContext"
import type { AdminCourse, Lesson, LessonResource, Track } from "../types/api"

type Text = (english: string, arabic: string) => string
type LessonValues = { title: string; trackId: string; contentText: string; duration: string; isPreview: boolean; video?: File; resources: { title: string; fileUrl: string; fileType: string }[] }
type TrackValues = { title: string; description: string }

const blankLesson = (trackId = ""): LessonValues => ({ title: "", trackId, contentText: "", duration: "0", isPreview: false, resources: [] })
const blankTrack = (): TrackValues => ({ title: "", description: "" })

const formDataForLesson = (values: LessonValues) => {
  const form = new FormData()
  form.append("Title", values.title.trim())
  form.append("TrackId", values.trackId)
  form.append("ContentText", values.contentText)
  form.append("VideoDurationSeconds", values.duration)
  form.append("IsPreview", String(values.isPreview))
  if (values.video) form.append("Video", values.video)
  values.resources
    .filter(resource => resource.title.trim() && resource.fileUrl.trim() && resource.fileType.trim())
    .forEach((resource, index) => {
      form.append("Resources[" + index + "].Title", resource.title.trim())
      form.append("Resources[" + index + "].FileUrl", resource.fileUrl.trim())
      form.append("Resources[" + index + "].FileType", resource.fileType.trim())
    })
  return form
}

function TrackEditor({ track, busy, onClose, onSave, text }: { track?: Track; busy: boolean; onClose: () => void; onSave: (values: TrackValues) => Promise<void>; text: Text }) {
  const [values, setValues] = useState<TrackValues>(() => track ? { title: track.title, description: track.description ?? "" } : blankTrack())
  const [error, setError] = useState("")
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (values.title.trim().length < 2) {
      setError(text("Track title must contain at least two characters.", "يجب أن يتكون عنوان المسار من حرفين على الأقل."))
      return
    }
    setError("")
    await onSave({ title: values.title.trim(), description: values.description.trim() })
  }
  return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="track-dialog-title"><div className="modal-heading"><h2 id="track-dialog-title">{track ? text("Edit track", "تعديل المسار") : text("Add track", "إضافة مسار")}</h2><button type="button" className="text-button" onClick={onClose} disabled={busy}>{text("Close", "إغلاق")}</button></div><form className="admin-form" onSubmit={submit}><label>{text("Title", "العنوان")}<input required maxLength={160} value={values.title} onChange={event => setValues(current => ({ ...current, title: event.target.value }))} /></label><label>{text("Description", "الوصف")}<textarea rows={4} maxLength={2000} value={values.description} onChange={event => setValues(current => ({ ...current, description: event.target.value }))} /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose} disabled={busy}>{text("Cancel", "إلغاء")}</button><button disabled={busy}>{busy ? text("Saving…", "جار الحفظ…") : text("Save track", "حفظ المسار")}</button></div></form></section></div>
}

function DeleteTrackDialog({ track, tracks, busy, onClose, onDelete, text }: { track: Track; tracks: Track[]; busy: boolean; onClose: () => void; onDelete: (moveLessonsToTrackId?: string) => Promise<void>; text: Text }) {
  const targets = tracks.filter(item => item.id !== track.id)
  const [targetId, setTargetId] = useState(targets[0]?.id ?? "")
  const hasLessons = track.lessons.length > 0
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (hasLessons && !targetId) return
    await onDelete(hasLessons ? targetId : undefined)
  }
  return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-track-dialog-title"><div className="modal-heading"><h2 id="delete-track-dialog-title">{text("Delete track", "حذف المسار")}</h2><button type="button" className="text-button" onClick={onClose} disabled={busy}>{text("Close", "إغلاق")}</button></div>{hasLessons && targets.length === 0 ? <div className="form-error"><p>{text("This is the only track with lessons. Add another track before deleting it.", "هذا هو المسار الوحيد الذي يحتوي على دروس. أضف مساراً آخر قبل حذفه.")}</p><button type="button" className="secondary-button" onClick={onClose}>{text("Close", "إغلاق")}</button></div> : <form className="admin-form" onSubmit={submit}><p>{hasLessons ? text("The lessons will be moved safely to the selected track. Videos and resources will not be deleted.", "سيتم نقل الدروس بأمان إلى المسار المحدد. لن يتم حذف الفيديوهات أو الموارد.") : text("This empty track will be deleted.", "سيتم حذف هذا المسار الفارغ.")}</p>{hasLessons && <label>{text("Move lessons to", "نقل الدروس إلى")}<select required value={targetId} onChange={event => setTargetId(event.target.value)}>{targets.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose} disabled={busy}>{text("Cancel", "إلغاء")}</button><button className="danger-button" disabled={busy}>{busy ? text("Deleting…", "جار الحذف…") : text("Move and delete", "نقل وحذف")}</button></div></form>}</section></div>
}

function LessonEditor({ lesson, initialTrackId, tracks, busy, onClose, onSave, text }: { lesson?: Lesson; initialTrackId: string; tracks: Track[]; busy: boolean; onClose: () => void; onSave: (values: LessonValues) => Promise<void>; text: Text }) {
  const [values, setValues] = useState<LessonValues>(() => lesson ? { title: lesson.title, trackId: lesson.trackId ?? initialTrackId, contentText: lesson.contentText ?? "", duration: String(lesson.videoDurationSeconds), isPreview: lesson.isPreview, resources: lesson.resources?.map(({ title, fileUrl, fileType }) => ({ title, fileUrl, fileType })) ?? [] } : blankLesson(initialTrackId))
  const [error, setError] = useState("")
  const update = <K extends keyof LessonValues>(key: K, value: LessonValues[K]) => setValues(current => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (values.title.trim().length < 2) {
      setError(text("Lesson title must contain at least two characters.", "يجب أن يتكون عنوان الدرس من حرفين على الأقل."))
      return
    }
    if (!values.trackId) {
      setError(text("Choose a track for this lesson.", "اختر مساراً لهذا الدرس."))
      return
    }
    if (!/^\d+$/.test(values.duration)) {
      setError(text("Duration must be zero or a positive whole number of seconds.", "يجب أن تكون المدة صفراً أو عدداً صحيحاً موجباً من الثواني."))
      return
    }
    setError("")
    await onSave(values)
  }
  return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="lesson-dialog-title"><div className="modal-heading"><h2 id="lesson-dialog-title">{lesson ? text("Edit lesson", "تعديل الدرس") : text("Add lesson", "إضافة درس")}</h2><button type="button" className="text-button" onClick={onClose} disabled={busy}>{text("Close", "إغلاق")}</button></div><form className="admin-form" onSubmit={submit}><label>{text("Track", "المسار")}<select required value={values.trackId} onChange={event => update("trackId", event.target.value)}>{tracks.map(track => <option key={track.id} value={track.id}>{track.title}</option>)}</select></label><label>{text("Title", "العنوان")}<input required value={values.title} onChange={event => update("title", event.target.value)} /></label><label>{text("Content text", "محتوى الدرس")}<textarea rows={5} value={values.contentText} onChange={event => update("contentText", event.target.value)} /></label><div className="form-grid"><label>{text("Video duration in seconds", "مدة الفيديو بالثواني")}<input type="number" min="0" value={values.duration} onChange={event => update("duration", event.target.value)} /></label><label>{text("Video", "الفيديو")} <span className="field-note">{text("MP4, WebM, or MOV; optional", "MP4 أو WebM أو MOV؛ اختياري")}</span><input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={event => update("video", event.target.files?.[0])} /></label></div><label className="checkbox"><input type="checkbox" checked={values.isPreview} onChange={event => update("isPreview", event.target.checked)} /> {text("Allow this lesson as a preview", "السماح بمعاينة هذا الدرس")}</label><fieldset><legend>{text("Resources", "الموارد")} <span className="field-note">{text("New resources use a hosted file URL, as required by the current API.", "تستخدم الموارد الجديدة رابط ملف مستضاف وفق واجهة API الحالية.")}</span></legend>{values.resources.map((resource, index) => <div className="resource-draft" key={index}><input aria-label={text("Resource title", "عنوان المورد")} placeholder={text("Title", "العنوان")} value={resource.title} onChange={event => setValues(current => ({ ...current, resources: current.resources.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) }))} /><input aria-label={text("Resource URL", "رابط المورد")} placeholder={text("File URL", "رابط الملف")} value={resource.fileUrl} onChange={event => setValues(current => ({ ...current, resources: current.resources.map((item, itemIndex) => itemIndex === index ? { ...item, fileUrl: event.target.value } : item) }))} /><input aria-label={text("Resource type", "نوع المورد")} placeholder={text("Type", "النوع")} value={resource.fileType} onChange={event => setValues(current => ({ ...current, resources: current.resources.map((item, itemIndex) => itemIndex === index ? { ...item, fileType: event.target.value } : item) }))} /><button type="button" className="danger-link" onClick={() => setValues(current => ({ ...current, resources: current.resources.filter((_, itemIndex) => itemIndex !== index) }))}>{text("Remove", "إزالة")}</button></div>)}<button type="button" className="secondary-button" onClick={() => setValues(current => ({ ...current, resources: [...current.resources, { title: "", fileUrl: "", fileType: "" }] }))}>{text("Add resource", "إضافة مورد")}</button></fieldset>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose} disabled={busy}>{text("Cancel", "إلغاء")}</button><button disabled={busy}>{busy ? text("Saving…", "جار الحفظ…") : text("Save lesson", "حفظ الدرس")}</button></div></form></section></div>
}

function ResourceRow({ lesson, resource, onChanged, text }: { lesson: Lesson; resource: LessonResource; onChanged: () => Promise<void>; text: Text }) {
  const [busy, setBusy] = useState(false)
  const [accessUrl, setAccessUrl] = useState("")
  useEffect(() => {
    let active = true
    void lessonService.resourceAccess(lesson.id, resource.id).then(access => { if (active) setAccessUrl(resolveMediaUrl(access.url)) }).catch(() => { if (active) setAccessUrl("") })
    return () => { active = false }
  }, [lesson.id, resource.id])
  const rename = async () => {
    const title = window.prompt(text("Resource title", "عنوان المورد"), resource.title)
    if (title === null || !title.trim() || title.trim() === resource.title) return
    setBusy(true)
    try {
      const form = new FormData()
      form.append("Title", title.trim())
      await lessonService.updateResource(lesson.id, resource.id, form)
      await onChanged()
    } catch (error) { window.alert(getErrorMessage(error)) } finally { setBusy(false) }
  }
  const replace = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const form = new FormData()
      form.append("File", file)
      await lessonService.updateResource(lesson.id, resource.id, form)
      await onChanged()
    } catch (error) { window.alert(getErrorMessage(error)) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!window.confirm(text("Remove this resource? This cannot be undone.", "إزالة هذا المورد؟ لا يمكن التراجع عن ذلك."))) return
    setBusy(true)
    try {
      await lessonService.removeResource(lesson.id, resource.id)
      await onChanged()
    } catch (error) { window.alert(getErrorMessage(error)) } finally { setBusy(false) }
  }
  return <li className="resource-row">{accessUrl ? <a href={accessUrl} target="_blank" rel="noopener noreferrer">{resource.title} <small>{resource.fileType}</small></a> : <span>{resource.title} <small>{resource.fileType}</small></span>}<div><button type="button" className="text-button" disabled={busy} onClick={rename}>{text("Rename", "إعادة تسمية")}</button><label className="file-action">{text("Replace", "استبدال")}<input type="file" disabled={busy} onChange={event => replace(event.target.files?.[0])} /></label><button type="button" className="danger-link" disabled={busy} onClick={remove}>{text("Remove", "إزالة")}</button></div></li>
}

function LessonList({ lessons, busy, onEdit, onDelete, onReorder, onChanged, text }: { lessons: Lesson[]; busy: boolean; onEdit: (lesson: Lesson) => void; onDelete: (lesson: Lesson) => void; onReorder: (fromId: string, toId: string) => void; onChanged: () => Promise<void>; text: Text }) {
  const [draggedId, setDraggedId] = useState("")
  if (lessons.length === 0) return <div className="empty compact"><p>{text("No lessons in this track yet.", "لا توجد دروس في هذا المسار بعد.")}</p></div>
  return <ol className="admin-lessons">{lessons.map(lesson => <li key={lesson.id} draggable={!busy} className={draggedId === lesson.id ? "dragging" : ""} onDragStart={() => setDraggedId(lesson.id)} onDragEnd={() => setDraggedId("")} onDragOver={event => event.preventDefault()} onDrop={() => { if (draggedId && draggedId !== lesson.id) onReorder(draggedId, lesson.id); setDraggedId("") }}><div className="lesson-summary"><span className="drag-handle" aria-hidden="true">⠿</span><div><strong>{lesson.orderIndex}. {lesson.title}</strong><p>{lesson.videoDurationSeconds}s · {lesson.isPreview ? text("Preview enabled", "المعاينة مفعلة") : text("Members only", "للمسجلين فقط")}</p>{lesson.resources?.length ? <ul className="resource-list">{lesson.resources.map(resource => <ResourceRow key={resource.id} lesson={lesson} resource={resource} onChanged={onChanged} text={text} />)}</ul> : null}</div></div><div className="button-row"><button type="button" className="secondary-button" onClick={() => onEdit(lesson)} disabled={busy}>{text("Edit", "تعديل")}</button><button type="button" className="danger-button" onClick={() => onDelete(lesson)} disabled={busy}>{text("Delete", "حذف")}</button></div></li>)}</ol>
}

export function AdminCoursePage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { language } = useLanguage()
  const text: Text = (english, arabic) => language === "ar" ? arabic : english
  const [course, setCourse] = useState<AdminCourse | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [expandedTrackIds, setExpandedTrackIds] = useState<string[]>([])
  const [error, setError] = useState("")
  const [notice, setNotice] = useState<string>((location.state as { notice?: string } | null)?.notice ?? "")
  const [busy, setBusy] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null | undefined>(undefined)
  const [newLessonTrackId, setNewLessonTrackId] = useState("")
  const [editingTrack, setEditingTrack] = useState<Track | null | undefined>(undefined)
  const [deletingTrack, setDeletingTrack] = useState<Track | null>(null)
  const [draggedTrackId, setDraggedTrackId] = useState("")

  const load = async () => {
    try {
      const [courseData, trackData] = await Promise.all([courseService.adminDetail(id), trackService.list(id)])
      const orderedTracks = [...trackData].sort((left, right) => left.orderIndex - right.orderIndex)
      const loadedLessons = orderedTracks.flatMap(track => track.lessons ?? []).sort((left, right) => left.orderIndex - right.orderIndex)
      setCourse(courseData)
      setTracks(orderedTracks)
      setLessons(loadedLessons)
      setExpandedTrackIds(current => current.length === 0 ? orderedTracks.map(track => track.id) : current.filter(trackId => orderedTracks.some(track => track.id === trackId)))
    } catch (requestError) { setError(getErrorMessage(requestError)) }
  }

  useEffect(() => { void load() }, [id])

  const saveCourse = async (values: CourseFormValues) => {
    if (!course) return
    setBusy(true)
    setError("")
    try {
      await courseService.update(course.id, courseFormData(values, false))
      setNotice(text("Course changes saved.", "تم حفظ تغييرات الدورة."))
      await load()
    } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setBusy(false) }
  }

  const publish = async () => {
    if (!course || !window.confirm(text("Publish this course? It will become visible to students.", "نشر هذه الدورة؟ ستصبح مرئية للدارسين."))) return
    setBusy(true)
    try {
      await courseService.publish(course.id)
      setNotice(text("Course published successfully.", "تم نشر الدورة بنجاح."))
      await load()
    } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setBusy(false) }
  }

  const removeCourse = async () => {
    if (!course || !window.confirm(text("Delete this course? This cannot be undone.", "حذف هذه الدورة؟ لا يمكن التراجع عن ذلك."))) return
    setBusy(true)
    try {
      await courseService.remove(course.id)
      navigate("/admin/courses", { state: { notice: text("Course deleted.", "تم حذف الدورة.") } })
    } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setBusy(false) }
  }

  const saveTrack = async (values: TrackValues) => {
    setBusy(true)
    setError("")
    try {
      const body = { title: values.title, description: values.description || undefined }
      if (editingTrack) await trackService.update(id, editingTrack.id, body)
      else await trackService.create(id, body)
      setEditingTrack(undefined)
      setNotice(editingTrack ? text("Track updated.", "تم تحديث المسار.") : text("Track created.", "تم إنشاء المسار."))
      await load()
    } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setBusy(false) }
  }

  const deleteTrack = async (moveLessonsToTrackId?: string) => {
    if (!deletingTrack) return
    setBusy(true)
    setError("")
    try {
      await trackService.remove(id, deletingTrack.id, moveLessonsToTrackId)
      setDeletingTrack(null)
      setNotice(text("Track deleted. Its lessons were preserved.", "تم حذف المسار مع الحفاظ على دروسه."))
      await load()
    } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setBusy(false) }
  }

  const saveLesson = async (values: LessonValues) => {
    setBusy(true)
    setError("")
    try {
      if (editingLesson) {
        await lessonService.update(editingLesson.id, formDataForLesson(values))
        if (values.trackId !== editingLesson.trackId) await trackService.moveLesson(id, editingLesson.id, values.trackId)
      } else {
        await lessonService.create(id, formDataForLesson(values))
      }
      setEditingLesson(undefined)
      setNewLessonTrackId("")
      setNotice(editingLesson ? text("Lesson updated.", "تم تحديث الدرس.") : text("Lesson created.", "تم إنشاء الدرس."))
      await load()
    } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setBusy(false) }
  }

  const deleteLesson = async (lesson: Lesson) => {
    if (!window.confirm(text("Delete this lesson? This cannot be undone.", "حذف هذا الدرس؟ لا يمكن التراجع عن ذلك."))) return
    setBusy(true)
    try {
      await lessonService.remove(lesson.id)
      setNotice(text("Lesson deleted.", "تم حذف الدرس."))
      await load()
    } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setBusy(false) }
  }

  const reorderTracks = async (fromId: string, toId: string) => {
    const fromIndex = tracks.findIndex(track => track.id === fromId)
    const toIndex = tracks.findIndex(track => track.id === toId)
    if (fromIndex < 0 || toIndex < 0) return
    const reordered = [...tracks]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    const normalized = reordered.map((track, index) => ({ ...track, orderIndex: index + 1 }))
    setTracks(normalized)
    setBusy(true)
    setError("")
    try {
      await trackService.reorder(id, normalized.map(track => ({ trackId: track.id, orderIndex: track.orderIndex })))
      setNotice(text("Track order saved.", "تم حفظ ترتيب المسارات."))
    } catch (requestError) { setError(getErrorMessage(requestError)); await load() } finally { setBusy(false) }
  }

  const reorderLessons = async (trackId: string, fromId: string, toId: string) => {
    const trackLessons = lessons.filter(lesson => lesson.trackId === trackId).sort((left, right) => left.orderIndex - right.orderIndex)
    const fromIndex = trackLessons.findIndex(lesson => lesson.id === fromId)
    const toIndex = trackLessons.findIndex(lesson => lesson.id === toId)
    if (fromIndex < 0 || toIndex < 0) return
    const reordered = [...trackLessons]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    const normalized = reordered.map((lesson, index) => ({ ...lesson, orderIndex: index + 1 }))
    const byId = new Map(normalized.map(lesson => [lesson.id, lesson]))
    setLessons(current => current.map(lesson => byId.get(lesson.id) ?? lesson))
    setBusy(true)
    setError("")
    try {
      await trackService.reorderLessons(id, trackId, normalized.map(lesson => ({ lessonId: lesson.id, orderIndex: lesson.orderIndex })))
      setNotice(text("Lesson order saved.", "تم حفظ ترتيب الدروس."))
    } catch (requestError) { setError(getErrorMessage(requestError)); await load() } finally { setBusy(false) }
  }

  const toggleTrack = (trackId: string) => setExpandedTrackIds(current => current.includes(trackId) ? current.filter(idValue => idValue !== trackId) : [...current, trackId])

  if (error && !course) return <section className="empty"><h1>{text("Course unavailable", "الدورة غير متاحة")}</h1><p role="alert">{error}</p><Link to="/admin/courses">{text("Back to courses", "العودة إلى الدورات")}</Link></section>
  if (!course) return <section className="empty"><p>{text("Loading course…", "جار تحميل الدورة…")}</p></section>

  return <section className="admin-page"><div className="admin-heading"><div><Link to="/admin/courses">← {text("All courses", "كل الدورات")}</Link><h1>{course.title}</h1><span className={"status status-" + course.status}>{course.status}</span></div><div className="button-row">{course.status !== "published" && <button type="button" onClick={publish} disabled={busy}>{text("Publish course", "نشر الدورة")}</button>}<button type="button" className="danger-button" onClick={removeCourse} disabled={busy}>{text("Delete course", "حذف الدورة")}</button></div></div>{notice && <p className="notice" role="status">{notice}</p>}{error && <p className="form-error" role="alert">{error}</p>}<section className="admin-section"><h2>{text("Course details", "تفاصيل الدورة")}</h2><CourseForm course={course} busy={busy} submitLabel={text("Save course", "حفظ الدورة")} onSubmit={saveCourse} /></section><section className="admin-section"><div className="admin-heading"><div><h2>{text("Tracks and lessons", "المسارات والدروس")}</h2><p className="field-note">{text("Drag track headers or lesson handles to save their order. Lessons stay inside their selected track.", "اسحب رؤوس المسارات أو مقابض الدروس لحفظ الترتيب. تبقى الدروس داخل المسار المحدد.")}</p></div><button type="button" onClick={() => setEditingTrack(null)} disabled={busy}>{text("Add track", "إضافة مسار")}</button></div>{tracks.length === 0 ? <div className="empty compact"><p>{text("Create the first track, then add lessons inside it.", "أنشئ المسار الأول، ثم أضف الدروس بداخله.")}</p></div> : <div className="track-admin-list">{tracks.map(track => { const trackLessons = lessons.filter(lesson => lesson.trackId === track.id).sort((left, right) => left.orderIndex - right.orderIndex); const expanded = expandedTrackIds.includes(track.id); return <section key={track.id} className="track-admin-card"><header className="track-admin-heading" draggable={!busy} onDragStart={() => setDraggedTrackId(track.id)} onDragEnd={() => setDraggedTrackId("")} onDragOver={event => event.preventDefault()} onDrop={() => { if (draggedTrackId && draggedTrackId !== track.id) void reorderTracks(draggedTrackId, track.id); setDraggedTrackId("") }}><button type="button" className="track-disclosure" onClick={() => toggleTrack(track.id)} aria-expanded={expanded}><span className="drag-handle" aria-hidden="true">⠿</span><span><strong>{track.orderIndex}. {track.title}</strong><small>{track.description || text("No description", "لا يوجد وصف")} · {trackLessons.length} {text("lessons", "دروس")}</small></span></button><div className="button-row"><button type="button" className="text-button" onClick={() => setEditingTrack(track)} disabled={busy}>{text("Edit", "تعديل")}</button><button type="button" className="danger-link" onClick={() => setDeletingTrack(track)} disabled={busy}>{text("Delete", "حذف")}</button></div></header>{expanded && <div className="track-admin-content"><div className="track-lessons-heading"><h3>{text("Lessons", "الدروس")}</h3><button type="button" className="secondary-button" onClick={() => { setNewLessonTrackId(track.id); setEditingLesson(null) }} disabled={busy}>{text("Add lesson", "إضافة درس")}</button></div><LessonList lessons={trackLessons} busy={busy} onEdit={lesson => { setNewLessonTrackId(lesson.trackId ?? track.id); setEditingLesson(lesson) }} onDelete={deleteLesson} onReorder={(fromId, toId) => void reorderLessons(track.id, fromId, toId)} onChanged={load} text={text} /></div>}</section> })}</div>}</section>{editingTrack !== undefined && <TrackEditor key={editingTrack?.id ?? "new-track"} track={editingTrack ?? undefined} busy={busy} onClose={() => setEditingTrack(undefined)} onSave={saveTrack} text={text} />}{deletingTrack && <DeleteTrackDialog track={deletingTrack} tracks={tracks} busy={busy} onClose={() => setDeletingTrack(null)} onDelete={deleteTrack} text={text} />}{editingLesson !== undefined && <LessonEditor key={editingLesson?.id ?? newLessonTrackId} lesson={editingLesson ?? undefined} initialTrackId={newLessonTrackId} tracks={tracks} busy={busy} onClose={() => { setEditingLesson(undefined); setNewLessonTrackId("") }} onSave={saveLesson} text={text} />}</section>
}
