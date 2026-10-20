import { useEffect, useMemo, useState, type FormEvent } from "react"
import { categoryService } from "../api/services"
import type { AdminCourse, Category } from "../types/api"
import { ImageUploadField } from "./ImageUploadField"
import { useLanguage } from "../context/LanguageContext"

export type CourseFormValues = {
  title: string
  description: string
  shortDescription: string
  basicPrice: string
  fullAccessPrice: string
  level: string
  categoryIds: string[]
  tags: string
  status: string
  thumbnail?: File
  trailer?: File
}

const blank = (): CourseFormValues => ({
  title: "",
  description: "",
  shortDescription: "",
  basicPrice: "0",
  fullAccessPrice: "0",
  level: "beginner",
  categoryIds: [],
  tags: "",
  status: "draft"
})

const categoriesFromCourse = (course?: AdminCourse) => {
  if (!course) return []
  return course.categories?.length ? course.categories : course.category ? [course.category] : []
}

export const valuesFromCourse = (course?: AdminCourse): CourseFormValues => course
  ? {
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription ?? "",
      basicPrice: String(course.basicPrice ?? course.price),
      fullAccessPrice: String(course.fullAccessPrice ?? course.price),
      level: course.level,
      categoryIds: categoriesFromCourse(course).map(category => category.id),
      tags: course.tags.join(", "),
      status: course.status
    }
  : blank()

export const courseFormData = (value: CourseFormValues, isCreate: boolean) => {
  const form = new FormData()
  form.append("Title", value.title.trim())
  form.append("Description", value.description.trim())
  form.append("ShortDescription", value.shortDescription.trim())
  // Price is retained as the basic-plan alias for older API consumers.
  form.append("Price", value.basicPrice)
  form.append("BasicPrice", value.basicPrice)
  form.append("FullAccessPrice", value.fullAccessPrice)
  form.append("Level", value.level)
  value.categoryIds.forEach(categoryId => form.append("CategoryIds", categoryId))
  // Explicitly supports clearing every selected category while preserving
  // compatibility for older single-CategoryId clients.
  form.append("ReplaceCategories", "true")
  value.tags.split(",").map(tag => tag.trim()).filter(Boolean).forEach(tag => form.append("Tags", tag))
  if (value.thumbnail) form.append("Thumbnail", value.thumbnail)
  if (value.trailer) form.append("Trailer", value.trailer)
  if (!isCreate) form.append("Status", value.status)
  return form
}

