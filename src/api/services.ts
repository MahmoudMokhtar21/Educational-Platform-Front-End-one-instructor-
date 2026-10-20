import client, { logoutSession, refreshSession } from './client'
import type { AdminCourse, AdminCourseAccessCode, AdminDashboard, CourseAccessCodeRedemption, GeneratedCourseAccessCode, ArticleUpsert, Category, ConsultationRequestDetail, ConsultationRequestListItem, ConsultationRequestPayload, ConsultationRequestStatus, ConsultationRequestSubmission, ContentListItem, Course, CourseDetail, Enrollment, EnrollmentResult, LessonProgressUpdate, ExternalVideo, KnowledgeArticle, Lesson, LessonComment, LessonContentAccess, LoginRequest, LoginResponse, MyCourses, PagedResult, Profile, RegisterRequest, Review, SiteSettings, Sponsor, StudentReview, Track, VideoUpsert } from '../types/api'

export const authService = {
  login: (body: LoginRequest) => client.post<LoginResponse>('/Authentication/login', body).then(({ data }) => data),
  refresh: () => refreshSession(),
  logout: () => logoutSession(),
  register: (body: RegisterRequest) => client.post('/Authentication/register', body),
  resendVerification: (email: string) => client.post('/Authentication/resend-verification', JSON.stringify(email), { headers: { 'Content-Type': 'application/json' } }),
  forgotPassword: (email: string) => client.post('/Authentication/forgot-password', JSON.stringify(email), { headers: { 'Content-Type': 'application/json' } }),
  resetPassword: (token: string, newPassword: string) => client.post('/Authentication/reset-password', { token, newPassword }),
  verifyEmail: (token: string) => client.post('/Authentication/verify-email', JSON.stringify(token), { headers: { 'Content-Type': 'application/json' } })
}
export const accountService = {
  profile: () => client.get<Profile>('/Authentication/profile').then(({ data }) => data),
  updateProfile: (body: { firstName: string; lastName: string; bio?: string; profilePictureUrl?: string }) => client.put<Profile>('/Authentication/profile', body).then(({ data }) => data),
  uploadProfilePhoto: (file: File) => {
    const form = new FormData()
    form.append('File', file)
    return client.post<Profile>('/Authentication/profile/photo', form).then(({ data }) => data)
  },
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => client.post('/Authentication/change-password', { currentPassword, newPassword, confirmNewPassword })
}
type CourseListFilters = { search?: string; category?: string; level?: string; sort?: string }
export const courseService = { list: (page = 1, limit = 9, filters: CourseListFilters = {}) => client.get<PagedResult<Course>>('/Courses', { params: { page, limit, ...filters } }).then(({ data }) => data), detail: (slug: string) => client.get<CourseDetail>(`/Courses/${slug}`).then(({ data }) => data), adminList: (page = 1, limit = 20, filters: CourseListFilters = {}) => client.get<PagedResult<AdminCourse>>('/Courses/admin', { params: { page, limit, ...filters } }).then(({ data }) => data), adminDetail: (id: string) => client.get<AdminCourse>(`/Courses/admin/${id}`).then(({ data }) => data), create: (form: FormData) => client.post<AdminCourse>('/Courses', form).then(({ data }) => data), update: (id: string, form: FormData) => client.put(`/Courses/${id}`, form), remove: (id: string) => client.delete(`/Courses/${id}`), publish: (id: string) => client.post(`/Courses/${id}/publish`) }
export const categoryService = { list: () => client.get<Category[]>('/Categories').then(({ data }) => data), create: (body: { name: string; description?: string; imageUrl?: string }) => client.post<Category>('/Categories', body).then(({ data }) => data), update: (id: string, body: { name?: string; description?: string; imageUrl?: string; isActive?: boolean }) => client.put(`/Categories/${id}`, body), remove: (id: string) => client.delete(`/Categories/${id}`) }
export const sponsorService = { list: () => client.get<Sponsor[]>('/Sponsors').then(({ data }) => data), adminList: () => client.get<Sponsor[]>('/Sponsors/admin').then(({ data }) => data), create: (body: FormData) => client.post<Sponsor>('/Sponsors', body).then(({ data }) => data), update: (id: string, body: FormData) => client.put<Sponsor>(`/Sponsors/${id}`, body).then(({ data }) => data), remove: (id: string) => client.delete(`/Sponsors/${id}`) }
export const trackService = {
  list: (courseId: string) => client.get<Track[]>(`/courses/${courseId}/tracks`).then(({ data }) => data),
  create: (courseId: string, body: { title: string; description?: string }) => client.post<Track>(`/courses/${courseId}/tracks`, body).then(({ data }) => data),
  update: (courseId: string, trackId: string, body: { title?: string; description?: string }) => client.put(`/courses/${courseId}/tracks/${trackId}`, body),
  remove: (courseId: string, trackId: string, moveLessonsToTrackId?: string) => client.delete(`/courses/${courseId}/tracks/${trackId}`, { params: moveLessonsToTrackId ? { moveLessonsToTrackId } : undefined }),
  reorder: (courseId: string, tracks: { trackId: string; orderIndex: number }[]) => client.put(`/courses/${courseId}/tracks/reorder`, { tracks }),
  reorderLessons: (courseId: string, trackId: string, lessons: { lessonId: string; orderIndex: number }[]) => client.put(`/courses/${courseId}/tracks/${trackId}/lessons/reorder`, { lessons }),
  moveLesson: (courseId: string, lessonId: string, trackId: string) => client.put(`/courses/${courseId}/lessons/${lessonId}/track`, { trackId })
}
export const lessonService = { list: (courseId: string) => client.get<Lesson[]>(`/courses/${courseId}/lessons`).then(({ data }) => data), create: (courseId: string, form: FormData) => client.post<Lesson>(`/courses/${courseId}/lessons`, form, { timeout: 0 }).then(({ data }) => data), update: (id: string, form: FormData) => client.put(`/lessons/${id}`, form, { timeout: 0 }), remove: (id: string) => client.delete(`/lessons/${id}`), reorder: (courseId: string, lessons: { lessonId: string; orderIndex: number }[]) => client.put(`/courses/${courseId}/lessons/reorder`, { lessons }), updateResource: (lessonId: string, resourceId: string, form: FormData) => client.put(`/${lessonId}/resources/${resourceId}`, form), removeResource: (lessonId: string, resourceId: string) => client.delete(`/${lessonId}/resources/${resourceId}`), videoAccess: (lessonId: string) => client.get<LessonContentAccess>(`/lessons/${lessonId}/video-access`).then(({ data }) => data), resourceAccess: (lessonId: string, resourceId: string) => client.get<LessonContentAccess>(`/lessons/${lessonId}/resources/${resourceId}/access`).then(({ data }) => data) }
export const lessonCommentService = {
  list: (lessonId: string) => client.get<LessonComment[]>('/lessons/' + encodeURIComponent(lessonId) + '/comments').then(({ data }) => data),
  create: (lessonId: string, content: string) => client.post<LessonComment>('/lessons/' + encodeURIComponent(lessonId) + '/comments', { content }).then(({ data }) => data)
}
export const enrollmentService = {
  enroll: (courseId: string, body?: { phoneNumber?: string; accessType?: "Sequential" | "Full" }) => client.post<EnrollmentResult>(`/enrollments/courses/${courseId}`, body).then(({ data }) => data),
  /** Completes the server-issued development Mock checkout; no real transaction is created. */
  completeMockPayment: (paymentReference: string) => client.post<EnrollmentResult>(`/payments/mock/${encodeURIComponent(paymentReference)}/confirm`).then(({ data }) => data),
  mine: (courseId: string) => client.get<Enrollment>(`/enrollments/courses/${courseId}`).then(({ data }) => data),
  myCourses: () => client.get<MyCourses>('/enrollments/my-courses').then(({ data }) => data),
  progress: (courseId: string, lessonId: string, watchDurationSeconds: number) => client.post<LessonProgressUpdate>(`/enrollments/courses/${courseId}/lessons/${lessonId}/progress`, { watchDurationSeconds }).then(({ data }) => data)
}
export const courseAccessCodeService = {
  list: () => client.get<AdminCourseAccessCode[]>('/admin/course-access-codes').then(({ data }) => data),
  generate: (courseId: string) => client.post<GeneratedCourseAccessCode>('/admin/course-access-codes', { courseId }).then(({ data }) => data),
  revoke: (id: string) => client.post('/admin/course-access-codes/' + encodeURIComponent(id) + '/revoke'),
  redeem: (courseId: string, code: string) => client.post<CourseAccessCodeRedemption>('/enrollments/courses/' + encodeURIComponent(courseId) + '/redeem-code', { code }).then(({ data }) => data)
}
export const adminDashboardService = { summary: () => client.get<AdminDashboard>('/admin/dashboard').then(({ data }) => data) }
export const reviewService = { list: (courseId: string) => client.get<Review[]>(`/courses/${courseId}/reviews`).then(({ data }) => data), create: (courseId: string, rating: number, comment: string) => client.post<Review>(`/courses/${courseId}/reviews`, { rating, comment }).then(({ data }) => data) }
export const siteSettingsService = { get: () => client.get<SiteSettings>('/site-settings').then(({ data }) => data), update: (body: SiteSettings) => client.put<SiteSettings>('/site-settings', body).then(({ data }) => data) }
export const studentReviewService = { list: () => client.get<StudentReview[]>('/student-reviews').then(({ data }) => data), create: (body: Omit<StudentReview, 'id' | 'createdAt' | 'updatedAt'>) => client.post<StudentReview>('/student-reviews', body).then(({ data }) => data), update: (id: string, body: Omit<StudentReview, 'id' | 'createdAt' | 'updatedAt'>) => client.put<StudentReview>(`/student-reviews/${id}`, body).then(({ data }) => data), remove: (id: string) => client.delete(`/student-reviews/${id}`) }
export const consultationService = { create: (body: ConsultationRequestPayload) => client.post<ConsultationRequestSubmission>('/consultations', body).then(({ data }) => data), adminList: (status?: ConsultationRequestStatus) => client.get<ConsultationRequestListItem[]>('/consultations', { params: status ? { status } : undefined }).then(({ data }) => data), adminDetail: (id: string) => client.get<ConsultationRequestDetail>(`/consultations/${id}`).then(({ data }) => data), updateStatus: (id: string, status: ConsultationRequestStatus, adminNotes?: string) => client.patch<ConsultationRequestDetail>(`/consultations/${id}/status`, { status, adminNotes }).then(({ data }) => data) }
type ContentFilters = { search?: string; category?: string; tag?: string; platform?: string; contentType?: string; featured?: boolean }
export const videoService = { list: (page = 1, limit = 12, filters: ContentFilters = {}) => client.get<PagedResult<ContentListItem>>('/Videos', { params: { page, limit, ...filters } }).then(({ data }) => data), detail: (slug: string) => client.get<ExternalVideo>(`/Videos/${slug}`).then(({ data }) => data), adminList: (page = 1, limit = 50, filters: ContentFilters = {}) => client.get<PagedResult<ContentListItem>>('/Videos/admin', { params: { page, limit, ...filters } }).then(({ data }) => data), adminDetail: (slug: string) => client.get<ExternalVideo>(`/Videos/admin/${slug}`).then(({ data }) => data), create: (form: FormData) => client.post<ExternalVideo>('/Videos/upload', form).then(({ data }) => data), update: (id: string, form: FormData) => client.put(`/Videos/${id}/upload`, form), remove: (id: string) => client.delete(`/Videos/${id}`), publish: (id: string) => client.post(`/Videos/${id}/publish`), unpublish: (id: string) => client.post(`/Videos/${id}/unpublish`) }
export const articleService = { list: (page = 1, limit = 12, filters: ContentFilters = {}) => client.get<PagedResult<ContentListItem>>('/Articles', { params: { page, limit, ...filters } }).then(({ data }) => data), detail: (slug: string) => client.get<KnowledgeArticle>(`/Articles/${slug}`).then(({ data }) => data), adminList: (page = 1, limit = 50, filters: ContentFilters = {}) => client.get<PagedResult<ContentListItem>>('/Articles/admin', { params: { page, limit, ...filters } }).then(({ data }) => data), adminDetail: (slug: string) => client.get<KnowledgeArticle>(`/Articles/admin/${slug}`).then(({ data }) => data), create: (form: FormData) => client.post<KnowledgeArticle>('/Articles/upload', form).then(({ data }) => data), update: (id: string, form: FormData) => client.put(`/Articles/${id}/upload`, form), remove: (id: string) => client.delete(`/Articles/${id}`), publish: (id: string) => client.post(`/Articles/${id}/publish`), unpublish: (id: string) => client.post(`/Articles/${id}/unpublish`) }
