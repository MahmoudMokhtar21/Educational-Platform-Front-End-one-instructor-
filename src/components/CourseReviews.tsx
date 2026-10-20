import { FormEvent, useEffect, useState } from 'react'
import { getErrorMessage } from '../api/client'
import { reviewService } from '../api/services'
import { useLanguage } from '../context/LanguageContext'
import type { Review } from '../types/api'
import { StarRatingDisplay, StarRatingInput } from './StarRating'

export function CourseReviews({ courseId, canReview }: { courseId: string; canReview: boolean }) {
  const { language } = useLanguage()
  const text = (english: string, arabic: string) => language === 'ar' ? arabic : english
  const [reviews, setReviews] = useState<Review[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    setReviews(null)
    setLoadError('')
    reviewService.list(courseId)
      .then((data) => { if (active) setReviews(data) })
      .catch((error) => { if (active) setLoadError(getErrorMessage(error)) })

    return () => { active = false }
  }, [courseId])

  const formatDate = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en', { dateStyle: 'medium' }).format(date)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!comment.trim()) {
      setSubmitError(text('Please add a comment before submitting your review.', 'أضف تعليقًا قبل إرسال المراجعة.'))
      return
    }

    setBusy(true)
    setSubmitError('')
    try {
      // The API continues to receive the existing numeric 1–5 rating.
      const created = await reviewService.create(courseId, rating, comment.trim())
      setReviews((current) => current ? [created, ...current] : [created])
      setComment('')
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const ratingLabel = (value: number) => text(`${value} out of 5 stars`, `${value} من 5 نجوم`)

  return <section className="course-reviews" aria-labelledby="course-reviews-title">
    <header className="course-reviews__heading">
      <div>
        <p className="eyebrow">{text('Learner feedback', 'آراء الدارسين')}</p>
        <h2 id="course-reviews-title">{text('Student reviews', 'مراجعات الدارسين')}</h2>
      </div>
      {reviews && <span className="course-reviews__count">{text(`${reviews.length} review${reviews.length === 1 ? '' : 's'}`, `${reviews.length} مراجعة`)}</span>}
    </header>

    {loadError && <p className="field-note" role="alert">{text('Reviews are unavailable right now.', 'المراجعات غير متاحة حاليًا.')}</p>}
    {!loadError && !reviews && <p className="field-note" aria-live="polite">{text('Loading reviews…', 'جارٍ تحميل المراجعات…')}</p>}

    {!canReview && !loadError && <p className="course-reviews__access-note">{text('Sign in and enroll in this course to leave a review and join the lesson discussion.', 'سجّل الدخول واشترك في هذه الدورة لإضافة مراجعة والمشاركة في نقاشات الدروس.')}</p>}

    {canReview && !loadError && <form className="course-review-form" onSubmit={submit} noValidate>
      <div>
        <h3>{text('Leave a review', 'اكتب مراجعتك')}</h3>
        <p>{text('Share your course experience with other learners.', 'شارك تجربتك في الدورة مع الدارسين الآخرين.')}</p>
      </div>
      <StarRatingInput
        label={text('Your rating', 'تقييمك')}
        name="course-review-rating"
        onChange={setRating}
        starLabel={(value) => text(`Rate ${value} out of 5 stars`, `قيّم ${value} من 5 نجوم`)}
        value={rating}
      />
      <label className="course-review-form__comment">
        <span>{text('Your comment', 'تعليقك')}</span>
        <textarea
          aria-describedby="course-review-character-count"
          disabled={busy}
          maxLength={1000}
          onChange={(event) => setComment(event.target.value)}
          placeholder={text('What did you find most useful?', 'ما أكثر شيء وجدته مفيدًا؟')}
          required
          rows={5}
          value={comment}
        />
      </label>
      <div className="course-review-form__footer">
        <small id="course-review-character-count">{text(`${comment.length}/1000 characters`, `${comment.length}/1000 حرفًا`)}</small>
        <button disabled={busy} type="submit">{busy ? text('Submitting…', 'جارٍ الإرسال…') : text('Submit review', 'إرسال المراجعة')}</button>
      </div>
      {submitError && <p className="form-error" role="alert">{submitError}</p>}
    </form>}

    {!loadError && reviews && (reviews.length === 0
      ? <p className="course-reviews__empty">{text('No reviews yet.', 'لا توجد مراجعات حتى الآن.')}</p>
      : <div className="course-review-list">
        {reviews.map((review) => <article className="course-review-card" key={review.id}>
          <div className="course-review-card__meta">
            <StarRatingDisplay label={ratingLabel(review.rating)} value={review.rating} />
            <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
          </div>
          <p className="course-review-card__comment">{review.comment}</p>
        </article>)}
      </div>)}
  </section>
}