export function CourseForm({ course, busy, submitLabel, onSubmit }: {
  course?: AdminCourse
  busy: boolean
  submitLabel: string
  onSubmit: (values: CourseFormValues) => Promise<void>
}) {
  const { language } = useLanguage()
  const text = (english: string, arabic: string) => language === "ar" ? arabic : english
  const [values, setValues] = useState<CourseFormValues>(() => valuesFromCourse(course))
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState("")

  useEffect(() => { setValues(valuesFromCourse(course)) }, [course])
  useEffect(() => {
    categoryService.list().then(setCategories).catch(() => {
      setError("Categories could not be loaded. You can still save the course without changing its categories.")
    })
  }, [])

  const categoryOptions = useMemo(() => {
    const selectedIds = new Set(values.categoryIds)
    const currentCategories = categoriesFromCourse(course)
    const options = categories
      .filter(category => category.isActive || selectedIds.has(category.id))
      .map(category => ({ ...category }))

    // Deleted categories are retained as removable legacy assignments instead of
    // disappearing and being silently lost during an unrelated course edit.
    for (const category of currentCategories) {
      if (!options.some(option => option.id === category.id)) {
        options.push({ ...category, isActive: false })
      }
    }

    return options
  }, [categories, course, values.categoryIds])

  const selectedCategories = categoryOptions.filter(category => values.categoryIds.includes(category.id))
  const update = (patch: Partial<CourseFormValues>) => {
    setValues(current => ({ ...current, ...patch }))
  }

  const toggleCategory = (categoryId: string) => {
    setValues(current => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter(id => id !== categoryId)
        : [...current.categoryIds, categoryId]
    }))
  }

  const validPrice = (value: string) => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) >= 0
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!values.title.trim() || !values.description.trim()) {
      setError("Title and description are required.")
      return
    }
    if (values.shortDescription.trim().length > 300) {
      setError("Short description must be 300 characters or fewer.")
      return
    }
    if (!validPrice(values.basicPrice) || !validPrice(values.fullAccessPrice)) {
      setError("Both plan prices must be non-negative amounts with up to two decimal places.")
      return
    }
    if (Number(values.fullAccessPrice) < Number(values.basicPrice)) {
      setError("Full access price must be greater than or equal to the sequential price.")
      return
    }
    setError("")
    await onSubmit(values)
  }

  return <form className="admin-form" onSubmit={submit} noValidate>
    <div className="form-grid">
      <label>Course title<input value={values.title} maxLength={150} required onChange={event => update({ title: event.target.value })} /></label>
      <label>Short description <span className="field-note">Shown on course cards and as the course summary.</span><input value={values.shortDescription} maxLength={300} onChange={event => update({ shortDescription: event.target.value })} /></label>
      <label className="wide">Description<textarea value={values.description} maxLength={5000} required rows={7} onChange={event => update({ description: event.target.value })} /></label>
      <label>Sequential / Basic price (USD)<input type="number" min="0" step="0.01" value={values.basicPrice} required onChange={event => update({ basicPrice: event.target.value })} /><span className="field-note">Learners unlock one lesson after completing the previous one.</span></label>
      <label>Full access price (USD)<input type="number" min="0" step="0.01" value={values.fullAccessPrice} required onChange={event => update({ fullAccessPrice: event.target.value })} /><span className="field-note">Learners can open every lesson immediately.</span></label>
      <label>Level<select value={values.level} onChange={event => update({ level: event.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
      {course ? <label>Status<select value={values.status} onChange={event => update({ status: event.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label> : null}
      <fieldset className="course-category-picker wide">
        <legend>Categories</legend>
        <p className="field-note">Select every category that should appear with this course. You can remove any selection below.</p>
        {categoryOptions.length === 0 ? <p className="field-note">No categories are available.</p> : <div className="course-category-options">
          {categoryOptions.map(category => <label className="course-category-option" key={category.id}>
            <input type="checkbox" checked={values.categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} />
            <span>{category.name}</span>
            {!category.isActive && <small>Unavailable</small>}
          </label>)}
        </div>}
        {selectedCategories.length > 0 && <div className="selected-category-list" aria-label="Selected categories">
          {selectedCategories.map(category => <span key={category.id}>{category.name}<button type="button" className="text-button" onClick={() => toggleCategory(category.id)} aria-label={"Remove " + category.name}>Remove</button></span>)}
        </div>}
      </fieldset>
      <label>Tags <span className="field-note">comma separated</span><input value={values.tags} onChange={event => update({ tags: event.target.value })} /></label>
      <div className="wide">
        <ImageUploadField
          label={text("Course thumbnail", "صورة مصغرة للدورة")}
          helpText={text("JPG, PNG, or WebP. Up to 5 MB.", "JPG أو PNG أو WebP. حتى 5 ميجابايت.")}
          existingImageUrl={course?.thumbnailUrl}
          value={values.thumbnail}
          disabled={busy}
          onChange={thumbnail => update({ thumbnail })}
          clearLabel={text("Cancel selection", "إلغاء الاختيار")}
          selectLabel={text("Choose a course thumbnail", "اختر صورة مصغرة للدورة")}
          dropLabel={text("Drop an image here, or choose a file.", "اسحب صورة هنا أو اختر ملفاً.")}
          invalidTypeMessage={text("Choose a JPG, PNG, or WebP image.", "اختر صورة بصيغة JPG أو PNG أو WebP.")}
          tooLargeMessage={text("Choose an image smaller than 5 MB.", "اختر صورة بحجم أقل من 5 ميجابايت.")}
        />
      </div>
      <label>Trailer <span className="field-note">MP4, WebM, or MOV; 100 MB max</span><input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={event => update({ trailer: event.target.files?.[0] })} /></label>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button disabled={busy}>{busy ? "Saving…" : submitLabel}</button>
  </form>
}
