import { demoCars } from '../data/cars.js'
import { mapDatabaseCar } from '../utils/car-mapper.js'
import { mileageFormatter, priceFormatter } from '../utils/formatters.js'
import { escapeHtml, getSafeImageUrl } from '../utils/html.js'

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
        <span><small>${label}</small><strong>${escapeHtml(value)}</strong></span>
      </div>
    </div>`
}

function createSellerMarkup(seller) {
  const hasSellerInformation = seller && [seller.full_name, seller.phone, seller.city, seller.avatar_url].some(Boolean)
  if (!hasSellerInformation) {
    return `
      <div class="seller-card">
        <span class="section-kicker">Contact seller</span>
        <h2 class="h3 mb-4">Seller information</h2>
        <div class="seller-profile">
          <span class="seller-avatar"><i class="bi bi-person" aria-hidden="true"></i></span>
          <div><strong>Seller information unavailable</strong><span>This seller has not completed their profile.</span></div>
        </div>
        <p class="seller-note mb-0">
          <i class="bi bi-info-circle" aria-hidden="true"></i>
          No public contact information is available for this listing.
        </p>
      </div>`
  }

  const sellerName = escapeHtml(seller.full_name || 'AutoMarket Seller')
  const sellerCity = escapeHtml(seller.city || 'City not provided')
  const sellerPhone = escapeHtml(seller.phone || '')
  const phoneHref = seller.phone?.replace(/[^+\d]/g, '') || ''
  const avatarUrl = seller.avatar_url ? escapeHtml(getSafeImageUrl(seller.avatar_url)) : null
  const avatar = avatarUrl
    ? `<span class="seller-avatar seller-avatar-image"><img src="${avatarUrl}" alt="${sellerName}'s profile picture" /></span>`
    : '<span class="seller-avatar"><i class="bi bi-person" aria-hidden="true"></i></span>'

  return `
    <div class="seller-card">
      <span class="section-kicker">Contact seller</span>
      <h2 class="h3 mb-4">Seller information</h2>
      <div class="seller-profile">
        ${avatar}
        <div><strong>${sellerName}</strong><span><i class="bi bi-geo-alt me-1" aria-hidden="true"></i>${sellerCity}</span></div>
      </div>
      ${phoneHref ? `
        <div class="seller-phone d-none" id="seller-phone" aria-live="polite">
          <i class="bi bi-telephone" aria-hidden="true"></i><span><small>Phone number</small><strong>${sellerPhone}</strong></span>
        </div>
        <button class="btn btn-primary btn-lg w-100 mt-4" id="show-seller-phone" type="button">
          <i class="bi bi-eye me-2" aria-hidden="true"></i>Show Phone Number
        </button>
        <a class="btn btn-success btn-lg w-100 mt-2 d-none" id="call-seller" href="tel:${escapeHtml(phoneHref)}">
          <i class="bi bi-telephone-fill me-2" aria-hidden="true"></i>Call Seller
        </a>` : `
        <div class="seller-phone"><i class="bi bi-telephone-x" aria-hidden="true"></i><span><small>Phone number</small><strong>Not provided</strong></span></div>`}
      <p class="seller-note mb-0">
        <i class="bi bi-shield-check" aria-hidden="true"></i>
        Contact details are provided by the seller. AutoMarket never displays their email address.
      </p>
    </div>`
}

function initializeSellerContact(container) {
  const showButton = container.querySelector('#show-seller-phone')
  if (!showButton) return
  showButton.addEventListener('click', () => {
    container.querySelector('#seller-phone')?.classList.remove('d-none')
    container.querySelector('#call-seller')?.classList.remove('d-none')
    showButton.classList.add('d-none')
  }, { once: true })
}

function createGalleryMarkup(car, imageUrls) {
  const make = escapeHtml(car.make)
  const model = escapeHtml(car.model)
  const safeImageUrls = (imageUrls.length ? imageUrls : [null]).map(getSafeImageUrl)
  const mainImageUrl = escapeHtml(safeImageUrls[0])

  return `
    <div class="details-gallery">
      <div class="details-image car-tone-${car.tone}">
        <span class="demo-badge">${car.isDemo === false ? 'Active vehicle' : 'Demo vehicle'}</span>
        <img class="${car.imageUrl ? 'uploaded-car-image' : ''}" id="gallery-main-image" src="${mainImageUrl}" alt="${make} ${model}" />
      </div>
      ${safeImageUrls.length > 1 ? `
        <div class="gallery-thumbnails" aria-label="Vehicle image gallery">
          ${safeImageUrls.map((imageUrl, index) => `
            <button class="gallery-thumbnail${index === 0 ? ' active' : ''}" type="button" data-gallery-index="${index}" aria-label="Show vehicle image ${index + 1}">
              <img src="${escapeHtml(imageUrl)}" alt="" />
            </button>`).join('')}
        </div>` : ''}
    </div>`
}

function initializeGallery(container, car, imageUrls) {
  const safeImageUrls = (imageUrls.length ? imageUrls : [null]).map(getSafeImageUrl)
  const mainImage = container.querySelector('#gallery-main-image')
  const thumbnails = [...container.querySelectorAll('.gallery-thumbnail')]

  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener('click', () => {
      const index = Number(thumbnail.dataset.galleryIndex)
      mainImage.src = safeImageUrls[index]
      mainImage.alt = `${car.make} ${car.model} — image ${index + 1}`
      thumbnails.forEach((item) => item.classList.toggle('active', item === thumbnail))
    })
  })
}

function createDetailsMarkup(car, imageUrls, seller) {
  const make = escapeHtml(car.make)
  const model = escapeHtml(car.model)
  const listingLabel = car.isDemo === false ? 'Active listing' : 'Demo listing'
  const mileage = car.mileage == null ? 'Not specified' : `${mileageFormatter.format(car.mileage)} km`

  return `
    <article>
      <div class="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
        <div>
          <span class="details-year">${car.year} · ${listingLabel}</span>
          <h1 class="display-5 fw-bold mb-0">${make} ${model}</h1>
        </div>
        <strong class="details-price">${priceFormatter.format(car.price)}</strong>
      </div>
      <div class="row g-4 g-xl-5">
        <div class="col-lg-8">
          ${createGalleryMarkup(car, imageUrls)}
          <section class="details-panel mt-4" aria-labelledby="specifications-title">
            <span class="section-kicker">At a glance</span>
            <h2 class="h3 mb-4" id="specifications-title">Vehicle specifications</h2>
            <div class="row g-3">
              ${createSpecification('bi-calendar3', 'Year', car.year)}
              ${createSpecification('bi-speedometer2', 'Mileage', mileage)}
              ${createSpecification('bi-fuel-pump', 'Fuel type', car.fuel)}
              ${createSpecification('bi-gear', 'Transmission', car.transmission)}
              ${createSpecification('bi-cpu', 'Engine / power', `${car.engine} · ${car.power}`)}
              ${createSpecification('bi-geo-alt', 'Location', car.location)}
            </div>
          </section>
          <section class="details-panel mt-4" aria-labelledby="description-title">
            <span class="section-kicker">About this car</span>
            <h2 class="h3 mb-3" id="description-title">Vehicle description</h2>
            <p class="details-description mb-0">${escapeHtml(car.description)}</p>
          </section>
        </div>
        <aside class="col-lg-4">
          ${createSellerMarkup(seller)}
          <a class="btn btn-outline-secondary w-100 mt-3" href="/pages/cars.html">
            <i class="bi bi-arrow-left me-2" aria-hidden="true"></i>Back to Browse Cars
          </a>
        </aside>
      </div>
    </article>`
}

export async function initializeCarDetailsPage() {
  const detailsContainer = document.querySelector('#car-details-content')
  const loadingState = document.querySelector('#details-loading')
  const fallbackNotice = document.querySelector('#details-fallback-notice')
  const notFound = document.querySelector('#car-not-found')
  if (!detailsContainer || !loadingState || !notFound) return

  const carId = new URLSearchParams(window.location.search).get('id')?.trim()
  let car = null
  let imageUrls = []
  let seller = null

  if (carId && /^\d+$/.test(carId)) {
    try {
      const { getActiveCarById } = await import('../services/cars-service.js')
      const databaseCar = await getActiveCarById(carId)
      car = databaseCar ? mapDatabaseCar(databaseCar) : null
    } catch (error) {
      console.error('Supabase car details could not be loaded:', error)
      car = findCarById(demoCars, carId)
      if (car) fallbackNotice?.classList.remove('d-none')
    }
  }

  loadingState.classList.add('d-none')

  if (!car) {
    notFound.classList.remove('d-none')
    document.title = 'Car Not Found | AutoMarket'
    return
  }

  if (car.isDemo === false && car.imageUrl) {
    try {
      const { getCarImageUrls } = await import('../services/car-images-service.js')
      imageUrls = await getCarImageUrls(car.imageUrl)
    } catch (error) {
      console.error('Additional car images could not be loaded:', error)
      imageUrls = [car.imageUrl]
    }
  } else if (car.imageUrl) {
    imageUrls = [car.imageUrl]
  }

  if (car.isDemo === false && car.ownerId) {
    try {
      const { getSellerProfile } = await import('../services/seller-service.js')
      seller = await getSellerProfile(car.ownerId)
    } catch (error) {
      console.error('Seller information could not be loaded:', error)
    }
  }

  detailsContainer.innerHTML = createDetailsMarkup(car, imageUrls, seller)
  initializeGallery(detailsContainer, car, imageUrls)
  initializeSellerContact(detailsContainer)
  const breadcrumbName = document.querySelector('#details-breadcrumb-name')
  if (breadcrumbName) breadcrumbName.textContent = `${car.make} ${car.model}`
  document.title = `${car.make} ${car.model} | AutoMarket`
}
