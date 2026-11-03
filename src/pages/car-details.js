import { demoCars } from '../data/cars.js'
import { mileageFormatter, priceFormatter } from '../utils/formatters.js'

export function findCarById(cars, idValue) {
  const id = Number(idValue)
  if (!Number.isInteger(id) || id <= 0) return null
  return cars.find((car) => car.id === id) ?? null
}

function createSpecification(icon, label, value) {
  return `
    <div class="col-6 col-md-4">
      <div class="specification-item">
        <span class="specification-icon"><i class="bi ${icon}" aria-hidden="true"></i></span>
        <span><small>${label}</small><strong>${value}</strong></span>
      </div>
    </div>`
}

function createDetailsMarkup(car) {
  const phoneHref = car.seller.phone.replace(/\s+/g, '')

  return `
    <article>
      <div class="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
        <div>
          <span class="details-year">${car.year} · Demo listing</span>
          <h1 class="display-5 fw-bold mb-0">${car.make} ${car.model}</h1>
        </div>
        <strong class="details-price">${priceFormatter.format(car.price)}</strong>
      </div>
      <div class="row g-4 g-xl-5">
        <div class="col-lg-8">
          <div class="details-image car-tone-${car.tone}">
            <span class="demo-badge">Demo vehicle</span>
            <img src="/src/assets/car-placeholder.svg" alt="Placeholder for ${car.make} ${car.model}" />
          </div>
          <section class="details-panel mt-4" aria-labelledby="specifications-title">
            <span class="section-kicker">At a glance</span>
            <h2 class="h3 mb-4" id="specifications-title">Vehicle specifications</h2>
            <div class="row g-3">
              ${createSpecification('bi-calendar3', 'Year', car.year)}
              ${createSpecification('bi-speedometer2', 'Mileage', `${mileageFormatter.format(car.mileage)} km`)}
              ${createSpecification('bi-fuel-pump', 'Fuel type', car.fuel)}
              ${createSpecification('bi-gear', 'Transmission', car.transmission)}
              ${createSpecification('bi-cpu', 'Engine / power', `${car.engine} · ${car.power}`)}
              ${createSpecification('bi-geo-alt', 'Location', car.location)}
            </div>
          </section>
          <section class="details-panel mt-4" aria-labelledby="description-title">
            <span class="section-kicker">About this car</span>
            <h2 class="h3 mb-3" id="description-title">Vehicle description</h2>
            <p class="details-description mb-0">${car.description}</p>
          </section>
        </div>
        <aside class="col-lg-4">
          <div class="seller-card">
            <span class="section-kicker">Private seller</span>
            <h2 class="h3 mb-4">Seller Information</h2>
            <div class="seller-profile">
              <span class="seller-avatar"><i class="bi bi-person" aria-hidden="true"></i></span>
              <div><strong>${car.seller.name}</strong><span>Demo seller</span></div>
            </div>
            <div class="seller-phone">
              <i class="bi bi-telephone" aria-hidden="true"></i>
              <span><small>Phone number</small><strong>${car.seller.phone}</strong></span>
            </div>
            <a class="btn btn-primary btn-lg w-100" href="tel:${phoneHref}">
              <i class="bi bi-telephone-fill me-2" aria-hidden="true"></i>Contact Seller
            </a>
            <p class="seller-note mb-0">
              <i class="bi bi-shield-check" aria-hidden="true"></i>
              This is demonstration contact information for the course project.
            </p>
          </div>
          <a class="btn btn-outline-secondary w-100 mt-3" href="/pages/cars.html">
            <i class="bi bi-arrow-left me-2" aria-hidden="true"></i>Back to Browse Cars
          </a>
        </aside>
      </div>
    </article>`
}

export function initializeCarDetailsPage() {
  const detailsContainer = document.querySelector('#car-details-content')
  const notFound = document.querySelector('#car-not-found')
  if (!detailsContainer || !notFound) return

  const carId = new URLSearchParams(window.location.search).get('id')
  const car = findCarById(demoCars, carId)

  if (!car) {
    notFound.classList.remove('d-none')
    document.title = 'Car Not Found | AutoMarket'
    return
  }

  detailsContainer.innerHTML = createDetailsMarkup(car)
  const breadcrumbName = document.querySelector('#details-breadcrumb-name')
  if (breadcrumbName) breadcrumbName.textContent = `${car.make} ${car.model}`
  document.title = `${car.make} ${car.model} | AutoMarket`
}
