import { FormEvent, useEffect, useState } from 'react'
import { getErrorMessage } from '../api/client'
import { studentReviewService } from '../api/services'
import { StarRatingDisplay, StarRatingInput } from '../components/StarRating'
import { useLanguage } from '../context/LanguageContext'
import type { StudentReview } from '../types/api'

type Draft = {
  name: string
  initials: string
  rating: number
  reviewText: string
}

const emptyDraft = (): Draft => ({ name: '', initials: '', rating: 5, reviewText: '' })

export function AdminStudentReviewsPage() {
  const { language } = useLanguage()
  const text = (english: string, arabic: string) => language === 'ar' ? arabic : english
  const [items, setItems] = useState<StudentReview[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setItems(await studentReviewService.list())
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const reset = () => {
    setEditing(null)
    setDraft(emptyDraft())
  }

  const startEditing = (review: StudentReview) => {
    setEditing(review.id)
    setDraft({
      name: review.name,
      initials: review.initials,
      rating: review.rating,
      reviewText: review.reviewText,
    })
    setError('')
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.initials.trim() || !draft.reviewText.trim() || draft.rating < 1 || draft.rating > 5) {
      setError(text('Complete all fields and choose a rating from 1 to 5.', 'أكمل جميع الحقول واختر تقييمًا من 1 إلى 5.'))
      return
    }

    try {
      if (editing) {
        await studentReviewService.update(editing, draft)
      } else {
        await studentReviewService.create(draft)
      }
      setError('')
      reset()
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const remove = async (review: StudentReview) => {
    if (!window.confirm(text(`Delete “${review.name}”?`, `حذف «${review.name}»؟`))) return

    try {
      await studentReviewService.remove(review.id)
      if (editing === review.id) reset()
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const ratingLabel = (value: number) => text(`${value} out of 5 stars`, `${value} من 5 نجوم`)

  return <section className="admin-page">
    <div className="page-heading">
      <p className="eyebrow">{text('Student reviews', 'آراء الدارسين')}</p>
      <h1>{text('Manage student reviews', 'إدارة آراء الدارسين')}</h1>
    </div>

    {error && <p className="form-error" role="alert">{error}</p>}

    <form className="admin-form student-review-admin-form" onSubmit={save} noValidate>
      <div className="form-grid">
        <label>
          {text('Name', 'الاسم')}
          <input
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            required
            value={draft.name}
          />
        </label>
        <label>
          {text('Initials', 'الأحرف المختصرة')}
          <input
            maxLength={8}
            onChange={(event) => setDraft((current) => ({ ...current, initials: event.target.value }))}
            required
            value={draft.initials}
          />
        </label>
        <StarRatingInput
          label={text('Rating', 'التقييم')}
          name="student-review-rating"
          onChange={(rating) => setDraft((current) => ({ ...current, rating }))}
          starLabel={(value) => text(`Rate ${value} out of 5 stars`, `قيّم ${value} من 5 نجوم`)}
          value={draft.rating}
        />
        <label className="wide">
          {text('Review text', 'نص المراجعة')}
          <textarea
            maxLength={1500}
            onChange={(event) => setDraft((current) => ({ ...current, reviewText: event.target.value }))}
            required
            rows={5}
            value={draft.reviewText}
          />
        </label>
      </div>
      <div className="button-row">
        <button type="submit">{editing ? text('Save review', 'حفظ المراجعة') : text('Add review', 'إضافة مراجعة')}</button>
        {editing && <button type="button" className="secondary-button" onClick={reset}>{text('Cancel', 'إلغاء')}</button>}
      </div>
    </form>

    <div className="admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>{text('Name', 'الاسم')}</th>
            <th>{text('Rating', 'التقييم')}</th>
            <th>{text('Review', 'المراجعة')}</th>
            <th>{text('Actions', 'الإجراءات')}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && <tr>
            <td colSpan={4}>{text('No student reviews yet.', 'لا توجد آراء دارسين حتى الآن.')}</td>
          </tr>}
          {items.map((review) => <tr key={review.id}>
            <td>{review.name} ({review.initials})</td>
            <td><StarRatingDisplay label={ratingLabel(review.rating)} value={review.rating} /></td>
            <td className="review-table-copy">{review.reviewText}</td>
            <td>
              <div className="button-row">
                <button type="button" className="secondary-button" onClick={() => startEditing(review)}>{text('Edit', 'تعديل')}</button>
                <button type="button" className="danger-button" onClick={() => void remove(review)}>{text('Delete', 'حذف')}</button>
              </div>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>
}
