import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { getErrorMessage, isPaymobPhoneRequiredError } from "../api/client"
import { courseAccessCodeService, courseService, enrollmentService } from "../api/services"
import { useAuth } from "../context/AuthContext"
import type { CourseAccessType, CourseDetail, PaymentRequiredEnrollment, Track } from "../types/api"
import { PaymentCheckoutDialog } from "../components/PaymentCheckoutDialog"
import { BillingPhoneDialog } from "../components/BillingPhoneDialog"
import { CourseReviews } from "../components/CourseReviews"
import { useLanguage } from "../context/LanguageContext"

const paymentReturnKey = (courseId: string) => "edu:payment-return:" + courseId
const priceLabel = (price: number, language: "en" | "ar") => price === 0 ? (language === "ar" ? "مجاني" : "Free") : "$" + price.toFixed(2)

export function CourseDetailPage() {
  const { slug = "" } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const enrollmentRequestInFlight = useRef(false)
  const [notice, setNotice] = useState("")
  const [pendingPayment, setPendingPayment] = useState<PaymentRequiredEnrollment | null>(null)
  const [billingPhoneRequired, setBillingPhoneRequired] = useState(false)
  const [expandedTrackIds, setExpandedTrackIds] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState<CourseAccessType>("Sequential")
  const [accessCode, setAccessCode] = useState("")
  const [redeemingCode, setRedeemingCode] = useState(false)
  const text = (english: string, arabic: string) => language === "ar" ? arabic : english
  const copy = language === "ar"
    ? { paymentFinalizing: "تم تأكيد الدفع. جارٍ إكمال التسجيل…", paymentSuccess: "تم الدفع بنجاح. يمكنك الآن الوصول إلى هذه الدورة.", paymentCancelled: "تم إلغاء الدفع. لم يتغير تسجيلك.", paymentStillPending: "لا يزال الدفع قيد المعالجة. لن يتم فتح الدورة قبل تأكيد الدفع.", missingMockReference: "تعذر العثور على مرجع الدفع التجريبي." }
    : { paymentFinalizing: "Payment confirmed. Finalizing enrollment…", paymentSuccess: "Payment successful. You now have access to this course.", paymentCancelled: "Payment cancelled. Your enrollment was not changed.", paymentStillPending: "Your payment is still processing. Course access is available only after payment is confirmed.", missingMockReference: "The development payment reference is missing." }

  useEffect(() => {
    let active = true
    courseService.detail(slug).then(data => {
      if (!active) return
      setCourse(data)
      setExpandedTrackIds(data.tracks?.length ? data.tracks.map(track => track.id) : data.lessons.length ? ["legacy-track"] : [])
    }).catch(requestError => { if (active) setError(getErrorMessage(requestError)) })
    return () => { active = false }
  }, [slug])

  const requestEnrollment = async (phoneNumber?: string) => {
    if (!course) return
    if (enrollmentRequestInFlight.current) return
    enrollmentRequestInFlight.current = true
    setBusy(true)
    setNotice("")
    try {
      const response = await enrollmentService.enroll(course.id, { phoneNumber, accessType: selectedPlan })
      if (response.requiresPayment) {
        setBillingPhoneRequired(false)
        setPendingPayment(response)
      } else {
        setBillingPhoneRequired(false)
        setNotice(response.message)
        setCourse({ ...course, isEnrolled: true, progressPercent: 0, accessType: response.accessType ?? selectedPlan })
      }
    } finally {
      enrollmentRequestInFlight.current = false
      setBusy(false)
    }
  }

  const enroll = async () => {
    if (!user) {
      navigate("/login", { state: { from: "/courses/" + slug } })
      return
    }
    try { await requestEnrollment() } catch (requestError) {
      if (isPaymobPhoneRequiredError(requestError)) {
        setBillingPhoneRequired(true)
        return
      }
      setNotice(getErrorMessage(requestError))
    }
  }

  const redeemAccessCode = async () => {
    if (!course) return
    if (!user) { navigate("/login", { state: { from: "/courses/" + slug } }); return }
    if (!accessCode.trim()) { setNotice(text("Enter your access code.", "أدخل رمز الوصول.")); return }
    setRedeemingCode(true); setNotice("")
    try {
      const result = await courseAccessCodeService.redeem(course.id, accessCode)
      setCourse({ ...course, isEnrolled: true, progressPercent: 0, accessType: result.accessType })
      setAccessCode(""); setNotice(result.message)
    } catch (requestError) { setNotice(getErrorMessage(requestError)) } finally { setRedeemingCode(false) }
  }
  const retryEnrollmentWithPhone = async (phoneNumber: string) => {
    try { await requestEnrollment(phoneNumber) } catch (requestError) { throw new Error(getErrorMessage(requestError)) }
  }

  const confirmEnrollment = async (courseId: string) => {
    setNotice(copy.paymentFinalizing)
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const enrollment = await enrollmentService.mine(courseId)
        setCourse(current => current?.id === courseId ? { ...current, isEnrolled: true, progressPercent: enrollment.progressPercent, accessType: enrollment.accessType } : current)
        setPendingPayment(null)
        setNotice(copy.paymentSuccess)
        return
      } catch (requestError) {
        if (attempt === 9) throw requestError
        await new Promise(resolve => window.setTimeout(resolve, 1500))
      }
    }
  }

  useEffect(() => {
    if (!course || !user) return
    const params = new URLSearchParams(window.location.search)
    const status = (params.get("payment") ?? params.get("paymentStatus") ?? "").toLowerCase()
    const returnKey = paymentReturnKey(course.id)
    const returnedFromPayment = window.sessionStorage.getItem(returnKey)
    if (status === "cancelled" || status === "canceled" || status === "failed") {
      window.sessionStorage.removeItem(returnKey)
      setNotice(copy.paymentCancelled)
      return
    }
    if (!returnedFromPayment && !status) return
    let active = true
    void confirmEnrollment(course.id).then(() => { if (active) window.sessionStorage.removeItem(returnKey) }).catch(() => { if (active) setNotice(copy.paymentStillPending) })
    return () => { active = false }
  }, [course?.id, user?.userId, language])

  const completeMockPayment = async () => {
    if (!pendingPayment?.paymentReference || !course) throw new Error(copy.missingMockReference)
    setBusy(true)
    try {
      const result = await enrollmentService.completeMockPayment(pendingPayment.paymentReference)
      if (result.requiresPayment) throw new Error(copy.paymentStillPending)
      setPendingPayment(null)
      setCourse({ ...course, isEnrolled: true, progressPercent: 0, accessType: result.accessType ?? selectedPlan })
      setNotice(result.message)
    } finally { setBusy(false) }
  }

  if (error) return <section className="empty"><h1>{text("Course unavailable", "الدورة غير متاحة")}</h1><p role="alert">{error}</p><Link to="/courses">{text("Back to courses", "العودة إلى الدورات")}</Link></section>
  if (!course) return <section className="empty" aria-live="polite"><p>{text("Loading course…", "جار تحميل الدورة…")}</p></section>

  const tracks: Track[] = course.tracks?.length
    ? [...course.tracks].sort((left, right) => left.orderIndex - right.orderIndex)
    : course.lessons.length
      ? [{ id: "legacy-track", courseId: course.id, title: text("General", "عام"), description: undefined, orderIndex: 1, createdAt: "", lessons: course.lessons, lessonCount: course.lessons.length }]
      : []
  const hasLearningAccess = course.isEnrolled || course.hasAdminAccess
  const isAdminPreview = Boolean(course.hasAdminAccess && !course.isEnrolled)
  const selectedPrice = selectedPlan === "Full" ? course.fullAccessPrice : course.basicPrice
  const courseCategories = course.categories?.length ? course.categories : course.category ? [course.category] : []
  const enrollmentAction = hasLearningAccess
    ? <><Link className="button" to={"/learn/" + course.slug}>{isAdminPreview ? text("Open admin preview", "فتح معاينة المدير") : text("Continue learning", "متابعة التعلّم")}</Link>{isAdminPreview && <p className="admin-access-note">{text("You have read-only administrative access. No enrollment or payment is created.", "لديك وصول إداري للقراءة فقط. لا يتم إنشاء تسجيل أو دفعة.")}</p>}</>
    : <button type="button" onClick={enroll} disabled={busy}>{busy ? text("Processing…", "جار المعالجة…") : selectedPrice === 0 ? text("Enroll for free", "سجل مجاناً") : text("Buy selected plan", "اشترِ الخطة المحددة")}</button>
  const toggleTrack = (trackId: string) => setExpandedTrackIds(current => current.includes(trackId) ? current.filter(id => id !== trackId) : [...current, trackId])

  return <article className="course-detail">
    <section className="course-hero"><div><p className="eyebrow">{courseCategories.map(category => category.name).join(" · ") || course.level}</p><h1>{course.title}</h1>{course.shortDescription && <p className="course-short-description">{course.shortDescription}</p>}<p>{course.description}</p>{courseCategories.length > 0 && <div className="tags course-categories" aria-label={text("Course categories", "تصنيفات الدورة")}>{courseCategories.map(category => <span key={category.id}>{category.name}</span>)}</div>}<div className="tags">{course.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>{course.thumbnailUrl && <img src={course.thumbnailUrl} alt="" />}</section>
    {course.trailerUrl && <section className="course-trailer"><h2>{text("Course trailer", "مقدمة الدورة")}</h2><video controls preload="metadata" src={course.trailerUrl}>{text("Your browser does not support video playback.", "متصفحك لا يدعم تشغيل الفيديو.")}</video></section>}
    <section className="enroll-panel">
      {hasLearningAccess ? <><strong>{course.accessType === "Sequential" ? text("Sequential access", "وصول متسلسل") : text("Full access", "وصول كامل")}</strong><p>{course.totalLessons} {text("lessons", "دروس")} · {course.totalHours} {text("hours", "ساعات")} · ★ {course.averageRating.toFixed(1)}</p></> : <div className="access-plan-picker" role="radiogroup" aria-label={text("Choose course access", "اختر مستوى الوصول للدورة")}>
        <label className={selectedPlan === "Sequential" ? "access-plan-option selected" : "access-plan-option"}><input type="radio" name="access-plan" value="Sequential" checked={selectedPlan === "Sequential"} onChange={() => setSelectedPlan("Sequential")} disabled={busy} /><span><strong>{text("Basic / Sequential", "أساسي / متسلسل")}</strong><small>{text("Complete each lesson to unlock the next.", "أكمل كل درس لفتح الدرس التالي.")}</small></span><b>{priceLabel(course.basicPrice, language)}</b></label>
        <label className={selectedPlan === "Full" ? "access-plan-option selected" : "access-plan-option"}><input type="radio" name="access-plan" value="Full" checked={selectedPlan === "Full"} onChange={() => setSelectedPlan("Full")} disabled={busy} /><span><strong>{text("Full access", "وصول كامل")}</strong><small>{text("Open every lesson immediately.", "افتح جميع الدروس فوراً.")}</small></span><b>{priceLabel(course.fullAccessPrice, language)}</b></label>
      </div>}
      {enrollmentAction}{notice && <p role="status">{notice}</p>}
    </section>
    {!hasLearningAccess && <section className="access-code-redeem" aria-labelledby="access-code-heading">
      <h2 id="access-code-heading">{text("Have an access code?", "لديك رمز وصول؟")}</h2>
      <p>{text("Redeem it to enroll with Sequential access. No payment is created.", "استبدله للتسجيل بوصول متسلسل. لن يتم إنشاء أي عملية دفع.")}</p>
      <div className="access-code-redeem__form"><label>{text("Course access code", "رمز وصول الدورة")}<input value={accessCode} onChange={event => setAccessCode(event.target.value)} autoComplete="off" disabled={redeemingCode || busy} /></label><button type="button" className="secondary-button" onClick={() => void redeemAccessCode()} disabled={redeemingCode || busy}>{redeemingCode ? text("Redeeming…", "جار الاستبدال…") : text("Redeem code", "استبدال الرمز")}</button></div>
    </section>}    <section className="course-tracks"><h2>{text("Course content", "محتوى الدورة")}</h2>{tracks.length === 0 ? <p>{text("No lessons are available yet.", "لا توجد دروس متاحة بعد.")}</p> : <div className="course-track-list">{tracks.map(track => { const expanded = expandedTrackIds.includes(track.id); const trackLessons = [...track.lessons].sort((left, right) => left.orderIndex - right.orderIndex); return <section className="course-track" key={track.id}><button type="button" className="course-track-toggle" onClick={() => toggleTrack(track.id)} aria-expanded={expanded}><span><strong>{track.orderIndex}. {track.title}</strong><small>{trackLessons.length} {text("lessons", "دروس")}</small></span><span aria-hidden="true">{expanded ? "−" : "+"}</span></button>{track.description && <p className="track-description">{track.description}</p>}{expanded && (trackLessons.length === 0 ? <p className="track-empty">{text("No lessons in this track yet.", "لا توجد دروس في هذا المسار بعد.")}</p> : <ol className="lesson-list">{trackLessons.map(lesson => <li key={lesson.id}><span>{lesson.orderIndex}. {lesson.title}</span><span>{lesson.isCompleted ? text("✓ Completed", "✓ مكتمل") : lesson.isLocked ? text("🔒 Locked", "🔒 مقفل") : lesson.isCurrent ? text("▶ Current lesson", "▶ الدرس الحالي") : ""} {lesson.isPreview ? text("· Preview", "· معاينة") : ""}</span></li>)}</ol>)}</section> })}</div>}</section>
    <CourseReviews courseId={course.id} canReview={course.isEnrolled && Boolean(user)} />
    {pendingPayment && <PaymentCheckoutDialog payment={pendingPayment} language={language} onClose={() => { setPendingPayment(null); setNotice(copy.paymentCancelled) }} onCompleteMockPayment={completeMockPayment} onHostedCheckoutRedirect={() => { window.sessionStorage.setItem(paymentReturnKey(course.id), pendingPayment.paymentReference ?? "pending") }} />}
    {billingPhoneRequired && <BillingPhoneDialog language={language} onClose={() => setBillingPhoneRequired(false)} onSubmit={retryEnrollmentWithPhone} />}
  </article>
}
