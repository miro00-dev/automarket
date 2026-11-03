const MINIMUM_YEAR = 1950

export function validateListingValues(values, maximumYear = new Date().getFullYear() + 1) {
  const errors = {}
  const year = Number(values.year)
  const price = Number(values.price)
  const mileage = Number(values.mileage)

  if (!Number.isInteger(year) || year < MINIMUM_YEAR || year > maximumYear) {
    errors.year = `Enter a whole year between ${MINIMUM_YEAR} and ${maximumYear}.`
  }
  if (!Number.isFinite(price) || price <= 0) {
    errors.price = 'Enter a price greater than €0.'
  }
  if (!Number.isFinite(mileage) || mileage < 0 || !Number.isInteger(mileage)) {
    errors.mileage = 'Enter a whole mileage value of 0 km or more.'
  }

  return errors
}

export function initializeSellCarPage() {
  const form = document.querySelector('#listing-form')
  if (!form) return

  const yearInput = form.querySelector('#listing-year')
  const priceInput = form.querySelector('#listing-price')
  const mileageInput = form.querySelector('#listing-mileage')
  const descriptionInput = form.querySelector('#listing-description')
  const descriptionCount = form.querySelector('#description-count')
  const imageInput = form.querySelector('#vehicle-image')
  const imageName = form.querySelector('#image-file-name')
  const imageError = form.querySelector('#vehicle-image-error')
  const successMessage = form.querySelector('#listing-success')
  const maximumYear = new Date().getFullYear() + 1

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
    }, maximumYear)

    setCustomError(yearInput, errors.year ?? '', 'listing-year-error')
    setCustomError(priceInput, errors.price ?? '', 'listing-price-error')
    setCustomError(mileageInput, errors.mileage ?? '', 'listing-mileage-error')
  }

  const updateDescriptionCount = () => {
    descriptionCount.textContent = `${descriptionInput.value.length} / 1200`
  }

  const validateImage = () => {
    const file = imageInput.files[0]
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const isValid = !file || allowedTypes.includes(file.type)

    imageInput.setCustomValidity(isValid ? '' : 'Select a JPG, PNG, or WebP image.')
    imageError.classList.toggle('d-none', isValid)
    imageName.textContent = file && isValid
      ? `${file.name} selected — it will not be uploaded yet.`
      : 'JPG, PNG, or WebP. The image will not be uploaded yet.'
  }

  ;[yearInput, priceInput, mileageInput].forEach((input) => {
    input.addEventListener('input', () => {
      validateNumbers()
      input.classList.remove('is-invalid')
    })
  })
  descriptionInput.addEventListener('input', updateDescriptionCount)
  imageInput.addEventListener('change', validateImage)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    event.stopPropagation()
    successMessage.classList.add('d-none')
    validateNumbers()
    validateImage()
    form.classList.add('was-validated')

    if (!form.checkValidity()) {
      form.querySelector(':invalid')?.focus()
      return
    }

    successMessage.classList.remove('d-none')
    successMessage.focus()
  })

  updateDescriptionCount()
}
