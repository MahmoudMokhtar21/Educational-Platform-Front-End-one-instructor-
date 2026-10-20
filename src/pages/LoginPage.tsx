import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { authService } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { PasswordInput } from '../components/PasswordInput'
import { useLanguage } from '../context/LanguageContext'
import './AuthProfile.css'
export function LoginPage() {
  const { t, language } = useLanguage()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await login({ email, password: String(data.get('password')), rememberMe: Boolean(data.get('rememberMe')) })
      navigate((location.state as { from?: string } | null)?.from ?? '/dashboard')
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (!email) return
    setBusy(true)
    setNotice('')
    try {
      const response = await authService.resendVerification(email)
      setNotice(response.data?.message ?? 'Verification email requested.')
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const needsVerification = error.includes('verify your email')
  const introTitle = language === 'ar' ? 'تعلّم بوضوح. تقدّم بهدف.' : 'Learn with clarity. Progress with purpose.'
  const introDescription = language === 'ar'
    ? 'مساحة تعليمية عملية تساعدك على تحويل المعرفة إلى تقدم ملموس.'
    : 'A focused learning space built to turn knowledge into meaningful progress.'

  return (
    <section className="auth-page" aria-labelledby="login-title">
      <div className="auth-page__shell">
        <aside className="auth-page__intro" aria-label={introTitle}>
          <span className="auth-page__intro-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 18.5V8.75a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9.75" />
              <path d="M2.75 18.5h18.5M8 11.25h8M8 14.25h5" />
            </svg>
          </span>
          <p className="auth-page__eyebrow">{language === 'ar' ? 'منصة تعليمية احترافية' : 'Professional learning platform'}</p>
          <h2>{introTitle}</h2>
          <p>{introDescription}</p>
          <div className="auth-page__intro-rule" aria-hidden="true" />
        </aside>

        <div className="auth auth-card" aria-busy={busy}>
          <div className="auth-card__heading">
            <span className="auth-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
            <div>
              <p className="auth-card__eyebrow">{language === 'ar' ? 'بوابة المتعلم' : 'Learner portal'}</p>
              <h1 id="login-title">{t('welcomeBack')}</h1>
            </div>
          </div>
          <p className="auth-card__description">{language === 'ar' ? 'سجّل الدخول لمتابعة رحلتك التعليمية بثقة.' : 'Sign in to continue your learning journey with confidence.'}</p>

          {error && <p className="auth-feedback auth-feedback--error" role="alert">{error}</p>}
          {notice && <p className="auth-feedback auth-feedback--success" role="status">{notice}</p>}

          <form className="auth-form" onSubmit={submit}>
            <label className="auth-field" htmlFor="login-email">
              <span>{t('email')}</span>
              <input id="login-email" name="email" type="email" value={email} required autoComplete="email" onChange={event => setEmail(event.target.value)} />
            </label>
            <div className="auth-field"><label htmlFor="login-password"><span>{t('password')}</span></label><PasswordInput id="login-password" name="password" required autoComplete="current-password" /></div>

            <div className="auth-form__utility">
              <label className="auth-checkbox" htmlFor="remember-me">
                <input id="remember-me" name="rememberMe" type="checkbox" />
                <span>{t('rememberMe')}</span>
              </label>
              <Link className="auth-link" to="/forgot-password">{t('forgotPassword')}</Link>
            </div>

            <button className="auth-form__submit" disabled={busy}>{busy ? t('signingIn') : t('login')}</button>
          </form>

          {needsVerification && (
            <div className="auth-verification">
              <p>{language === 'ar' ? 'يمكننا إرسال رابط تحقق جديد إلى بريدك الإلكتروني.' : 'We can send a new verification link to your email address.'}</p>
              <button className="secondary-button auth-verification__button" type="button" onClick={resend} disabled={busy || !email}>{t('resendVerification')}</button>
            </div>
          )}

          <p className="auth-card__footer">{t('newHere')} <Link className="auth-link" to="/register">{t('createAccount')}</Link></p>
        </div>
      </div>
    </section>
  )
}
