import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'
import { CoursesPage } from './pages/CoursesPage'
import { CourseDetailPage } from './pages/CourseDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { LearningPage } from './pages/LearningPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { AdminCoursesPage } from './pages/AdminCoursesPage'
import { AdminCourseCreatePage } from './pages/AdminCourseCreatePage'
import { AdminCoursePage } from './pages/AdminCoursePage'
import { AdminCategoriesPage } from './pages/AdminCategoriesPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AccountPage } from './pages/AccountPage'
import { AboutPage } from './pages/AboutPage'
import { AdminSiteSettingsPage } from './pages/AdminSiteSettingsPage'
import { AdminSponsorsPage } from './pages/AdminSponsorsPage'
import { AdminStudentReviewsPage } from './pages/AdminStudentReviewsPage'
import { VideosPage } from './pages/VideosPage'
import { VideoDetailPage } from './pages/VideoDetailPage'
import { ArticlesPage } from './pages/ArticlesPage'
import { ArticleDetailPage } from './pages/ArticleDetailPage'
import { AdminVideosPage } from './pages/AdminVideosPage'
import { AdminArticlesPage } from './pages/AdminArticlesPage'
import { ConsultationPage } from './pages/ConsultationPage'
import { AdminConsultationsPage } from './pages/AdminConsultationsPage'
import { AdminCourseAccessCodesPage } from './pages/AdminCourseAccessCodesPage'
export default function App() {
  return <LanguageProvider>
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="consultation" element={<ConsultationPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="courses/:slug" element={<CourseDetailPage />} />
              <Route path="videos" element={<VideosPage />} />
              <Route path="videos/:slug" element={<VideoDetailPage />} />
              <Route path="articles" element={<ArticlesPage />} />
              <Route path="articles/:slug" element={<ArticleDetailPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="learn/:slug" element={<LearningPage />} />
              </Route>

              <Route element={<ProtectedRoute adminOnly />}>
                <Route path="admin" element={<AdminDashboardPage />} />
                <Route path="admin/courses" element={<AdminCoursesPage />} />
                <Route path="admin/courses/new" element={<AdminCourseCreatePage />} />
                <Route path="admin/courses/:id" element={<AdminCoursePage />} />
                <Route path="admin/categories" element={<AdminCategoriesPage />} />
                <Route path="admin/site-settings" element={<AdminSiteSettingsPage />} />
                <Route path="admin/sponsors" element={<AdminSponsorsPage />} />
                <Route path="admin/student-reviews" element={<AdminStudentReviewsPage />} />
                <Route path="admin/videos" element={<AdminVideosPage />} />
                <Route path="admin/articles" element={<AdminArticlesPage />} />
                <Route path="admin/consultations" element={<AdminConsultationsPage />} />
                <Route path="admin/course-access-codes" element={<AdminCourseAccessCodesPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </LanguageProvider>
}
