import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { authService } from '../api/services'
import { useLanguage } from '../context/LanguageContext'

export function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const email = String(new FormData(event.currentTarget).get('email')); setBusy(true); setError(''); try { const response = await authService.forgotPassword(email); setMessage(response.data?.message ?? 'If the email exists, a reset link will be sent.') } catch (error) { setError(getErrorMessage(error)) } finally { setBusy(false) } }
  return <section className="auth"><h1>{t('resetPassword')}</h1><p>{t('resetInstructions')}</p>{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}<form onSubmit={submit}><label>{t('email')}<input name="email" type="email" autoComplete="email" required /></label><button disabled={busy}>{busy ? t('sending') : t('sendReset')}</button></form><p><Link to="/login">{t('backToLogin')}</Link></p></section>
}
