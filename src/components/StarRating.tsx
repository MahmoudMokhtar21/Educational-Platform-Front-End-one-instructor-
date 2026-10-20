import { useId, useState } from 'react'

const ratings = [1, 2, 3, 4, 5] as const

type StarRatingInputProps = {
  value: number
  onChange: (rating: number) => void
  label: string
  name?: string
  disabled?: boolean
  starLabel?: (rating: number) => string
}

type StarRatingDisplayProps = {
  value: number
  label: string
  className?: string
}

function normalizeRating(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)))
}

function StarIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
    <path d="m12 2.75 2.82 5.72 6.31.92-4.57 4.46 1.08 6.29L12 17.18l-5.64 2.96 1.08-6.29-4.57-4.46 6.31-.92L12 2.75Z" />
  </svg>
}

export function StarRatingInput({
  value,
  onChange,
  label,
  name,
  disabled = false,
  starLabel = (rating) => `${rating} of 5 stars`,
}: StarRatingInputProps) {
  const generatedName = useId()
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const selectedRating = normalizeRating(value)
  const displayedRating = hoveredRating ?? selectedRating

  return <fieldset className="star-rating-input" disabled={disabled} onMouseLeave={() => setHoveredRating(null)}>
    <legend className="star-rating-input__legend">{label}</legend>
    <div className="star-rating-input__options" dir="ltr">
      {ratings.map((rating) => <label
        className="star-rating-input__option"
        data-active={rating <= displayedRating ? 'true' : 'false'}
        key={rating}
        onMouseEnter={() => setHoveredRating(rating)}
      >
        <input
          checked={rating === selectedRating}
          className="star-rating-input__input"
          name={name ?? generatedName}
          onBlur={() => setHoveredRating(null)}
          onChange={() => onChange(rating)}
          onFocus={() => setHoveredRating(rating)}
          type="radio"
          value={rating}
          aria-label={starLabel(rating)}
        />
        <span className="star-rating-input__icon"><StarIcon /></span>
      </label>)}
    </div>
  </fieldset>
}

export function StarRatingDisplay({ value, label, className = '' }: StarRatingDisplayProps) {
  const selectedRating = normalizeRating(value)

  return <span className={`star-rating-display ${className}`.trim()} role="img" aria-label={label} dir="ltr">
    {ratings.map((rating) => <span
      aria-hidden="true"
      className={rating <= selectedRating ? 'star-rating-display__star is-active' : 'star-rating-display__star'}
      key={rating}
    ><StarIcon /></span>)}
  </span>
}
