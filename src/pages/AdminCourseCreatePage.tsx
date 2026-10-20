import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { courseService } from '../api/services'
import { CourseForm, courseFormData, type CourseFormValues } from '../components/CourseForm'
export function AdminCourseCreatePage() { const navigate = useNavigate(); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const save = async (values: CourseFormValues) => { setBusy(true); setError(''); try { const course = await courseService.create(courseFormData(values, true)); navigate(`/admin/courses/${course.id}`, { state: { notice: 'Course created as a draft. Add at least one lesson before publishing.' } }) } catch (err) { setError(getErrorMessage(err)) } finally { setBusy(false) } }; return <section className="admin-page"><div className="page-heading"><p className="eyebrow">Admin</p><h1>Create a course</h1><p>New courses start as drafts and are never visible to students until published.</p></div>{error && <p className="form-error" role="alert">{error}</p>}<CourseForm busy={busy} submitLabel="Create draft" onSubmit={save} /></section> }
