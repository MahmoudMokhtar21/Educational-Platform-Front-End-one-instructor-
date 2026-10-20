export interface ApiMessage { message: string }
export interface User { userId: string; email: string; firstName: string; lastName: string; role: 'student' | 'admin' | string; profilePictureUrl?: string }
export interface LoginRequest { email: string; password: string; rememberMe?: boolean }
export interface LoginResponse extends User { token: string; expiresIn: number; csrfToken: string }
export interface Profile extends User { bio?: string; profilePictureUrl?: string }
export interface RegisterRequest { email: string; password: string; confirmPassword: string; firstName: string; lastName: string; bio?: string; profilePictureUrl?: string }
export type CourseAccessType = "Sequential" | "Full"
export interface CourseCategory { id: string; name: string; slug: string }
export interface Course { id: string; title: string; slug: string; shortDescription?: string; price: number; basicPrice: number; fullAccessPrice: number; thumbnailUrl?: string; level: string; totalHours: number; totalStudents: number; averageRating: number; totalReviews: number; totalLessons: number; category?: CourseCategory; categories?: CourseCategory[] }
export interface LessonResource { id: string; title: string; fileUrl: string; fileType: string }
export interface Lesson { id: string; title: string; trackId?: string; orderIndex: number; contentText?: string; videoUrl?: string; hasVideo: boolean; videoDurationSeconds: number; isPreview: boolean; isWatched: boolean; isCompleted: boolean; isLocked: boolean; isCurrent: boolean; resources?: LessonResource[] }
export interface Track { id: string; courseId: string; title: string; description?: string; orderIndex: number; createdAt: string; lessons: Lesson[]; lessonCount: number }
export interface LessonContentAccess { url: string; expiresAt?: string }
export interface LessonComment { id: string; authorName: string; authorProfilePictureUrl?: string; content: string; createdAt: string }
export interface Category { id: string; name: string; slug: string; description?: string; imageUrl?: string; isActive: boolean }
export interface Sponsor { id: string; name: string; logoUrl: string; websiteUrl?: string; isActive: boolean; displayOrder: number }
export type ContentStatus = 'draft' | 'published' | 'unpublished'
export type ExternalPlatform = 'youtube' | 'facebook' | 'tiktok' | 'vimeo' | string
export type ArticleContentType = 'article' | 'study' | 'case-study' | 'guide' | 'analysis' | 'research' | 'insight'
export interface ContentListItem { id: string; title: string; slug: string; description?: string; thumbnailUrl?: string; categoryId?: string; categoryName?: string; tags: string[]; isFeatured: boolean; status: ContentStatus | string; platform?: ExternalPlatform; contentType?: ArticleContentType | string; readingTimeMinutes?: number; publishedAt?: string; createdAt: string }
export interface ExternalVideo extends ContentListItem { platform: ExternalPlatform; url: string; embedUrl: string; relatedCourseId?: string; relatedLessonId?: string }
export interface KnowledgeArticle extends ContentListItem { contentType: ArticleContentType | string; content: string; subtitle?: string; relatedCourseId?: string; relatedLessonId?: string; seoTitle?: string; seoDescription?: string }
export interface VideoUpsert { title: string; url: string; description?: string; thumbnailUrl?: string; categoryId?: string; tags?: string[]; isFeatured: boolean; status: ContentStatus; relatedCourseId?: string; relatedLessonId?: string }
export interface ArticleUpsert { title: string; slug?: string; subtitle?: string; excerpt: string; coverImageUrl?: string; content: string; contentType: ArticleContentType; categoryId?: string; tags?: string[]; isFeatured: boolean; status: ContentStatus; relatedCourseId?: string; relatedLessonId?: string; seoTitle?: string; seoDescription?: string }
export interface StudentReview { id: string; name: string; initials: string; rating: number; reviewText: string; createdAt: string; updatedAt: string }
export type ConsultationPriority = 'Low' | 'Normal' | 'High' | 'Urgent'
export type ConsultationType = 'ExecutiveConsulting' | 'FieldConsulting' | 'RemoteConsulting' | 'ConsultingContract'
export type ConsultationInterviewType = 'Phone' | 'LiveZoom' | 'FieldVisit'
export type ConsultationRequestStatus = 'Pending' | 'Contacted' | 'Confirmed' | 'Completed' | 'Declined' | 'Cancelled'
export interface ConsultationRequestPayload { emailAddress: string; companyName: string; whatsappNumber: string; priority: ConsultationPriority; businessActivity: string; mainProductsOrServices: string; consultationTopic: string; consultationType: ConsultationType; businessName: string; businessField: string; establishmentDate: string; numberOfPartners: number | null; positionInCompany: string; reasonForConsultation: string; interviewType: ConsultationInterviewType; preferredInterviewDate: string; preferredTimeFrom: string; preferredTimeTo: string }
export interface ConsultationRequestSubmission { id: string; status: ConsultationRequestStatus; submittedAt: string }
export interface ConsultationRequestListItem { id: string; companyName: string; emailAddress: string; priority: ConsultationPriority; consultationType: ConsultationType; interviewType: ConsultationInterviewType; preferredInterviewDate: string; preferredTimeFrom: string; preferredTimeTo: string; status: ConsultationRequestStatus; submittedAt: string; updatedAt: string }
export interface ConsultationRequestDetail extends ConsultationRequestListItem { whatsappNumber: string; businessActivity: string; mainProductsOrServices: string; consultationTopic: string; businessName: string; businessField: string; establishmentDate: string; numberOfPartners: number | null; positionInCompany: string; reasonForConsultation: string; adminNotes?: string }
export interface CourseDetail extends Course { description: string; trailerUrl?: string; tags: string[]; lessons: Lesson[]; tracks?: Track[]; isEnrolled: boolean; hasAdminAccess?: boolean; progressPercent?: number; accessType?: CourseAccessType }
export interface AdminCourse extends CourseDetail { status: 'draft' | 'published' | 'archived' | string; createdAt: string; updatedAt: string }
export interface PagedResult<T> { items: T[]; totalItems: number; totalPages: number; currentPage: number; pageSize: number }
export interface Enrollment { id: string; courseId: string; accessType: CourseAccessType; enrolledAt: string; progressPercent: number; status: string; watchedLessons: { lessonId: string; isCompleted: boolean }[] }
export interface Review { id: string; courseId: string; rating: number; comment: string; createdAt: string; updatedAt?: string }
export interface MyCourse { id: string; courseId: string; accessType: CourseAccessType; courseTitle: string; courseSlug: string; courseThumbnail?: string; progressPercent: number; status: string; totalLessons: number; completedLessons: number }
export interface MyCourses { activeCourses: MyCourse[]; completedCourses: MyCourse[]; totalActive: number; totalCompleted: number; totalProgress: number }
export interface AdminDashboard { totalCourses: number; publishedCourses: number; draftCourses: number; totalStudents: number; totalEnrollments: number; activeEnrollments: number; recentCourses: { id: string; title: string; status: string; totalStudents: number; createdAt: string }[] }
export interface BioStat { id: string; icon: 'linkedin' | 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'x' | 'whatsapp' | 'telegram' | 'chart' | string; count: string; labelEn: string; labelAr: string; url: string; isVisible: boolean }
export interface SiteSettings { platformName: string; aboutTitle: string; aboutContent: string; aboutTitleEn: string; aboutTitleAr: string; aboutContentEn: string; aboutContentAr: string; isAboutVisible: boolean; whoWeAreTitleEn: string; whoWeAreTitleAr: string; whoWeAreContentEn: string; whoWeAreContentAr: string; isWhoWeAreVisible: boolean; bioTitleEn: string; bioTitleAr: string; bioDescriptionEn: string; bioDescriptionAr: string; consultationDescriptionEn: string; consultationDescriptionAr: string; bioStats: BioStat[]; socialLinks: Record<string, string>; socialLinkVisibility: Record<string, boolean>; navigationLinks: Record<string, string>; navigationLabels: Record<string, string> }
export interface AdminDashboard { totalCourses: number; publishedCourses: number; draftCourses: number; totalStudents: number; totalEnrollments: number; activeEnrollments: number; recentCourses: { id: string; title: string; status: string; totalStudents: number; createdAt: string }[] }
export type PaymentProvider = 'mock' | 'paymob' | 'kashier' | string
export type CompletedEnrollment = { success: true; enrollmentId: string; accessType?: CourseAccessType; requiresPayment?: false; message: string }
export type PaymentRequiredEnrollment = {
  requiresPayment: true
  provider: PaymentProvider
  paymentReference?: string
  checkoutUrl?: string
  /** True only when the backend selected its development Mock provider. */
  isMock?: boolean
  accessType?: CourseAccessType
  message: string
}
export type EnrollmentResult = CompletedEnrollment | PaymentRequiredEnrollment

export interface LessonProgressUpdate { watchDurationSeconds: number; isCompleted: boolean; progressPercent: number; accessType: CourseAccessType; nextLessonId?: string }

export type CourseAccessCodeStatus = 'active' | 'redeemed' | 'expired' | 'revoked' | string
export interface AdminCourseAccessCode { id: string; courseId: string; courseTitle: string; maskedCode: string; createdAt: string; expiresAt: string; redeemedAt?: string; redeemedByStudentId?: string; status: CourseAccessCodeStatus; canRevoke: boolean }
export interface GeneratedCourseAccessCode extends AdminCourseAccessCode { code: string }
export interface CourseAccessCodeRedemption { success: boolean; errorCode?: string; message: string; enrollmentId?: string; accessType: CourseAccessType }