import { validateCarImages } from '../utils/car-images.js'

const MINIMUM_YEAR = 1950

export function validateListingValues(values, maximumYear = new Date().getFullYear() + 1) {
  const errors = {}
  const year = Number(values.year)
  const price = Number(values.price)

  if (!Number.isInteger(year) || year < MINIMUM_YEAR || year > maximumYear) {
    errors.year = `Enter a whole year between ${MINIMUM_YEAR} and ${maximumYear}.`
  }
  if (!Number.isFinite(price) || price <= 0) {
    errors.price = 'Enter a price greater than €0.'
  }
  if (values.mileage !== '') {
    const mileage = Number(values.mileage)
    if (!Number.isInteger(mileage) || mileage < 0) {
      errors.mileage = 'Enter a whole mileage value of 0 km or more.'
    }
  }
  if (values.powerHp !== '') {
    const powerHp = Number(values.powerHp)
    if (!Number.isFinite(powerHp) || powerHp <= 0) {
      errors.powerHp = 'Enter a power value greater than 0 hp.'
    }
  }

  return errors
}

export function createListingPayload(formData, coverImageUrl = null, ownerId = null) {
  return {
    make: formData.make.trim(),
    model: formData.model.trim(),
    year: Number(formData.year),
    price: Number(formData.price),
    mileage: formData.mileage === '' ? null : Number(formData.mileage),
    fuel_type: formData.fuel,
    transmission: formData.transmission,
    engine: formData.engine.trim(),
    power_hp: formData.powerHp === '' ? null : Number(formData.powerHp),
    location: formData.location.trim(),
    description: formData.description.trim(),
    image_url: coverImageUrl,
    owner_id: ownerId,
  }
}

function redirectToLogin() {
  const returnPath = `${window.location.pathname}${window.location.search}`
  window.location.replace(`/pages/login.html?redirect=${encodeURIComponent(returnPath)}`)
}

function populateListingForm(form, car) {
  const values = {
    make: car.make, model: car.model, year: car.year, price: car.price, mileage: car.mileage,
    fuel: car.fuel_type, transmission: car.transmission, engine: car.engine,
    powerHp: car.power_hp, location: car.location, description: car.description,
  }

  Object.entries(values).forEach(([name, value]) => {
    const field = form.elements.namedItem(name)
    if (field && value != null) field.value = value
  })
}

