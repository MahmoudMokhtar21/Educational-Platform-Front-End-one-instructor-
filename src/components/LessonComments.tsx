import { FormEvent, useEffect, useState } from 'react'
import { getErrorMessage } from '../api/client'
import { lessonCommentService } from '../api/services'
import { useLanguage } from '../context/LanguageContext'
import type { LessonComment } from '../types/api'

const maximumCommentLength = 2000

function initialsFor(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map(word => word[0]).join('').toLocaleUpperCase() || '•'
}

function CommentAvatar({ comment }: { comment: LessonComment }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(comment.authorProfilePictureUrl) && !imageFailed

  return <span className="lesson-comment__avatar" aria-hidden={showImage ? undefined : 'true'}>
    {showImage
      ? <img alt={comment.authorName} onError={() => setImageFailed(true)} src={comment.authorProfilePictureUrl} />
      : <span>{initialsFor(comment.authorName)}</span>}
  </span>
}

export function LessonComments({ lessonId }: { lessonId: string }) {
  const { language } = useLanguage()
  const text = (english: string, arabic: string) => language === 'ar' ? arabic : english
  const [comments, setComments] = useState<LessonComment[] | null>(null)
  const [content, setContent] = useState('')
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setComments(null)
    setLoadError('')
    setSubmitError('')
    setSuccess('')
    setContent('')

    lessonCommentService.list(lessonId)
      .then(data => { if (active) setComments(data) })
      .catch(error => { if (active) setLoadError(getErrorMessage(error)) })

    return () => { active = false }
  }, [lessonId])

  const formatDate = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(date)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = content.trim()
    if (!normalized) {
      setSubmitError(text('Write a comment before sending it.', 'اكتب تعليقًا قبل إرساله.'))
      return
    }
    if (normalized.length > maximumCommentLength) {
      setSubmitError(text('A comment can contain up to ' + maximumCommentLength + ' characters.', 'يمكن أن يحتوي التعليق على ' + maximumCommentLength + ' حرفًا كحد أقصى.'))
      return
    }

    setSubmitting(true)
    setSubmitError('')
    setSuccess('')
    try {
      const created = await lessonCommentService.create(lessonId, normalized)
      setComments(current => current ? [created, ...current] : [created])
      setContent('')
      setSuccess(text('Your comment was published.', 'تم نشر تعليقك.'))
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const inputId = 'lesson-comment-' + lessonId
  const countId = 'lesson-comment-count-' + lessonId

  return <section className="lesson-comments" aria-labelledby="lesson-comments-title">
    <header className="lesson-comments__heading">
      <div>
        <p className="eyebrow">{text('Lesson discussion', 'نقاش الدرس')}</p>
        <h3 id="lesson-comments-title">{text('Comments', 'التعليقات')}</h3>
      </div>
      {comments && <span className="lesson-comments__count">{text(comments.length + ' comment' + (comments.length === 1 ? '' : 's'), comments.length + ' تعليقًا')}</span>}
    </header>

    <form className="lesson-comment-form" onSubmit={submit} noValidate>
      <label htmlFor={inputId}>
        <span>{text('Add a comment', 'أضف تعليقًا')}</span>
        <textarea
          aria-describedby={countId}
          disabled={submitting}
          id={inputId}
          maxLength={maximumCommentLength}
          onChange={event => {
            setContent(event.target.value)
            if (submitError) setSubmitError('')
            if (success) setSuccess('')
          }}
          placeholder={text('Share a question or a useful takeaway…', 'شارك سؤالًا أو فكرة مفيدة…')}
          required
          rows={4}
          value={content}
        />
      </label>
      <div className="lesson-comment-form__footer">
        <small id={countId}>{text(content.length + '/' + maximumCommentLength + ' characters', content.length + '/' + maximumCommentLength + ' حرفًا')}</small>
        <button disabled={submitting} type="submit">{submitting ? text('Publishing…', 'جارٍ النشر…') : text('Post comment', 'نشر التعليق')}</button>
      </div>
      {submitError && <p className="form-error" role="alert">{submitError}</p>}
      {success && <p className="notice" role="status">{success}</p>}
    </form>

    {loadError && <p className="field-note" role="alert">{text('Comments could not be loaded right now.', 'تعذر تحميل التعليقات حاليًا.')}</p>}
    {!loadError && !comments && <p className="field-note" aria-live="polite">{text('Loading comments…', 'جارٍ تحميل التعليقات…')}</p>}
    {!loadError && comments && (comments.length === 0
      ? <p className="lesson-comments__empty">{text('Be the first to start this lesson discussion.', 'كن أول من يبدأ النقاش حول هذا الدرس.')}</p>
      : <div className="lesson-comment-list">
        {comments.map(comment => <article className="lesson-comment" key={comment.id}>
          <CommentAvatar comment={comment} />
          <div className="lesson-comment__body">
            <header>
              <strong>{comment.authorName}</strong>
              <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
            </header>
            <p>{comment.content}</p>
          </div>
        </article>)}
      </div>)}
  </section>
}
