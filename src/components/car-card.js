import { mileageFormatter, priceFormatter } from '../utils/formatters.js'
import { escapeHtml, getSafeImageUrl } from '../utils/html.js'

export function createCarCard(car, { showTransmission = false, actions = '' } = {}) {
  const make = escapeHtml(car.make)
  const model = escapeHtml(car.model)
  const fuel = escapeHtml(car.fuel)
  const transmissionValue = escapeHtml(car.transmission)
  const imageUrl = escapeHtml(getSafeImageUrl(car.imageUrl))
  const detailsUrl = `/pages/car-details.html?id=${encodeURIComponent(car.id)}`
  const mileage = car.mileage == null ? 'Not specified' : `${mileageFormatter.format(car.mileage)} km`
  const transmission = showTransmission
    ? `<span><i class="bi bi-gear" aria-hidden="true"></i>${transmissionValue}</span>`
    : ''
  const favoriteButton = car.isDemo === false
    ? `<button class="favorite-button" type="button" data-favorite-car-id="${escapeHtml(car.id)}" aria-label="Add ${make} ${model} to favorites" aria-pressed="false" title="Add to favorites">
        <i class="bi bi-heart" aria-hidden="true"></i>
      </button>`
    : ''
  const statusLabels = { active: 'ACTIVE LISTING', pending: 'PENDING APPROVAL', rejected: 'REJECTED' }
  const listingBadge = car.isDemo === false ? (statusLabels[car.status] || 'Listing') : 'Demo listing'

  return `
    <div class="col-md-6 col-xl-4">
      <article class="card car-card h-100">
        <div class="car-card-image car-tone-${car.tone}">
          <span class="demo-badge">${listingBadge}</span>
          ${favoriteButton}
          <img class="${car.imageUrl ? 'uploaded-car-image' : ''}" src="${imageUrl}" alt="${make} ${model}" />
        </div>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <span class="car-year">${car.year}</span>
              <h3 class="h5 card-title mb-0">${make} ${model}</h3>
            </div>
            <strong class="car-price">${priceFormatter.format(car.price)}</strong>
          </div>
          <div class="car-meta d-flex flex-wrap gap-3 mb-4">
            <span><i class="bi bi-speedometer2" aria-hidden="true"></i>${mileage}</span>
            <span><i class="bi bi-fuel-pump" aria-hidden="true"></i>${fuel}</span>
            ${transmission}
          </div>
          <a class="btn btn-outline-dark mt-auto" href="${detailsUrl}">View Details</a>
          ${actions ? `<div class="d-flex gap-2 mt-2">${actions}</div>` : ''}
        </div>
      </article>
    </div>`
}
