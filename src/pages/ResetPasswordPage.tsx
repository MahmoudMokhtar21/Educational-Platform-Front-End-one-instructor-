import { FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { authService } from '../api/services'
import { useLanguage } from '../context/LanguageContext'
import { PasswordInput } from '../components/PasswordInput'

export function ResetPasswordPage() {
  const { t } = useLanguage()
  const [params] = useSearchParams(); const navigate = useNavigate(); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const token = params.get('token') ?? ''
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const password = String(data.get('password')); if (password !== data.get('confirmPassword')) { setError('Passwords do not match.'); return } setBusy(true); setError(''); try { await authService.resetPassword(token, password); setMessage('Password updated. Redirecting to login…'); setTimeout(() => navigate('/login'), 1200) } catch (error) { setError(getErrorMessage(error)) } finally { setBusy(false) } }
  if (!token) return <section className="auth"><h1>Invalid reset link</h1><p>This reset link has no token.</p><Link to="/forgot-password">Request a new link</Link></section>
  return <section className="auth"><h1>{t('choosePassword')}</h1>{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}<form onSubmit={submit}><div className="password-field"><label htmlFor="reset-password">{t('newPassword')}</label><PasswordInput id="reset-password" name="password" minLength={8} required /></div><div className="password-field"><label htmlFor="reset-confirm-password">{t('confirmPassword')}</label><PasswordInput id="reset-confirm-password" name="confirmPassword" minLength={8} required /></div><button disabled={busy}>{busy ? t('saving') : t('updatePassword')}</button></form></section>
}
