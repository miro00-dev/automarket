import { createCarCard } from '../components/car-card.js'
import { mapDatabaseCar } from '../utils/car-mapper.js'

function redirectToLogin() {
  const returnPath = `${window.location.pathname}${window.location.search}`
  window.location.replace(`/pages/login.html?redirect=${encodeURIComponent(returnPath)}`)
}

function renderOwnedCard(car) {
  return createCarCard(car, {
    showTransmission: true,
    actions: `<a class="btn btn-outline-primary flex-fill" href="/pages/add-car.html?edit=${encodeURIComponent(car.id)}"><i class="bi bi-pencil me-2" aria-hidden="true"></i>Edit</a><button class="btn btn-outline-danger flex-fill" type="button" data-delete-listing="${car.id}"><i class="bi bi-trash me-2" aria-hidden="true"></i>Delete</button>`,
  })
}

export async function initializeMyListingsPage() {
  const results = document.querySelector('#my-listings-results')
  if (!results) return
  const loading = document.querySelector('#my-listings-loading')
  const empty = document.querySelector('#my-listings-empty')
  const errorMessage = document.querySelector('#my-listings-error')
  let session

  try {
    const { getCurrentSession } = await import('../services/auth-service.js')
    session = await getCurrentSession()
  } catch (error) {
    console.error('The session could not be checked for My Listings:', error)
  }
  if (!session?.user) return redirectToLogin()

  const loadListings = async () => {
    errorMessage.classList.add('d-none')
    const { getMyCars } = await import('../services/cars-service.js')
    const cars = (await getMyCars(session.user.id)).map(mapDatabaseCar)
    results.innerHTML = cars.map(renderOwnedCard).join('')
    results.classList.toggle('d-none', !cars.length)
    empty.classList.toggle('d-none', Boolean(cars.length))
  }

  try {
    await loadListings()
  } catch (error) {
    console.error('Supabase failed to load the current user listings:', error)
    errorMessage.textContent = 'Your listings could not be loaded. Please check your connection and try again.'
    errorMessage.classList.remove('d-none')
  } finally {
    loading.classList.add('d-none')
  }

  window.addEventListener('pageshow', async (event) => {
    if (!event.persisted) return
    try {
      await loadListings()
    } catch (error) {
      console.error('Supabase failed to refresh My Listings:', error)
      errorMessage.textContent = 'Your listings could not be refreshed. Please reload the page and try again.'
      errorMessage.classList.remove('d-none')
    }
  })

  results.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-listing]')
    if (!button) return
    const listingId = button.dataset.deleteListing
    if (!window.confirm('Delete this listing permanently? This action cannot be undone.')) return

    button.disabled = true
    const originalContent = button.innerHTML
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Deleting...'
    errorMessage.classList.add('d-none')
    try {
      const { deleteOwnedCar } = await import('../services/cars-service.js')
      await deleteOwnedCar(listingId, session.user.id)
      button.closest('.col-md-6')?.remove()
      if (!results.children.length) {
        results.classList.add('d-none')
        empty.classList.remove('d-none')
      }
    } catch (error) {
      console.error('Supabase failed to delete the listing:', error)
      errorMessage.textContent = error.message || 'The listing could not be deleted. Please try again.'
      errorMessage.classList.remove('d-none')
      errorMessage.focus()
      button.disabled = false
      button.innerHTML = originalContent
    }
  })
}
