import { getSafeImageUrl } from '../utils/html.js'
import {
  getProfile,
  getProfilePicturePath,
  removeProfilePicture,
  saveProfile,
  uploadProfilePicture,
  validateProfilePicture,
} from '../services/profile-service.js'

function redirectToLogin() {
  const returnPath = `${window.location.pathname}${window.location.search}`
  window.location.replace(`/pages/login.html?redirect=${encodeURIComponent(returnPath)}`)
}

export async function initializeProfilePage() {
  const form = document.querySelector('#profile-form')
  if (!form) return

  const loading = document.querySelector('#profile-loading')
  const content = document.querySelector('#profile-content')
  const errorMessage = document.querySelector('#profile-error')
  const successMessage = document.querySelector('#profile-success')
  const emailInput = form.querySelector('#profile-email')
  const avatarInput = form.querySelector('#profile-picture')
  const avatarError = form.querySelector('#profile-picture-error')
  const avatarPreview = document.querySelector('#profile-avatar-preview')
  const avatarPlaceholder = document.querySelector('#profile-avatar-placeholder')
  const avatarName = document.querySelector('#profile-picture-name')
  const submitButton = form.querySelector('button[type="submit"]')
  const submitSpinner = form.querySelector('[data-profile-spinner]')
  const submitIcon = form.querySelector('[data-profile-icon]')
  const submitLabel = form.querySelector('[data-profile-label]')
  let currentProfile = null
  let previewObjectUrl = null
  let session

  const showAvatar = (url) => {
    const hasAvatar = Boolean(url)
    avatarPreview.classList.toggle('d-none', !hasAvatar)
    avatarPlaceholder.classList.toggle('d-none', hasAvatar)
    if (hasAvatar) avatarPreview.src = url.startsWith('blob:') ? url : getSafeImageUrl(url)
  }

  const setSubmitting = (isSubmitting) => {
    submitButton.disabled = isSubmitting
    submitSpinner.classList.toggle('d-none', !isSubmitting)
    submitIcon.classList.toggle('d-none', isSubmitting)
    submitLabel.textContent = isSubmitting ? 'Saving...' : 'Save Profile'
  }

  try {
    const { getCurrentSession } = await import('../services/auth-service.js')
    session = await getCurrentSession()
    if (!session?.user) return redirectToLogin()

    emailInput.value = session.user.email || ''
    currentProfile = await getProfile(session.user.id)
    if (currentProfile) {
      form.elements.fullName.value = currentProfile.full_name || ''
      form.elements.phone.value = currentProfile.phone || ''
      form.elements.city.value = currentProfile.city || ''
      showAvatar(currentProfile.avatar_url)
    }
    content.classList.remove('d-none')
  } catch (error) {
    console.error('The AutoMarket profile could not be loaded:', error)
    errorMessage.textContent = 'Your profile could not be loaded. Please check your connection and try again.'
    errorMessage.classList.remove('d-none')
  } finally {
    loading.classList.add('d-none')
  }

  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0]
    const validationError = validateProfilePicture(file)
    avatarInput.setCustomValidity(validationError)
    avatarError.textContent = validationError || 'Choose a JPG, PNG, or WebP image up to 5 MB.'
    avatarError.classList.toggle('d-none', !validationError)
    avatarName.textContent = file ? file.name : 'JPG, PNG, or WebP up to 5 MB.'
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
    previewObjectUrl = file && !validationError ? URL.createObjectURL(file) : null
    showAvatar(previewObjectUrl || currentProfile?.avatar_url)
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    errorMessage.classList.add('d-none')
    successMessage.classList.add('d-none')
    form.classList.add('was-validated')
    if (!form.checkValidity()) return form.querySelector(':invalid')?.focus()

    const file = avatarInput.files[0]
    let uploadedPicture = null
    setSubmitting(true)
    try {
      if (file) uploadedPicture = await uploadProfilePicture(session.user.id, file)
      const oldPicturePath = getProfilePicturePath(currentProfile?.avatar_url)
      currentProfile = await saveProfile(session.user.id, {
        full_name: form.elements.fullName.value.trim() || null,
        phone: form.elements.phone.value.trim() || null,
        city: form.elements.city.value.trim() || null,
        avatar_url: uploadedPicture?.publicUrl || currentProfile?.avatar_url || null,
      })

      if (uploadedPicture && oldPicturePath && oldPicturePath !== uploadedPicture.path) {
        try {
          await removeProfilePicture(oldPicturePath)
        } catch (cleanupError) {
          console.error('The previous profile picture could not be removed:', cleanupError)
        }
      }
      avatarInput.value = ''
      avatarName.textContent = 'JPG, PNG, or WebP up to 5 MB.'
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
      previewObjectUrl = null
      showAvatar(currentProfile.avatar_url)
      successMessage.classList.remove('d-none')
      successMessage.focus()
    } catch (error) {
      if (uploadedPicture?.path) {
        try { await removeProfilePicture(uploadedPicture.path) } catch (cleanupError) {
          console.error('The unused profile picture could not be removed:', cleanupError)
        }
      }
      console.error('The AutoMarket profile could not be saved:', error)
      errorMessage.textContent = error.message || 'Your profile could not be saved. Please try again.'
      errorMessage.classList.remove('d-none')
      errorMessage.focus()
    } finally {
      setSubmitting(false)
    }
  })
}
