const featuredCars = [
  { make: 'BMW', model: '3 Series', year: 2021, mileage: '48,000 km', fuel: 'Diesel', price: '€32,900', tone: 'blue' },
  { make: 'Mercedes-Benz', model: 'C-Class', year: 2020, mileage: '55,200 km', fuel: 'Petrol', price: '€34,500', tone: 'silver' },
  { make: 'Audi', model: 'A4 S line', year: 2022, mileage: '29,800 km', fuel: 'Diesel', price: '€39,800', tone: 'red' },
  { make: 'Toyota', model: 'RAV4', year: 2021, mileage: '42,100 km', fuel: 'Hybrid', price: '€36,200', tone: 'green' },
  { make: 'Volkswagen', model: 'Golf', year: 2020, mileage: '61,400 km', fuel: 'Petrol', price: '€22,750', tone: 'gold' },
  { make: 'Ford', model: 'Mustang Mach-E', year: 2022, mileage: '25,600 km', fuel: 'Electric', price: '€44,900', tone: 'violet' },
]

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

function createCarCard(car) {
  return `
    <div class="col-md-6 col-xl-4">
      <article class="card car-card h-100">
        <div class="car-card-image car-tone-${car.tone}">
          <span class="demo-badge">Demo listing</span>
          <button class="favorite-button" type="button" aria-label="Add ${car.make} ${car.model} to favorites">
            <i class="bi bi-heart" aria-hidden="true"></i>
          </button>
          <img src="/src/assets/car-placeholder.svg" alt="Placeholder for ${car.make} ${car.model}" />
        </div>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <span class="car-year">${car.year}</span>
              <h3 class="h5 card-title mb-0">${car.make} ${car.model}</h3>
            </div>
            <strong class="car-price">${car.price}</strong>
          </div>
          <div class="car-meta d-flex gap-3 mb-4">
            <span><i class="bi bi-speedometer2" aria-hidden="true"></i>${car.mileage}</span>
            <span><i class="bi bi-fuel-pump" aria-hidden="true"></i>${car.fuel}</span>
          </div>
          <a class="btn btn-outline-dark mt-auto" href="/pages/car-details.html">View Details</a>
        </div>
      </article>
    </div>`
}

export function initializeHomePage() {
  const carsContainer = document.querySelector('#featured-cars')
  const makesContainer = document.querySelector('#popular-makes')
  const benefitsContainer = document.querySelector('#benefits')
  const searchForm = document.querySelector('#car-search-form')

  if (!carsContainer || !makesContainer || !benefitsContainer) return

  carsContainer.innerHTML = featuredCars.map(createCarCard).join('')
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
