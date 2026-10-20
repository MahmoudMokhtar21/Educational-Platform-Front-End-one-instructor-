import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/client'
import { consultationService } from '../api/services'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import type {
  ConsultationInterviewType,
  ConsultationPriority,
  ConsultationRequestPayload,
  ConsultationRequestSubmission,
  ConsultationType,
} from '../types/api'
import './ConsultationBookingFlow.css'

type LocalizedText = { en: string; ar: string }

type ConsultationForm = {
  emailAddress: string
  companyName: string
  whatsappNumber: string
  priority: ConsultationPriority
  businessActivity: string
  mainProductsOrServices: string
  consultationTopic: string
  consultationType: ConsultationType
  businessName: string
  businessField: string
  establishmentDate: string
  numberOfPartners: string
  positionInCompany: string
  reasonForConsultation: string
  interviewType: ConsultationInterviewType
  preferredInterviewDate: string
  preferredTimeFrom: string
  preferredTimeTo: string
}

type FormErrors = Partial<Record<keyof ConsultationForm, string>>

type ConsultationPackage = {
  title: LocalizedText
  introduction: LocalizedText
  purpose?: LocalizedText[]
  contractOptions?: LocalizedText[]
  packageIncludes: LocalizedText[]
  suitableFor?: LocalizedText[]
  benefits: LocalizedText[]
  expectedResults?: LocalizedText[]
}

export type ConsultationBookingFlowProps = {
  className?: string
  /** Allows another public surface to provide the same API contract if needed. */
  onSubmit?: (payload: ConsultationRequestPayload) => Promise<ConsultationRequestSubmission | unknown>
  onSubmitted?: (submission: ConsultationRequestSubmission | unknown) => void
}

const local = (en: string, ar: string): LocalizedText => ({ en, ar })

/**
 * The package catalogue deliberately lives next to the form state. This keeps
 * the dedicated page and any future embedded flow in sync without duplicating
 * copy or package logic.
 */