export async function initializeSellCarPage() {
  const form = document.querySelector('#listing-form')
  if (!form) return

  let session
  try {
    const { getCurrentSession } = await import('../services/auth-service.js')
    session = await getCurrentSession()
  } catch (error) {
    console.error('The session could not be checked before opening Add Car:', error)
  }
  if (!session?.user) return redirectToLogin()

  const editId = new URLSearchParams(window.location.search).get('edit')
  let existingListing = null

  const yearInput = form.querySelector('#listing-year')
  const priceInput = form.querySelector('#listing-price')
  const mileageInput = form.querySelector('#listing-mileage')
  const powerInput = form.querySelector('#listing-power')
  const descriptionInput = form.querySelector('#listing-description')
  const descriptionCount = form.querySelector('#description-count')
  const imageInput = form.querySelector('#vehicle-image')
  const imageName = form.querySelector('#image-file-name')
  const imageError = form.querySelector('#vehicle-image-error')
  const successMessage = form.querySelector('#listing-success')
  const errorMessage = form.querySelector('#listing-error')
  const errorMessageText = form.querySelector('#listing-error-message')
  const submitButton = form.querySelector('button[type="submit"]')
  const publishSpinner = form.querySelector('#publish-spinner')
  const publishIcon = form.querySelector('#publish-icon')
  const publishButtonLabel = form.querySelector('#publish-button-label')
  const maximumYear = new Date().getFullYear() + 1

  if (editId) {
    try {
      const { getOwnedCarById } = await import('../services/cars-service.js')
      existingListing = await getOwnedCarById(editId, session.user.id)
      if (!existingListing) throw new Error('This listing was not found or does not belong to your account.')
      populateListingForm(form, existingListing)
      document.querySelector('.sell-page h1').textContent = 'Edit Your Car'
      document.querySelector('.sell-page .page-hero-copy').textContent = 'Update the details for your AutoMarket listing.'
      publishButtonLabel.textContent = 'Save Changes'
    } catch (error) {
      console.error('The listing could not be loaded for editing:', error)
      errorMessageText.textContent = error.message
      errorMessage.classList.remove('d-none')
      form.querySelectorAll('input, select, textarea, button').forEach((control) => { control.disabled = true })
      return
    }
  }

  yearInput.max = String(maximumYear)

  const setCustomError = (input, message, errorElementId) => {
    input.setCustomValidity(message)
    const errorElement = document.querySelector(`#${errorElementId}`)
    if (errorElement && message) errorElement.textContent = message
  }

  const validateNumbers = () => {
    const errors = validateListingValues({
      year: yearInput.value,
      price: priceInput.value,
      mileage: mileageInput.value,
      powerHp: powerInput.value,
    }, maximumYear)

    setCustomError(yearInput, errors.year ?? '', 'listing-year-error')
    setCustomError(priceInput, errors.price ?? '', 'listing-price-error')
    setCustomError(mileageInput, errors.mileage ?? '', 'listing-mileage-error')
    setCustomError(powerInput, errors.powerHp ?? '', 'listing-power-error')
  }

  const updateDescriptionCount = () => {
    descriptionCount.textContent = `${descriptionInput.value.length} / 1200`
  }

  const validateImage = () => {
    const files = [...imageInput.files]
    const validationError = validateCarImages(files)

    imageInput.setCustomValidity(validationError)
    imageError.textContent = validationError || 'Select up to 10 JPG, PNG, or WebP images, each no larger than 10 MB.'
    imageError.classList.toggle('d-none', !validationError)
    imageName.textContent = files.length
      ? `${files.length} ${files.length === 1 ? 'image' : 'images'} selected — the first will be the cover.`
      : 'Select up to 10 JPG, PNG, or WebP images. The first image will be the cover.'
  }

  const setSubmitting = (isSubmitting) => {
    submitButton.disabled = isSubmitting
    publishSpinner.classList.toggle('d-none', !isSubmitting)
    publishIcon.classList.toggle('d-none', isSubmitting)
    publishButtonLabel.textContent = isSubmitting
      ? (editId ? 'Saving...' : 'Publishing...')
      : (editId ? 'Save Changes' : 'Publish Listing')
  }

  ;[yearInput, priceInput, mileageInput, powerInput].forEach((input) => {
    input.addEventListener('input', validateNumbers)
  })
  descriptionInput.addEventListener('input', updateDescriptionCount)
  imageInput.addEventListener('change', validateImage)

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    event.stopPropagation()
    successMessage.classList.add('d-none')
    errorMessage.classList.add('d-none')
    validateNumbers()
    validateImage()
    form.classList.add('was-validated')

    if (!form.checkValidity()) {
      form.querySelector(':invalid')?.focus()
      return
    }

    const formValues = Object.fromEntries(new FormData(form))
    const selectedImages = [...imageInput.files]
    let uploadedPaths = []
    setSubmitting(true)

    try {
      const { uploadCarImages } = await import('../services/car-images-service.js')
      const { createCarListing, updateOwnedCar } = await import('../services/cars-service.js')
      const uploadResult = await uploadCarImages(selectedImages, session.user.id)
      uploadedPaths = uploadResult.paths
      const coverUrl = uploadResult.coverUrl || existingListing?.image_url || null
      const listing = createListingPayload(formValues, coverUrl, session.user.id)
      if (editId) {
        delete listing.owner_id
        await updateOwnedCar(editId, session.user.id, listing)
      }
      else await createCarListing(listing)
      if (!editId) {
        form.reset()
        form.classList.remove('was-validated')
        validateNumbers()
        validateImage()
        updateDescriptionCount()
      }
      successMessage.querySelector('strong').textContent = editId
        ? 'Your listing was updated successfully.'
        : 'Your listing was submitted for administrator review.'
      successMessage.classList.remove('d-none')
      successMessage.focus()
      if (editId) {
        window.setTimeout(() => {
          window.location.assign(`/pages/my-listings.html?refreshed=${Date.now()}`)
        }, 900)
      }
    } catch (error) {
      if (uploadedPaths.length) {
        try {
          const { removeCarImages } = await import('../services/car-images-service.js')
          await removeCarImages(uploadedPaths)
        } catch (cleanupError) {
          console.error('Failed to clean up images after the listing error:', cleanupError)
        }
      }
      console.error('Supabase failed to publish the car listing:', error)
      errorMessageText.textContent = error.message || 'The listing or its images could not be saved. Check your connection and try again.'
      errorMessage.classList.remove('d-none')
      errorMessage.focus()
    } finally {
      setSubmitting(false)
    }
  })

  updateDescriptionCount()
}
