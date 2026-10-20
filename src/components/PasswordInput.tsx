import { useState, type InputHTMLAttributes } from 'react'
import { useLanguage } from '../context/LanguageContext'
import './PasswordInput.css'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function PasswordInput({ disabled, ...inputProps }: Props) {
  const { language } = useLanguage()
  const [visible, setVisible] = useState(false)
  const show = language === 'ar' ? 'إظهار كلمة المرور' : 'Show password'
  const hide = language === 'ar' ? 'إخفاء كلمة المرور' : 'Hide password'

  return (
    <span className="password-input">
      <input {...inputProps} type={visible ? 'text' : 'password'} disabled={disabled} />
      <button
        className="password-input__toggle"
        type="button"
        aria-label={visible ? hide : show}
        aria-pressed={visible}
        disabled={disabled}
        onClick={() => setVisible(value => !value)}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M6.2 6.2A12.1 12.1 0 0 0 2.2 10a1.9 1.9 0 0 0 0 1.8C3.2 13.9 6.8 18 12 18c1.2 0 2.4-.2 3.5-.7M9.9 4.2A10.6 10.6 0 0 1 12 4c5.2 0 8.8 4.1 9.8 6.1a1.9 1.9 0 0 1 0 1.8 12.1 12.1 0 0 1-3.5 4.1" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><path d="M2.2 12a1.9 1.9 0 0 1 0-1.8C3.2 8.1 6.8 4 12 4s8.8 4.1 9.8 6.2a1.9 1.9 0 0 1 0 1.8C20.8 15.9 17.2 20 12 20S3.2 15.9 2.2 13.8A1.9 1.9 0 0 1 2.2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
        )}
      </button>
    </span>
  )
}