export const consultationPackages: Record<ConsultationType, ConsultationPackage> = {
  RemoteConsulting: {
    title: local('Remote Consulting Package', 'باقة الاستشارة عن بُعد'),
    introduction: local(
      'Specialized consultations provided by phone by Dr. Ahmed Nasif — Business & Project Development Consultant.',
      'استشارات متخصصة عبر الهاتف يقدمها د. أحمد نصيف — استشاري تطوير الأعمال والمشروعات.'
    ),
    purpose: [
      local('Analysis', 'التحليل'),
      local('Organization', 'تنظيم العمل'),
      local('Identifying the root causes of problems', 'تحديد الأسباب الجذرية للمشكلات'),
      local('Developing practical solutions', 'تطوير حلول عملية'),
    ],
    packageIncludes: [
      local('Accurate and comprehensive analysis of the current situation', 'تحليل دقيق وشامل للوضع الحالي'),
      local('Effective organization of business operations', 'تنظيم فعّال لعمليات العمل'),
      local('Identification of the real root causes of problems', 'تحديد الأسباب الحقيقية للمشكلات'),
      local('Practical recommendations', 'توصيات عملية'),
      local('Actionable plans', 'خطط قابلة للتنفيذ'),
    ],
    suitableFor: [
      local('Small and medium-sized business owners', 'أصحاب الأعمال الصغيرة والمتوسطة'),
      local('Business owners looking for practical and realistic solutions', 'أصحاب الأعمال الباحثون عن حلول عملية وواقعية'),
      local('People who need an expert and objective perspective', 'من يحتاجون إلى رؤية خبير وموضوعية'),
      local('Business owners looking to save time and costs', 'أصحاب الأعمال الراغبون في توفير الوقت والتكلفة'),
    ],
    benefits: [
      local('Complete confidentiality', 'سرية تامة'),
      local('Flexible scheduling', 'مرونة في المواعيد'),
      local('Consultation by phone', 'استشارة عبر الهاتف'),
      local('Comfort and convenience from your location', 'راحة وسهولة من موقعك'),
    ],
  },
  FieldConsulting: {
    title: local('Field Consulting Package', 'باقة الاستشارة الميدانية'),
    introduction: local(
      'A practical consulting package that starts from the real business environment. Provided by Dr. Ahmed Nasif, it focuses on analysis, organization, and identifying the root causes of business problems.',
      'باقة استشارية عملية تبدأ من بيئة العمل الحقيقية. يقدمها د. أحمد نصيف وتركز على التحليل والتنظيم وتحديد الأسباب الجذرية لمشكلات العمل.'
    ),
    packageIncludes: [
      local('A full-day field visit to the company premises', 'زيارة ميدانية ليوم كامل إلى مقر الشركة'),
      local('Meetings and analysis with management and different teams', 'اجتماعات وتحليل مع الإدارة والفرق المختلفة'),
      local('Review of the organizational structure', 'مراجعة الهيكل التنظيمي'),
      local('Review of job descriptions', 'مراجعة الوصف الوظيفي'),
      local('Comprehensive evaluation of the marketing system', 'تقييم شامل لنظام التسويق'),
      local('Evaluation of sales performance', 'تقييم أداء المبيعات'),
      local('Evaluation of customer service', 'تقييم خدمة العملاء'),
      local('Detailed diagnostic report', 'تقرير تشخيصي تفصيلي'),
      local('Phased development plan', 'خطة تطوير مرحلية'),
      local('One week of follow-up after the visit', 'متابعة لمدة أسبوع بعد الزيارة'),
    ],
    suitableFor: [
      local('Small and medium-sized businesses', 'الشركات الصغيرة والمتوسطة'),
      local('Startups', 'الشركات الناشئة'),
      local('Business owners', 'أصحاب الأعمال'),
      local('Organizations seeking practical and realistic solutions', 'المنظمات الباحثة عن حلول عملية وواقعية'),
      local('Businesses aiming to improve performance and achieve growth', 'الأعمال التي تهدف إلى تحسين الأداء وتحقيق النمو'),
    ],
    benefits: [
      local('Complete confidentiality', 'سرية تامة'),
      local('Accurate analysis', 'تحليل دقيق'),
      local('Reality-based solutions', 'حلول مبنية على الواقع'),
      local('A clear improvement vision', 'رؤية واضحة للتحسين'),
      local('Practical and actionable plans', 'خطط عملية قابلة للتنفيذ'),
    ],
  },
  ExecutiveConsulting: {
    title: local('Executive Consulting Package', 'باقة الاستشارة التنفيذية'),
    introduction: local(
      'A package focused on implementation, follow-up, and sustainable business growth. Provided by Dr. Ahmed Nasif.',
      'باقة تركز على التنفيذ والمتابعة والنمو المستدام للأعمال، يقدمها د. أحمد نصيف.'
    ),
    packageIncludes: [
      local('Weekly sessions with management and the business team', 'جلسات أسبوعية مع الإدارة وفريق العمل'),
      local('4 to 8 sessions per month', 'من 4 إلى 8 جلسات شهرياً'),
      local('Follow-up on the implementation of the strategic and marketing plan', 'متابعة تنفيذ الخطة الاستراتيجية والتسويقية'),
      local('Practical training for teams on new systems', 'تدريب عملي للفرق على الأنظمة الجديدة'),
      local('Monthly performance analysis', 'تحليل شهري للأداء'),
      local('KPI monitoring', 'متابعة مؤشرات الأداء الرئيسية'),
      local('Continuous adjustment and improvement of plans according to results', 'تعديل وتحسين مستمر للخطط وفق النتائج'),
      local('Immediate WhatsApp support for urgent consultations', 'دعم مباشر عبر واتساب للاستشارات العاجلة'),
    ],
    benefits: [
      local('Complete confidentiality and information protection', 'سرية تامة وحماية للمعلومات'),
      local('Flexible communication and scheduling', 'مرونة في التواصل والمواعيد'),
      local('Focus on results and return on investment', 'تركيز على النتائج والعائد على الاستثمار'),
      local('Strategic partnership for business growth', 'شراكة استراتيجية لنمو الأعمال'),
      local('Practical and actionable solutions', 'حلول عملية قابلة للتنفيذ'),
    ],
    expectedResults: [
      local('Regular consulting sessions', 'جلسات استشارية منتظمة'),
      local('Execution plans that drive growth', 'خطط تنفيذية تدفع النمو'),
      local('Direct and fast support', 'دعم مباشر وسريع'),
      local('Measurable real-world results', 'نتائج واقعية قابلة للقياس'),
    ],
  },
  ConsultingContract: {
    title: local('Comprehensive Consulting Contract', 'عقد استشاري شامل'),
    introduction: local(
      'A comprehensive package representing a long-term strategic partnership focused on sustainable results. Provided by Dr. Ahmed Nasif.',
      'باقة شاملة تمثل شراكة استراتيجية طويلة المدى تركز على نتائج مستدامة، يقدمها د. أحمد نصيف.'
    ),
    contractOptions: [local('Annual', 'سنوي'), local('Semi-annual', 'نصف سنوي')],
    packageIncludes: [
      local('Comprehensive assessment of the current business situation', 'تقييم شامل لوضع العمل الحالي'),
      local('12-month strategic plan', 'خطة استراتيجية لمدة 12 شهراً'),
      local('Complete organizational structure', 'هيكل تنظيمي متكامل'),
      local('Job descriptions for each position', 'وصف وظيفي لكل منصب'),
      local('Marketing system design', 'تصميم نظام التسويق'),
      local('Sales system design', 'تصميم نظام المبيعات'),
      local('Customer service system design', 'تصميم نظام خدمة العملاء'),
      local('Intensive training for senior management, middle management, and operational teams', 'تدريب مكثف للإدارة العليا والوسطى والفرق التشغيلية'),
      local('Weekly executive sessions', 'جلسات تنفيذية أسبوعية'),
      local('Daily WhatsApp follow-up', 'متابعة يومية عبر واتساب'),
      local('Monthly performance reports', 'تقارير أداء شهرية'),
      local('Quarterly performance reports', 'تقارير أداء ربع سنوية'),
      local('Development recommendations', 'توصيات تطويرية'),
      local('Direct supervision of recruitment and new appointments', 'إشراف مباشر على التوظيف والتعيينات الجديدة'),
      local('Immediate WhatsApp support for urgent consultations', 'دعم فوري عبر واتساب للاستشارات العاجلة'),
    ],
    benefits: [
      local('Long-term strategic partnership', 'شراكة استراتيجية طويلة المدى'),
      local('Data-driven decisions', 'قرارات مبنية على البيانات'),
      local('Daily follow-up', 'متابعة يومية'),
      local('Real implementation', 'تنفيذ فعلي'),
      local('Focus on results', 'تركيز على النتائج'),
      local('Sustainable growth', 'نمو مستدام'),
    ],
  },
}

