import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authService } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useLanguage } from '../context/LanguageContext'
export function VerifyEmailPage() { const { t } = useLanguage(); const [params] = useSearchParams(); const token = params.get('token') ?? ''; const [message, setMessage] = useState('Verifying your email…'); useEffect(() => { if (!token) { setMessage('This verification link has no token.'); return } authService.verifyEmail(token).then(r => setMessage(r.data?.message ?? 'Email verified successfully.')).catch(e => setMessage(getErrorMessage(e))) }, [token]); return <section className="auth"><h1>{t('emailVerification')}</h1><p role="status">{message}</p><Link to="/login">{t('goToLogin')}</Link></section> }
