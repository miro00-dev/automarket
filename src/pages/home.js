import { createCarCard } from '../components/car-card.js'
import { demoCars } from '../data/cars.js'

const popularMakes = [
  { name: 'BMW', monogram: 'BMW' },
  { name: 'Mercedes-Benz', monogram: 'MB' },
  { name: 'Audi', monogram: 'AUDI' },
  { name: 'Volkswagen', monogram: 'VW' },
  { name: 'Toyota', monogram: 'T' },
  { name: 'Ford', monogram: 'FORD' },
]

const benefits = [
  { icon: 'bi-search-heart', title: 'Easy discovery', copy: 'Explore clear vehicle details and compare options without the clutter.' },
  { icon: 'bi-card-checklist', title: 'Useful details', copy: 'See the year, mileage, fuel type, and price at a glance.' },
  { icon: 'bi-lightning-charge', title: 'Simple listings', copy: 'A focused flow makes listing your car feel quick and approachable.' },
]

export function initializeHomePage() {
  const carsContainer = document.querySelector('#featured-cars')
  const makesContainer = document.querySelector('#popular-makes')
  const benefitsContainer = document.querySelector('#benefits')
  const searchForm = document.querySelector('#car-search-form')

  if (!carsContainer || !makesContainer || !benefitsContainer) return

  carsContainer.innerHTML = demoCars.slice(0, 6).map((car) => createCarCard(car)).join('')
  makesContainer.innerHTML = popularMakes
    .map(
      ({ name, monogram }) => `
        <div class="col">
          <a class="make-card" href="/pages/cars.html" aria-label="Browse ${name} cars">
            <span class="make-monogram">${monogram}</span>
            <strong>${name}</strong>
          </a>
        </div>`,
    )
    .join('')
  benefitsContainer.innerHTML = benefits
    .map(
      ({ icon, title, copy }) => `
        <div class="col-md-4">
          <article class="benefit-card h-100">
            <span class="benefit-icon"><i class="bi ${icon}" aria-hidden="true"></i></span>
            <h3 class="h5">${title}</h3>
            <p class="mb-0">${copy}</p>
          </article>
        </div>`,
    )
    .join('')

  searchForm?.addEventListener('submit', (event) => event.preventDefault())
}
