import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { LessonComments } from "../components/LessonComments"
import { getErrorMessage, resolveMediaUrl } from "../api/client"
import { courseService, enrollmentService, lessonService } from "../api/services"
import type { CourseDetail, Lesson, Track } from "../types/api"
import { useLanguage } from "../context/LanguageContext"

const PROGRESS_REPORT_INTERVAL_SECONDS = 10

export function LearningPage() {
  const { slug = "" } = useParams()
  const { language } = useLanguage()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [selectedId, setSelectedId] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [videoError, setVideoError] = useState("")
  const [resourceUrls, setResourceUrls] = useState<Record<string, string>>({})
  const [expandedTrackIds, setExpandedTrackIds] = useState<string[]>([])
  const lastReportedSeconds = useRef(0)
  const progressRequestInFlight = useRef(false)
  const text = (english: string, arabic: string) => language === "ar" ? arabic : english

  const normalizeTracks = (data: CourseDetail): Track[] => data.tracks?.length
    ? [...data.tracks].sort((left, right) => left.orderIndex - right.orderIndex).map(track => ({ ...track, lessons: [...track.lessons].sort((left, right) => left.orderIndex - right.orderIndex) }))
    : data.lessons.length
      ? [{ id: "legacy-track", courseId: data.id, title: text("General", "عام"), description: undefined, orderIndex: 1, createdAt: "", lessons: [...data.lessons].sort((left, right) => left.orderIndex - right.orderIndex), lessonCount: data.lessons.length }]
      : []

  const applyCourse = (data: CourseDetail, preferredLessonId?: string) => {
    const tracks = normalizeTracks(data)
    const lessons = tracks.flatMap(track => track.lessons)
    setCourse({ ...data, tracks, lessons })
    setExpandedTrackIds(current => current.length === 0 ? tracks.map(track => track.id) : current.filter(id => tracks.some(track => track.id === id)))
    setSelectedId(current => {
      const preferred = preferredLessonId && lessons.find(lesson => lesson.id === preferredLessonId && !lesson.isLocked)
      if (preferred) return preferred.id
      const stillAvailable = lessons.find(lesson => lesson.id === current && !lesson.isLocked)
      if (stillAvailable) return stillAvailable.id
      return lessons.find(lesson => lesson.isCurrent && !lesson.isLocked)?.id
        ?? lessons.find(lesson => !lesson.isLocked && !lesson.isCompleted)?.id
        ?? lessons.find(lesson => !lesson.isLocked)?.id
        ?? ""
    })
  }

  const refreshCourse = async (preferredLessonId?: string) => {
    const data = await courseService.detail(slug)
    applyCourse(data, preferredLessonId)
  }

  useEffect(() => {
    let active = true
    courseService.detail(slug).then(data => {
      if (!active) return
      if (!data.isEnrolled && !data.hasAdminAccess) {
        setError(text("You must be enrolled to access this course.", "يجب التسجيل في الدورة للوصول إليها."))
        return
      }
      applyCourse(data)
    }).catch(requestError => { if (active) setError(getErrorMessage(requestError)) })
    return () => { active = false }
  }, [slug, language])

  const selected = useMemo<Lesson | undefined>(() => course?.lessons.find(lesson => lesson.id === selectedId), [course, selectedId])
  const hasSelectedVideo = Boolean(selected?.hasVideo || selected?.videoUrl)
  const adminPreview = Boolean(course?.hasAdminAccess && !course?.isEnrolled)

  useEffect(() => {
    lastReportedSeconds.current = 0
    progressRequestInFlight.current = false
  }, [selected?.id])

  useEffect(() => {
    let active = true
    setVideoUrl("")
    setVideoError("")
    if (!selected || selected.isLocked || !hasSelectedVideo) return () => { active = false }
    void lessonService.videoAccess(selected.id).then(access => {
      if (active) setVideoUrl(resolveMediaUrl(access.url))
    }).catch(requestError => {
      if (active) setVideoError(getErrorMessage(requestError))
    })
    return () => { active = false }
  }, [selected?.id, selected?.isLocked, hasSelectedVideo])

  useEffect(() => {
    let active = true
    setResourceUrls({})
    if (!selected || selected.isLocked || !selected.resources?.length) return () => { active = false }
    void Promise.all(selected.resources.map(async resource => ({ id: resource.id, url: resolveMediaUrl((await lessonService.resourceAccess(selected.id, resource.id)).url) }))).then(entries => {
      if (active) setResourceUrls(Object.fromEntries(entries.map(entry => [entry.id, entry.url])))
    }).catch(() => { if (active) setResourceUrls({}) })
    return () => { active = false }
  }, [selected?.id, selected?.isLocked])

  const selectedIndex = course?.lessons.findIndex(lesson => lesson.id === selectedId) ?? -1
  const previousLesson = selectedIndex > 0 ? course?.lessons[selectedIndex - 1] : undefined
  const nextLesson = selectedIndex >= 0 && course ? course.lessons[selectedIndex + 1] : undefined
  const tracks = course?.tracks ?? []
  const toggleTrack = (trackId: string) => setExpandedTrackIds(current => current.includes(trackId) ? current.filter(id => id !== trackId) : [...current, trackId])

  const reportVideoProgress = async (video: HTMLVideoElement, force = false) => {
    if (!course || !selected || adminPreview || selected.isCompleted || selected.isLocked || selected.videoDurationSeconds <= 0 || progressRequestInFlight.current) return
    const watchedSeconds = Math.max(0, Math.floor(video.currentTime))
    if (!force && watchedSeconds - lastReportedSeconds.current < PROGRESS_REPORT_INTERVAL_SECONDS) return

    progressRequestInFlight.current = true
    try {
      const update = await enrollmentService.progress(course.id, selected.id, watchedSeconds)
      lastReportedSeconds.current = update.watchDurationSeconds
      if (update.isCompleted && !selected.isCompleted) {
        await refreshCourse(update.nextLessonId ?? selected.id)
      }
    } catch (requestError) {
      setVideoError(getErrorMessage(requestError))
    } finally {
      progressRequestInFlight.current = false
    }
  }

  const completeTextLesson = async () => {
    if (!course || !selected || adminPreview || selected.isLocked || selected.isCompleted) return
    setBusy(true)
    try {
      const update = await enrollmentService.progress(course.id, selected.id, 0)
      await refreshCourse(update.nextLessonId ?? selected.id)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  if (error) return <section className="empty"><h1>{text("Learning unavailable", "التعلم غير متاح")}</h1><p role="alert">{error}</p><Link to="/courses">{text("Explore courses", "استكشف الدورات")}</Link></section>
  if (!course || !selected) return <section className="empty" aria-live="polite"><p>{text("Loading your course…", "جار تحميل دورتك…")}</p></section>

  const lessonStatus = (lesson: Lesson) => adminPreview
    ? ""
    : lesson.isCompleted
      ? text("✓ Completed", "✓ مكتمل")
      : lesson.isLocked
        ? text("🔒 Locked", "🔒 مقفل")
        : lesson.isCurrent
          ? text("▶ Current lesson", "▶ الدرس الحالي")
          : ""

  return <section className="learn">
    <header className="learn-header"><Link to={"/courses/" + course.slug}>{language === "ar" ? "→ نظرة عامة على الدورة" : "← Course overview"}</Link><h1>{course.title}</h1>{adminPreview ? <span className="admin-access-note">{text("Admin preview · read only", "معاينة المدير · قراءة فقط")}</span> : <span>{Math.round(course.progressPercent ?? 0)}% {text("complete", "مكتمل")}</span>}</header>
    {!adminPreview && course.accessType === "Sequential" && <p className="learning-access-note" role="status">{text("Sequential access: complete the current lesson to unlock the next one.", "وصول متسلسل: أكمل الدرس الحالي لفتح الدرس التالي.")}</p>}
    <div className="learn-grid">
      <main className="lesson-view">
        <div className="video-frame">{hasSelectedVideo ? videoUrl ? <video controls controlsList="nodownload noremoteplayback" preload="metadata" src={videoUrl} onTimeUpdate={event => { void reportVideoProgress(event.currentTarget) }} onEnded={event => { void reportVideoProgress(event.currentTarget, true) }}>{text("Your browser does not support video playback.", "متصفحك لا يدعم تشغيل الفيديو.")}</video> : <p>{videoError || text("Preparing secure video playback…", "جارٍ تجهيز الفيديو الآمن…")}</p> : <p>{text("Video is not available for this lesson.", "الفيديو غير متاح لهذا الدرس.")}</p>}</div>
        <h2>{selected.title}</h2>
        {!adminPreview && hasSelectedVideo && !selected.isCompleted && <p className="lesson-progress-hint">{selected.videoDurationSeconds > 0 ? text("Your progress is saved while you watch. Watch enough of the video to complete this lesson.", "يتم حفظ تقدمك أثناء المشاهدة. شاهد قدرًا كافيًا من الفيديو لإكمال هذا الدرس.") : text("This video needs a configured duration before it can unlock the next lesson.", "يحتاج هذا الفيديو إلى مدة مهيأة قبل أن يتمكن من فتح الدرس التالي.")}</p>}
        {selected.contentText && <p>{selected.contentText}</p>}
        {selected.resources?.length ? <section className="lesson-resources"><h3>{text("Lesson resources", "موارد الدرس")}</h3><ul>{selected.resources.map(resource => <li key={resource.id}>{resourceUrls[resource.id] ? <a href={resourceUrls[resource.id]} target="_blank" rel="noopener noreferrer">{resource.title} <span>{resource.fileType}</span></a> : <span>{resource.title} <span>{resource.fileType}</span></span>}</li>)}</ul></section> : null}
        <LessonComments lessonId={selected.id} />
        <div className="lesson-actions"><button type="button" className="secondary-button" onClick={() => previousLesson && !previousLesson.isLocked && setSelectedId(previousLesson.id)} disabled={!previousLesson || previousLesson.isLocked || busy}>{language === "ar" ? "الدرس السابق →" : "← Previous lesson"}</button>{!adminPreview && !hasSelectedVideo && <button type="button" onClick={completeTextLesson} disabled={busy || selected.isCompleted}>{selected.isCompleted ? text("Completed", "مكتمل") : busy ? text("Saving…", "جار الحفظ…") : text("Mark as complete", "تحديد كمكتمل")}</button>}<button type="button" className="secondary-button" onClick={() => nextLesson && !nextLesson.isLocked && setSelectedId(nextLesson.id)} disabled={!nextLesson || nextLesson.isLocked || busy}>{language === "ar" ? "← الدرس التالي" : "Next lesson →"}</button></div>
      </main>
      <aside><h2>{text("Course lessons", "دروس الدورة")}</h2>{tracks.map(track => { const expanded = expandedTrackIds.includes(track.id); return <section className="learning-track" key={track.id}><button type="button" className="learning-track-toggle" onClick={() => toggleTrack(track.id)} aria-expanded={expanded}><span><strong>{track.orderIndex}. {track.title}</strong><small>{track.lessons.length} {text("lessons", "دروس")}</small></span><span aria-hidden="true">{expanded ? "−" : "+"}</span></button>{expanded && <ol>{track.lessons.map(lesson => <li key={lesson.id}><button type="button" className={(lesson.id === selected.id ? "selected-lesson " : "") + (lesson.isLocked ? "locked-lesson" : "")} onClick={() => !lesson.isLocked && setSelectedId(lesson.id)} disabled={lesson.isLocked} aria-current={lesson.id === selected.id ? "step" : undefined}>{lesson.orderIndex}. {lesson.title}<small>{lessonStatus(lesson)}</small></button></li>)}</ol>}</section> })}</aside>
    </div>
  </section>
}
