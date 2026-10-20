import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { adminDashboardService } from '../api/services'
import type { AdminDashboard } from '../types/api'

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [error, setError] = useState('')
  const load = () => { setError(''); setData(null); adminDashboardService.summary().then(setData).catch(error => setError(getErrorMessage(error))) }
  useEffect(load, [])
  if (error) return <section className="empty"><h1>Admin dashboard</h1><p role="alert">{error}</p><button onClick={load}>Try again</button></section>
  if (!data) return <section className="empty" aria-live="polite"><p>Loading dashboard…</p></section>
  return <section className="dashboard"><div className="admin-heading"><div><p className="eyebrow">Administration</p><h1>Dashboard</h1><p>Current activity from persisted course, student, and enrollment records.</p></div><div className="button-row"><Link className="button" to="/admin/courses/new">Create course</Link><Link className="secondary-button button" to="/admin/categories">Manage categories</Link></div></div><div className="progress-summary"><div><span>Total courses</span><strong>{data.totalCourses}</strong></div><div><span>Published courses</span><strong>{data.publishedCourses}</strong></div><div><span>Draft courses</span><strong>{data.draftCourses}</strong></div><div><span>Students</span><strong>{data.totalStudents}</strong></div><div><span>Total enrollments</span><strong>{data.totalEnrollments}</strong></div><div><span>Active enrollments</span><strong>{data.activeEnrollments}</strong></div></div><section className="admin-section"><div className="admin-heading"><h2>Recent courses</h2><Link to="/admin/courses">Manage all courses</Link></div>{data.recentCourses.length === 0 ? <div className="empty compact"><p>Create your first course to see it here.</p></div> : <div className="admin-table-wrap"><table><thead><tr><th>Course</th><th>Status</th><th>Students</th><th /></tr></thead><tbody>{data.recentCourses.map(course => <tr key={course.id}><td>{course.title}</td><td><span className={`status status-${course.status}`}>{course.status}</span></td><td>{course.totalStudents}</td><td><Link to={`/admin/courses/${course.id}`}>Manage</Link></td></tr>)}</tbody></table></div>}</section></section>
}
