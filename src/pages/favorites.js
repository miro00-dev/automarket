import { createCarCard } from '../components/car-card.js'
import { mapDatabaseCar } from '../utils/car-mapper.js'

function redirectToLogin() {
  const returnPath = `${window.location.pathname}${window.location.search}`
  window.location.replace(`/pages/login.html?redirect=${encodeURIComponent(returnPath)}`)
}

export async function initializeFavoritesPage() {
  const results = document.querySelector('#favorites-results')
  if (!results) return
  const loading = document.querySelector('#favorites-loading')
  const empty = document.querySelector('#favorites-empty')
  const errorMessage = document.querySelector('#favorites-error')
  let session

  try {
    const { getCurrentSession } = await import('../services/auth-service.js')
    session = await getCurrentSession()
  } catch (error) {
    console.error('The session could not be checked for Favorites:', error)
  }
  if (!session?.user) return redirectToLogin()

  const updateEmptyState = () => {
    const hasFavorites = results.children.length > 0
    results.classList.toggle('d-none', !hasFavorites)
    empty.classList.toggle('d-none', hasFavorites)
  }

  try {
    const { getFavoriteCars } = await import('../services/favorites-service.js')
    const cars = (await getFavoriteCars(session.user.id)).map(mapDatabaseCar)
    results.innerHTML = cars.map((car) => createCarCard(car, { showTransmission: true })).join('')
    updateEmptyState()
  } catch (error) {
    console.error('Supabase failed to load favorite cars:', error)
    errorMessage.textContent = 'Your favorite cars could not be loaded. Please check your connection and try again.'
    errorMessage.classList.remove('d-none')
  } finally {
    loading.classList.add('d-none')
  }

  document.addEventListener('automarket:favorite-change', (event) => {
    if (event.detail.isFavorite) return
    results.querySelector(`[data-favorite-car-id="${CSS.escape(event.detail.carId)}"]`)?.closest('.col-md-6')?.remove()
    updateEmptyState()
  })
}
