import { mileageFormatter, priceFormatter } from '../utils/formatters.js'

export function createCarCard(car, { showTransmission = false } = {}) {
  const transmission = showTransmission
    ? `<span><i class="bi bi-gear" aria-hidden="true"></i>${car.transmission}</span>`
    : ''

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
            <strong class="car-price">${priceFormatter.format(car.price)}</strong>
          </div>
          <div class="car-meta d-flex flex-wrap gap-3 mb-4">
            <span><i class="bi bi-speedometer2" aria-hidden="true"></i>${mileageFormatter.format(car.mileage)} km</span>
            <span><i class="bi bi-fuel-pump" aria-hidden="true"></i>${car.fuel}</span>
            ${transmission}
          </div>
          <a class="btn btn-outline-dark mt-auto" href="/pages/car-details.html?id=${car.id}">View Details</a>
        </div>
      </article>
    </div>`
}
