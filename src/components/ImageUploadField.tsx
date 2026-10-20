import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import './ImageUploadField.css'

const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const defaultMaxBytes = 5 * 1024 * 1024

type ImageUploadFieldProps = {
  label: string
  helpText: string
  existingImageUrl?: string
  value?: File
  disabled?: boolean
  onChange: (file?: File) => void
  clearLabel: string
  selectLabel: string
  dropLabel: string
  invalidTypeMessage: string
  tooLargeMessage: string
}

export function ImageUploadField({
  label,
  helpText,
  existingImageUrl,
  value,
  disabled = false,
  onChange,
  clearLabel,
  selectLabel,
  dropLabel,
  invalidTypeMessage,
  tooLargeMessage
}: ImageUploadFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!value) {
      setPreviewUrl(undefined)
      return undefined
    }

    const nextPreviewUrl = URL.createObjectURL(value)
    setPreviewUrl(nextPreviewUrl)
    return () => URL.revokeObjectURL(nextPreviewUrl)
  }, [value])

  const acceptFile = (file?: File) => {
    setError('')
    if (!file) {
      onChange(undefined)
      return
    }

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!supportedTypes.has(file.type) && !supportedExtensions.has(extension)) {
      setError(invalidTypeMessage)
      return
    }

    if (file.size > defaultMaxBytes) {
      setError(tooLargeMessage)
      return
    }

    onChange(file)
  }

  const select = (event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files?.[0])
  const drop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    if (!disabled) acceptFile(event.dataTransfer.files?.[0])
  }
  const clear = () => {
    setError('')
    onChange(undefined)
    if (inputRef.current) inputRef.current.value = ''
  }
  const displayedPreview = previewUrl ?? existingImageUrl

  return <section className="image-upload-field" aria-label={label}>
    <div className="image-upload-field__heading">
      <div>
        <span className="image-upload-field__label">{label}</span>
        <span className="image-upload-field__help">{helpText}</span>
      </div>
      {value && <button type="button" className="image-upload-field__clear" onClick={clear} disabled={disabled}>{clearLabel}</button>}
    </div>
    <label
      htmlFor={inputId}
      className={`image-upload-field__dropzone${dragging ? ' is-dragging' : ''}${disabled ? ' is-disabled' : ''}`}
      onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
    >
      {displayedPreview
        ? <img src={displayedPreview} alt="" className="image-upload-field__preview" />
        : <span className="image-upload-field__placeholder" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg></span>}
      <span className="image-upload-field__copy"><strong>{selectLabel}</strong><span>{dropLabel}</span></span>
      <input ref={inputRef} id={inputId} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={select} />
    </label>
    {value && <p className="image-upload-field__file" aria-live="polite">{value.name}</p>}
    {error && <p className="image-upload-field__error" role="alert">{error}</p>}
  </section>
}
