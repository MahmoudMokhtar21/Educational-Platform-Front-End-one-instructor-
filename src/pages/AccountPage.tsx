import { FormEvent, useEffect, useState } from 'react'
import { getErrorMessage } from '../api/client'
import { accountService } from '../api/services'
import type { Profile } from '../types/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { ImageUploadField } from '../components/ImageUploadField'
import { PasswordInput } from '../components/PasswordInput'
import './AuthProfile.css'

export function AccountPage() {
  const { updateUser } = useAuth()
  const { language } = useLanguage()
  const text = (english: string, arabic: string) => language === 'ar' ? arabic : english
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profilePhoto, setProfilePhoto] = useState<File>()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  useEffect(() => {
    accountService.profile().then(setProfile).catch(error => setError(getErrorMessage(error)))
  }, [])

  const syncAuthenticatedUser = (saved: Profile) => {
    updateUser({
      userId: saved.userId,
      email: saved.email,
      firstName: saved.firstName,
      lastName: saved.lastName,
      role: saved.role,
      profilePictureUrl: saved.profilePictureUrl
    })
  }

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    if (!profile) return

    setBusy(true)
    setError('')
    setNotice('')

    try {
      // This preserves a legacy image URL unless the user intentionally uploads a replacement.
      const savedDetails = await accountService.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio
      })
      setProfile(savedDetails)
      syncAuthenticatedUser(savedDetails)

      if (profilePhoto) {
        try {
          const savedPhoto = await accountService.uploadProfilePhoto(profilePhoto)
          setProfile(savedPhoto)
          syncAuthenticatedUser(savedPhoto)
          setProfilePhoto(undefined)
        } catch {
          setError(text(
            'Your profile details were saved, but the new photo could not be uploaded. Your existing photo was kept.',
            'تم حفظ بيانات الملف الشخصي، لكن تعذر رفع الصورة الجديدة. تم الاحتفاظ بالصورة الحالية.'
          ))
          return
        }
      }

      setNotice(text('Your account details have been saved.', 'تم حفظ تفاصيل حسابك.'))
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setBusy(false)
    }
  }

  const savePassword = async (event: FormEvent) => {
    event.preventDefault()
    if (newPassword.length < 6) {
      setError(language === 'ar' ? 'يجب أن تتكون كلمة المرور الجديدة من ستة أحرف على الأقل.' : 'New password must be at least 6 characters.')
      return
    }
    if (!confirmNewPassword) {
      setError(language === 'ar' ? 'يرجى تأكيد كلمة المرور الجديدة.' : 'Please confirm your new password.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setError(language === 'ar' ? 'كلمة المرور الجديدة وتأكيدها غير متطابقين.' : 'New password and confirmation do not match.')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')

    try {
      await accountService.changePassword(currentPassword, newPassword, confirmNewPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setNotice(language === 'ar' ? 'تم تغيير كلمة المرور.' : 'Your password has been changed.')
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setBusy(false)
    }
  }

  if (error && !profile) {
    return <section className="empty account-page__state"><h1>{text('Account', 'الحساب')}</h1><p role="alert">{error}</p></section>
  }

  if (!profile) {
    return <section className="empty account-page__state" aria-live="polite"><p>{text('Loading account…', 'جارٍ تحميل الحساب…')}</p></section>
  }

  const profileInitials = `${profile.firstName.slice(0, 1)}${profile.lastName.slice(0, 1)}`.toUpperCase() || 'U'

  return (
    <section className="admin-page account-page" aria-labelledby="account-title">
      <div className="page-heading account-page__heading">
        <div>
          <p className="eyebrow">{text('Account', 'الحساب')}</p>
          <h1 id="account-title">{text('Profile and security', 'الملف الشخصي والأمان')}</h1>
          <p>{text('Manage the account details connected to your sign-in.', 'أدر تفاصيل الحساب المرتبط بتسجيل دخولك.')}</p>
        </div>
        <div className="account-page__identity" aria-label={text('Current profile', 'الملف الشخصي الحالي')}>
          <span className="account-page__avatar" aria-hidden="true">
            <span>{profileInitials}</span>
            {profile.profilePictureUrl && <img src={profile.profilePictureUrl} alt="" onError={event => { event.currentTarget.hidden = true }} />}
          </span>
          <span className="account-page__identity-copy">
            <strong>{`${profile.firstName} ${profile.lastName}`}</strong>
            <span>{profile.email}</span>
          </span>
        </div>
      </div>

      {notice && <p className="account-feedback account-feedback--success" role="status">{notice}</p>}
      {error && <p className="account-feedback account-feedback--error" role="alert">{error}</p>}

      <div className="account-page__forms">
        <form className="admin-form account-panel" onSubmit={saveProfile} aria-busy={busy}>
          <div className="account-panel__header">
            <span className="account-panel__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg></span>
            <div><h2>{text('Profile details', 'تفاصيل الملف الشخصي')}</h2><p>{text('Keep your personal information accurate and up to date.', 'حافظ على دقة معلوماتك الشخصية وتحديثها.')}</p></div>
          </div>
          <label className="account-field account-field--full" htmlFor="account-email"><span>{text('Email', 'البريد الإلكتروني')}</span><input id="account-email" value={profile.email} disabled /></label>
          <label className="account-field" htmlFor="account-first-name"><span>{text('First name', 'الاسم الأول')}</span><input id="account-first-name" required value={profile.firstName} onChange={event => setProfile({ ...profile, firstName: event.target.value })} /></label>
          <label className="account-field" htmlFor="account-last-name"><span>{text('Last name', 'اسم العائلة')}</span><input id="account-last-name" required value={profile.lastName} onChange={event => setProfile({ ...profile, lastName: event.target.value })} /></label>
          <label className="account-field account-field--full" htmlFor="account-bio"><span>{text('Bio', 'نبذة شخصية')}</span><textarea id="account-bio" rows={5} maxLength={1000} value={profile.bio ?? ''} onChange={event => setProfile({ ...profile, bio: event.target.value })} /><small>{text('Optional — up to 1,000 characters.', 'اختياري — حتى 1000 حرف.')}</small></label>
          <div className="account-field account-field--full">
            <ImageUploadField
              label={text('Profile photo', 'صورة الملف الشخصي')}
              helpText={text('JPG, PNG, or WebP. Up to 5 MB.', 'JPG أو PNG أو WebP. حتى 5 ميجابايت.')}
              existingImageUrl={profile.profilePictureUrl}
              value={profilePhoto}
              disabled={busy}
              onChange={setProfilePhoto}
              clearLabel={text('Cancel selection', 'إلغاء الاختيار')}
              selectLabel={text('Choose a profile photo', 'اختر صورة للملف الشخصي')}
              dropLabel={text('Drop an image here, or choose a file.', 'اسحب صورة هنا أو اختر ملفاً.')}
              invalidTypeMessage={text('Choose a JPG, PNG, or WebP image.', 'اختر صورة بصيغة JPG أو PNG أو WebP.')}
              tooLargeMessage={text('Choose an image smaller than 5 MB.', 'اختر صورة بحجم أقل من 5 ميجابايت.')}
            />
          </div>
          <button className="account-panel__submit" disabled={busy}>{busy ? text('Saving…', 'جارٍ الحفظ…') : text('Save profile', 'حفظ الملف الشخصي')}</button>
        </form>

        <form className="admin-form account-panel account-panel--security" onSubmit={savePassword} aria-busy={busy}>
          <div className="account-panel__header">
            <span className="account-panel__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg></span>
            <div><h2>{text('Change password', 'تغيير كلمة المرور')}</h2><p>{text('Use a strong password that you do not use anywhere else.', 'استخدم كلمة مرور قوية لا تستعملها في أي مكان آخر.')}</p></div>
          </div>
          <div className="account-field account-field--full"><label htmlFor="account-current-password"><span>{text('Current password', 'كلمة المرور الحالية')}</span></label><PasswordInput id="account-current-password" required autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></div>
          <div className="account-field account-field--full"><label htmlFor="account-new-password"><span>{text('New password', 'كلمة المرور الجديدة')}</span></label><PasswordInput id="account-new-password" required minLength={6} autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} /></div>
          <div className="account-field account-field--full"><label htmlFor="account-confirm-password"><span>{text('Confirm new password', 'تأكيد كلمة المرور الجديدة')}</span></label><PasswordInput id="account-confirm-password" required minLength={6} autoComplete="new-password" value={confirmNewPassword} onChange={event => setConfirmNewPassword(event.target.value)} aria-invalid={Boolean(confirmNewPassword && confirmNewPassword !== newPassword)} /></div>
          {confirmNewPassword && confirmNewPassword !== newPassword && <p className="account-panel__inline-error" role="alert">{text('New password and confirmation do not match.', 'كلمة المرور الجديدة وتأكيدها غير متطابقين.')}</p>}
          <p className="account-panel__note">{text('Use at least six characters.', 'استخدم ستة أحرف على الأقل.')}</p>
          <button className="account-panel__submit" disabled={busy || !confirmNewPassword || newPassword !== confirmNewPassword}>{busy ? text('Saving…', 'جارٍ الحفظ…') : text('Change password', 'تغيير كلمة المرور')}</button>
        </form>
      </div>
    </section>
  )
}
