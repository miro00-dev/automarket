import { createCarCard } from '../components/car-card.js'
import { demoCars } from '../data/cars.js'
import { mapDatabaseCar } from '../utils/car-mapper.js'

function matchesFilters(car, filters) {
  const modelQuery = filters.model.trim().toLowerCase()
  const minimumPrice = Number(filters.minPrice) || 0
  const maximumPrice = Number(filters.maxPrice) || Number.POSITIVE_INFINITY
  const selectedYear = Number(filters.year)

  return (
    (!filters.make || car.make === filters.make) &&
    (!modelQuery || car.model.toLowerCase().includes(modelQuery)) &&
    car.price >= minimumPrice &&
    car.price <= maximumPrice &&
    (!filters.fuel || car.fuel === filters.fuel) &&
    (!selectedYear || car.year === selectedYear)
  )
}

export function filterCars(cars, filters) {
  return cars.filter((car) => matchesFilters(car, filters))
}

export async function initializeBrowseCarsPage() {
  const form = document.querySelector('#browse-filters')
  const resultsContainer = document.querySelector('#browse-results')
  const resultsCount = document.querySelector('#results-count')
  const loadingState = document.querySelector('#browse-loading')
  const fallbackNotice = document.querySelector('#browse-fallback-notice')
  const emptyResults = document.querySelector('#empty-results')
  const emptyTitle = document.querySelector('#empty-results-title')
  const emptyCopy = document.querySelector('#empty-results-copy')
  const emptyClearButton = document.querySelector('#empty-clear-filters')

  if (!form || !resultsContainer || !resultsCount || !loadingState || !emptyResults) return

  let inventory = []

  const renderResults = (cars, isUnfiltered = false) => {
    const hasCars = cars.length > 0
    resultsContainer.innerHTML = cars
      .map((car) => createCarCard(car, { showTransmission: true }))
      .join('')
    resultsCount.textContent = `${cars.length} ${cars.length === 1 ? 'car' : 'cars'} found`
    resultsContainer.classList.toggle('d-none', !hasCars)
    emptyResults.classList.toggle('d-none', hasCars)

    if (!hasCars) {
      const hasNoInventory = isUnfiltered && inventory.length === 0
      emptyTitle.textContent = hasNoInventory ? 'No active cars are available' : 'No cars match those filters'
      emptyCopy.textContent = hasNoInventory
        ? 'New listings will appear here as soon as they are published.'
        : 'Try broadening your search or clearing the filters.'
      emptyClearButton.classList.toggle('d-none', hasNoInventory)
    }
  }

  const applyFilters = () => {
    const formData = Object.fromEntries(new FormData(form))
    renderResults(filterCars(inventory, formData))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    applyFilters()
  })
  form.addEventListener('reset', () => window.setTimeout(() => renderResults(inventory, true), 0))
  emptyClearButton?.addEventListener('click', () => form.reset())

  try {
    const { getActiveCars } = await import('../services/cars-service.js')
    const cars = await getActiveCars()
    inventory = cars.map(mapDatabaseCar)
  } catch (error) {
    console.error('Supabase active car listings could not be loaded:', error)
    inventory = demoCars
    fallbackNotice?.classList.remove('d-none')
  } finally {
    loadingState.classList.add('d-none')
    renderResults(inventory, true)
  }
}
