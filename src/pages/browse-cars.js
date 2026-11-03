import { createCarCard } from '../components/car-card.js'
import { demoCars } from '../data/cars.js'

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

export function initializeBrowseCarsPage() {
  const form = document.querySelector('#browse-filters')
  const resultsContainer = document.querySelector('#browse-results')
  const resultsCount = document.querySelector('#results-count')
  const emptyResults = document.querySelector('#empty-results')
  const emptyClearButton = document.querySelector('#empty-clear-filters')

  if (!form || !resultsContainer || !resultsCount || !emptyResults) return

  const renderResults = (cars) => {
    resultsContainer.innerHTML = cars
      .map((car) => createCarCard(car, { showTransmission: true }))
      .join('')
    resultsCount.textContent = `${cars.length} ${cars.length === 1 ? 'car' : 'cars'} found`
    resultsContainer.classList.toggle('d-none', cars.length === 0)
    emptyResults.classList.toggle('d-none', cars.length !== 0)
  }

  const applyFilters = () => {
    const formData = Object.fromEntries(new FormData(form))
    renderResults(filterCars(demoCars, formData))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    applyFilters()
  })
  form.addEventListener('reset', () => window.setTimeout(() => renderResults(demoCars), 0))
  emptyClearButton?.addEventListener('click', () => form.reset())

  renderResults(demoCars)
}