const initialForm: ConsultationForm = {
  emailAddress: '',
  companyName: '',
  whatsappNumber: '',
  priority: 'Normal',
  businessActivity: '',
  mainProductsOrServices: '',
  consultationTopic: '',
  consultationType: 'RemoteConsulting',
  businessName: '',
  businessField: '',
  establishmentDate: '',
  numberOfPartners: '',
  positionInCompany: '',
  reasonForConsultation: '',
  interviewType: 'LiveZoom',
  preferredInterviewDate: '',
  preferredTimeFrom: '',
  preferredTimeTo: '',
}

function localDateToday() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="consultation-field-error" role="alert">{message}</p> : null
}

function PackageList({ title, items, language }: { title: string; items: LocalizedText[]; language: 'en' | 'ar' }) {
  return <section className="consultation-summary__section">
    <h4>{title}</h4>
    <ul>{items.map((item) => <li key={item.en}>{item[language]}</li>)}</ul>
  </section>
}

export function ConsultationBookingFlow({ className = '', onSubmit, onSubmitted }: ConsultationBookingFlowProps) {
  const { language } = useLanguage()
  const { show } = useToast()
  const [form, setForm] = useState<ConsultationForm>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [stage, setStage] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isArabic = language === 'ar'
  const today = localDateToday()
  const selectedPackage = consultationPackages[form.consultationType]
  const copy = (en: string, ar: string) => isArabic ? ar : en
  const packageText = (value: LocalizedText) => value[language]
  const submit = onSubmit ?? consultationService.create

  function updateField<Key extends keyof ConsultationForm>(field: Key, value: ConsultationForm[Key]) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function validateFirstStage() {
    const next: FormErrors = {}
    if (!/^\S+@\S+\.\S+$/.test(form.emailAddress.trim())) next.emailAddress = copy('Enter a valid email address.', 'أدخل بريداً إلكترونياً صالحاً.')
    if (!form.companyName.trim()) next.companyName = copy('Company name is required.', 'اسم الشركة مطلوب.')
    if (!/^\+?[0-9][0-9\s().-]{6,31}$/.test(form.whatsappNumber.trim())) next.whatsappNumber = copy('Enter a valid WhatsApp number.', 'أدخل رقم واتساب صالحاً.')
    if (!form.businessActivity.trim()) next.businessActivity = copy('Describe the business activity.', 'صف النشاط التجاري.')
    if (!form.mainProductsOrServices.trim()) next.mainProductsOrServices = copy('Add your main products or services.', 'اذكر المنتجات أو الخدمات الرئيسية.')
    if (!form.consultationTopic.trim()) next.consultationTopic = copy('Tell us the consultation topic.', 'حدد موضوع الاستشارة.')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function validateSecondStage() {
    const next: FormErrors = {}
    if (!form.businessName.trim()) next.businessName = copy('Business name is required.', 'اسم النشاط مطلوب.')
    if (!form.businessField.trim()) next.businessField = copy('Business field is required.', 'مجال العمل مطلوب.')
    if (!form.establishmentDate) next.establishmentDate = copy('Choose the business establishment date.', 'اختر تاريخ تأسيس النشاط.')
    else if (form.establishmentDate > today) next.establishmentDate = copy('The establishment date cannot be in the future.', 'لا يمكن أن يكون تاريخ التأسيس في المستقبل.')
    if (form.numberOfPartners && (!/^\d+$/.test(form.numberOfPartners) || Number(form.numberOfPartners) < 0)) next.numberOfPartners = copy('Enter a non-negative whole number.', 'أدخل عدداً صحيحاً غير سالب.')
    if (!form.positionInCompany.trim()) next.positionInCompany = copy('Tell us your position in the company.', 'حدد منصبك في الشركة.')
    if (!form.reasonForConsultation.trim()) next.reasonForConsultation = copy('Tell us why you are requesting the consultation.', 'اشرح سبب طلب الاستشارة.')
    if (!form.preferredInterviewDate) next.preferredInterviewDate = copy('Choose a preferred date.', 'اختر التاريخ المفضل.')
    else if (form.preferredInterviewDate < today) next.preferredInterviewDate = copy('Choose today or a future date.', 'اختر تاريخاً اليوم أو بعده.')
    if (!form.preferredTimeFrom) next.preferredTimeFrom = copy('Choose a start time.', 'اختر وقت البداية.')
    if (!form.preferredTimeTo) next.preferredTimeTo = copy('Choose an end time.', 'اختر وقت النهاية.')
    if (form.preferredTimeFrom && form.preferredTimeTo && form.preferredTimeTo <= form.preferredTimeFrom) next.preferredTimeTo = copy('End time must be after the start time.', 'يجب أن يكون وقت النهاية بعد البداية.')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function continueToDetails() {
    if (!validateFirstStage()) {
      show(copy('Please review the required fields before continuing.', 'راجع الحقول المطلوبة قبل المتابعة.'), 'error')
      return
    }
    setErrors({})
    setStage(2)
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    if (stage === 1) {
      continueToDetails()
      return
    }

    if (!validateSecondStage()) {
      show(copy('Please review the business and scheduling details before submitting.', 'راجع تفاصيل النشاط والموعد قبل الإرسال.'), 'error')
      return
    }

    const payload: ConsultationRequestPayload = {
      emailAddress: form.emailAddress.trim(),
      companyName: form.companyName.trim(),
      whatsappNumber: form.whatsappNumber.trim(),
      priority: form.priority,
      businessActivity: form.businessActivity.trim(),
      mainProductsOrServices: form.mainProductsOrServices.trim(),
      consultationTopic: form.consultationTopic.trim(),
      consultationType: form.consultationType,
      businessName: form.businessName.trim(),
      businessField: form.businessField.trim(),
      establishmentDate: form.establishmentDate,
      numberOfPartners: form.numberOfPartners ? Number(form.numberOfPartners) : null,
      positionInCompany: form.positionInCompany.trim(),
      reasonForConsultation: form.reasonForConsultation.trim(),
      interviewType: form.interviewType,
      preferredInterviewDate: form.preferredInterviewDate,
      preferredTimeFrom: form.preferredTimeFrom,
      preferredTimeTo: form.preferredTimeTo,
    }

    setIsSubmitting(true)
    try {
      const submission = await submit(payload)
      onSubmitted?.(submission)
      show(copy('Your request is in. We’ll contact you to confirm the session.', 'تم إرسال طلبك. سنتواصل معك لتأكيد الموعد.'), 'success')
      setForm(initialForm)
      setErrors({})
      setStage(1)
    } catch (error) {
      const message = isArabic
        ? 'تعذر إرسال الطلب حالياً. حاول مرة أخرى.'
        : getErrorMessage(error)
      show(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <section className={`consultation-flow ${className}`.trim()} aria-labelledby="consultation-form-title">
    <div className="consultation-flow__header">
      <div>
        <p className="consultation-flow__eyebrow">{copy('Consultation request', 'طلب استشارة')}</p>
        <h2 id="consultation-form-title">
          {stage === 1
            ? copy('Choose the right consultation', 'اختر الاستشارة المناسبة')
            : copy('Your selected package and business details', 'باقتك المختارة وتفاصيل نشاطك')}
        </h2>
        <p>
          {stage === 1
            ? copy('Choose the consultation type and priority, then share a short brief about what you need.', 'اختر نوع الاستشارة وأولويتها، ثم شاركنا ملخصاً قصيراً عن احتياجك.')
            : copy('Review what is included, then share the information needed to prepare for your preferred time request.', 'راجع ما تتضمنه الباقة، ثم شاركنا المعلومات اللازمة للتحضير لطلب الموعد المفضل.')}
        </p>
      </div>
      <ol className="consultation-steps" aria-label={copy('Consultation request steps', 'مراحل طلب الاستشارة')}>
        <li className={stage === 1 ? 'is-active' : 'is-complete'} aria-current={stage === 1 ? 'step' : undefined}><span>1</span>{copy('Choose', 'الاختيار')}</li>
        <li className={stage === 2 ? 'is-active' : ''} aria-current={stage === 2 ? 'step' : undefined}><span>2</span>{copy('Details', 'التفاصيل')}</li>
      </ol>
    </div>

    <div className={`consultation-flow__content${stage === 1 ? ' consultation-flow__content--single' : ''}`}>
      {stage === 2 && <aside className="consultation-summary" aria-live="polite">
        <span className="consultation-summary__label">{copy('Selected package', 'الباقة المختارة')}</span>
        <h3>{packageText(selectedPackage.title)}</h3>
        <p>{packageText(selectedPackage.introduction)}</p>
        {selectedPackage.contractOptions && <PackageList title={copy('Contract options', 'خيارات العقد')} items={selectedPackage.contractOptions} language={language} />}
        {selectedPackage.purpose && <PackageList title={copy('Purpose', 'الهدف')} items={selectedPackage.purpose} language={language} />}
        <PackageList title={copy('Package includes', 'تشمل الباقة')} items={selectedPackage.packageIncludes} language={language} />
        {selectedPackage.suitableFor && <PackageList title={copy('Suitable for', 'مناسبة لـ')} items={selectedPackage.suitableFor} language={language} />}
        <PackageList title={copy('Package benefits', 'مزايا الباقة')} items={selectedPackage.benefits} language={language} />
        {selectedPackage.expectedResults && <PackageList title={copy('Expected results', 'النتائج المتوقعة')} items={selectedPackage.expectedResults} language={language} />}
      </aside>}

      <form className="consultation-form" noValidate onSubmit={submitRequest}>
        {stage === 1 && <fieldset className="consultation-form__fieldset">
          <legend>{copy('Choose your consultation and share your brief', 'اختر الاستشارة وعرّفنا بطلبك')}</legend>
          <p className="consultation-form__required-note"><span aria-hidden="true">*</span>{copy('All fields are required unless marked optional.', 'جميع الحقول مطلوبة ما لم تُذكر كاختيارية.')}</p>
          <div className="consultation-form__grid">
            <label className="consultation-form__field">
              <span>{copy('Consultation type', 'نوع الاستشارة')}</span>
              <select required value={form.consultationType} onChange={(event) => updateField('consultationType', event.target.value as ConsultationType)}>
                <option value="RemoteConsulting">{copy('Remote Consulting', 'استشارة عن بُعد')}</option>
                <option value="FieldConsulting">{copy('Field Consulting', 'استشارة ميدانية')}</option>
                <option value="ExecutiveConsulting">{copy('Executive Consulting', 'استشارة تنفيذية')}</option>
                <option value="ConsultingContract">{copy('Consulting Contract', 'عقد استشاري')}</option>
              </select>
              <small>{packageText(selectedPackage.introduction)}</small>
            </label>
            <label className="consultation-form__field">
              <span>{copy('Priority', 'الأولوية')}</span>
              <select required value={form.priority} onChange={(event) => updateField('priority', event.target.value as ConsultationPriority)}>
                <option value="Low">{copy('Low', 'منخفضة')}</option>
                <option value="Normal">{copy('Normal', 'عادية')}</option>
                <option value="High">{copy('High', 'مرتفعة')}</option>
                <option value="Urgent">{copy('Urgent', 'عاجلة')}</option>
              </select>
              <small>{copy('Select the urgency level for your request.', 'اختر مستوى أولوية طلبك.')}</small>
            </label>
            <label className="consultation-form__field">
              <span>{copy('Email address', 'البريد الإلكتروني')}</span>
              <input type="email" autoComplete="email" maxLength={254} value={form.emailAddress} onChange={(event) => updateField('emailAddress', event.target.value)} aria-invalid={Boolean(errors.emailAddress)} placeholder="you@company.com" />
              <FieldError message={errors.emailAddress} />
            </label>
            <label className="consultation-form__field">
              <span>{copy('WhatsApp number', 'رقم واتساب')}</span>
              <input type="tel" autoComplete="tel" maxLength={32} value={form.whatsappNumber} onChange={(event) => updateField('whatsappNumber', event.target.value)} aria-invalid={Boolean(errors.whatsappNumber)} placeholder="+20 …" />
              <FieldError message={errors.whatsappNumber} />
            </label>
            <label className="consultation-form__field">
              <span>{copy('Company name', 'اسم الشركة')}</span>
              <input maxLength={200} value={form.companyName} onChange={(event) => updateField('companyName', event.target.value)} aria-invalid={Boolean(errors.companyName)} placeholder={copy('Company or organization name', 'اسم الشركة أو الجهة')} />
              <FieldError message={errors.companyName} />
            </label>
            <label className="consultation-form__field">
              <span>{copy('Business activity', 'النشاط التجاري')}</span>
              <input maxLength={500} value={form.businessActivity} onChange={(event) => updateField('businessActivity', event.target.value)} aria-invalid={Boolean(errors.businessActivity)} placeholder={copy('For example: e-commerce', 'مثال: تجارة إلكترونية')} />
              <FieldError message={errors.businessActivity} />
            </label>
            <label className="consultation-form__field consultation-form__field--wide">
              <span>{copy('Main products or services', 'المنتجات أو الخدمات الرئيسية')}</span>
              <textarea rows={3} maxLength={2000} value={form.mainProductsOrServices} onChange={(event) => updateField('mainProductsOrServices', event.target.value)} aria-invalid={Boolean(errors.mainProductsOrServices)} placeholder={copy('What do you offer your customers?', 'ما الذي تقدمه لعملائك؟')} />
              <FieldError message={errors.mainProductsOrServices} />
            </label>
            <label className="consultation-form__field consultation-form__field--wide">
              <span>{copy('Consultation topic', 'موضوع الاستشارة')}</span>
              <textarea rows={3} maxLength={300} value={form.consultationTopic} onChange={(event) => updateField('consultationTopic', event.target.value)} aria-invalid={Boolean(errors.consultationTopic)} placeholder={copy('Which decision or challenge would you like to discuss?', 'ما القرار أو التحدي الذي تريد مناقشته؟')} />
              <FieldError message={errors.consultationTopic} />
            </label>
          </div>
          <div className="consultation-form__actions">
            <button type="submit">{copy('Continue to details', 'متابعة إلى التفاصيل')} <span aria-hidden="true">{isArabic ? '←' : '→'}</span></button>
            <p>{copy('Step 1 of 2', 'الخطوة 1 من 2')}</p>
          </div>
        </fieldset>}

        {stage === 2 && <>
          <fieldset className="consultation-form__fieldset">
            <legend>{copy('Business information', 'معلومات النشاط')}</legend>
            <p className="consultation-form__helper">{copy('Please provide this information to help us better understand your business and prepare for the consultation.', 'يرجى تقديم هذه المعلومات لمساعدتنا على فهم نشاطك والاستعداد للاستشارة.')}</p>
            <p className="consultation-form__required-note"><span aria-hidden="true">*</span>{copy('All fields are required unless marked optional.', 'جميع الحقول مطلوبة ما لم تُذكر كاختيارية.')}</p>
            <div className="consultation-form__grid">
              <label className="consultation-form__field">
                <span>{copy('Business name', 'اسم النشاط')}</span>
                <input maxLength={200} value={form.businessName} onChange={(event) => updateField('businessName', event.target.value)} aria-invalid={Boolean(errors.businessName)} placeholder={copy('Brand or business name', 'اسم العلامة أو النشاط')} />
                <FieldError message={errors.businessName} />
              </label>
              <label className="consultation-form__field">
                <span>{copy('Business field', 'مجال العمل')}</span>
                <input maxLength={200} value={form.businessField} onChange={(event) => updateField('businessField', event.target.value)} aria-invalid={Boolean(errors.businessField)} placeholder={copy('For example: retail or technology', 'مثال: التجزئة أو التقنية')} />
                <FieldError message={errors.businessField} />
              </label>
              <label className="consultation-form__field">
                <span>{copy('Establishment date', 'تاريخ التأسيس')}</span>
                <input type="date" max={today} value={form.establishmentDate} onChange={(event) => updateField('establishmentDate', event.target.value)} aria-invalid={Boolean(errors.establishmentDate)} />
                <FieldError message={errors.establishmentDate} />
              </label>
              <label className="consultation-form__field">
                <span>{copy('Number of partners (optional)', 'عدد الشركاء (اختياري)')}</span>
                <input type="number" min="0" step="1" inputMode="numeric" value={form.numberOfPartners} onChange={(event) => updateField('numberOfPartners', event.target.value)} aria-invalid={Boolean(errors.numberOfPartners)} />
                <FieldError message={errors.numberOfPartners} />
              </label>
              <label className="consultation-form__field consultation-form__field--wide">
                <span>{copy('Your position in the company', 'منصبك في الشركة')}</span>
                <input maxLength={200} value={form.positionInCompany} onChange={(event) => updateField('positionInCompany', event.target.value)} aria-invalid={Boolean(errors.positionInCompany)} placeholder={copy('For example: founder or general manager', 'مثال: المؤسس أو المدير العام')} />
                <FieldError message={errors.positionInCompany} />
              </label>
              <label className="consultation-form__field consultation-form__field--wide">
                <span>{copy('Reason for consultation', 'سبب طلب الاستشارة')}</span>
                <textarea rows={5} maxLength={4000} value={form.reasonForConsultation} onChange={(event) => updateField('reasonForConsultation', event.target.value)} aria-invalid={Boolean(errors.reasonForConsultation)} placeholder={copy('Share the context and the outcome you hope to reach.', 'اشرح السياق والنتيجة التي تأمل الوصول إليها.')} />
                <FieldError message={errors.reasonForConsultation} />
              </label>
            </div>
          </fieldset>

          <fieldset className="consultation-form__fieldset">
            <legend>{copy('Interview preferences', 'تفضيلات المقابلة')}</legend>
            <p className="consultation-form__helper">{copy('Choose a preferred time window. This is a request, not an automatic appointment confirmation.', 'اختر نافذة زمنية مفضلة. هذا طلب للموعد وليس تأكيداً تلقائياً له.')}</p>
            <div className="consultation-form__grid">
              <label className="consultation-form__field consultation-form__field--wide">
                <span>{copy('Interview type', 'طريقة المقابلة')}</span>
                <select value={form.interviewType} onChange={(event) => updateField('interviewType', event.target.value as ConsultationInterviewType)}>
                  <option value="LiveZoom">{copy('Live Zoom meeting', 'اجتماع مباشر عبر Zoom')}</option>
                  <option value="Phone">{copy('Phone call', 'مكالمة هاتفية')}</option>
                  <option value="FieldVisit">{copy('Field visit', 'زيارة ميدانية')}</option>
                </select>
              </label>
              <label className="consultation-form__field">
                <span>{copy('Preferred interview date', 'تاريخ المقابلة المفضل')}</span>
                <input type="date" min={today} value={form.preferredInterviewDate} onChange={(event) => updateField('preferredInterviewDate', event.target.value)} aria-invalid={Boolean(errors.preferredInterviewDate)} />
                <FieldError message={errors.preferredInterviewDate} />
              </label>
              <div className="consultation-form__time-grid consultation-form__field">
                <span>{copy('Preferred time window', 'النافذة الزمنية المفضلة')}</span>
                <div>
                  <label><span className="sr-only">{copy('From', 'من')}</span><input type="time" value={form.preferredTimeFrom} onChange={(event) => updateField('preferredTimeFrom', event.target.value)} aria-invalid={Boolean(errors.preferredTimeFrom)} /></label>
                  <b aria-hidden="true">—</b>
                  <label><span className="sr-only">{copy('To', 'إلى')}</span><input type="time" value={form.preferredTimeTo} onChange={(event) => updateField('preferredTimeTo', event.target.value)} aria-invalid={Boolean(errors.preferredTimeTo)} /></label>
                </div>
                <FieldError message={errors.preferredTimeFrom} />
                <FieldError message={errors.preferredTimeTo} />
              </div>
            </div>
          </fieldset>
          <div className="consultation-form__actions consultation-form__actions--split">
            <button type="button" className="secondary-button" onClick={() => { setErrors({}); setStage(1) }}>{copy('Back to selection', 'العودة للاختيار')}</button>
            <div>
              <p>{copy('Step 2 of 2', 'الخطوة 2 من 2')}</p>
              <button type="submit" disabled={isSubmitting}>{isSubmitting ? copy('Sending request…', 'جارٍ إرسال الطلب…') : copy('Submit consultation request', 'إرسال طلب الاستشارة')}</button>
            </div>
          </div>
        </>}
      </form>
    </div>
  </section>
}
