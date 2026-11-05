function getReturnPath() {
  return `${window.location.pathname}${window.location.search}`
}

function redirectToLogin() {
  window.location.assign(`/pages/login.html?redirect=${encodeURIComponent(getReturnPath())}`)
}

function updateButton(button, isFavorite) {
  const icon = button.querySelector('i')
  button.classList.toggle('is-favorite', isFavorite)
  button.setAttribute('aria-pressed', String(isFavorite))
  button.setAttribute('aria-label', isFavorite ? 'Remove car from favorites' : 'Add car to favorites')
  button.title = isFavorite ? 'Remove from favorites' : 'Add to favorites'
  icon?.classList.toggle('bi-heart', !isFavorite)
  icon?.classList.toggle('bi-heart-fill', isFavorite)
}

export async function initializeFavoritesController() {
  let session = null
  let favoriteIds = new Set()

  try {
    const { getCurrentSession } = await import('../services/auth-service.js')
    session = await getCurrentSession()
    if (session?.user) {
      const { getFavoriteCarIds } = await import('../services/favorites-service.js')
      favoriteIds = new Set(await getFavoriteCarIds(session.user.id))
    }
  } catch (error) {
    console.error('AutoMarket favorites could not be initialized:', error)
  }

  const syncButtons = (root = document) => {
    root.querySelectorAll?.('[data-favorite-car-id]').forEach((button) => {
      updateButton(button, favoriteIds.has(button.dataset.favoriteCarId))
    })
  }

  syncButtons()
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) syncButtons(node)
    }))
  })
  observer.observe(document.body, { childList: true, subtree: true })

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-favorite-car-id]')
    if (!button) return
    if (!session?.user) return redirectToLogin()

    const carId = button.dataset.favoriteCarId
    const wasFavorite = favoriteIds.has(carId)
    button.disabled = true
    try {
      const { addFavorite, removeFavorite } = await import('../services/favorites-service.js')
      if (wasFavorite) {
        await removeFavorite(session.user.id, carId)
        favoriteIds.delete(carId)
      } else {
        await addFavorite(session.user.id, carId)
        favoriteIds.add(carId)
      }
      document.querySelectorAll('[data-favorite-car-id]').forEach((candidate) => {
        if (candidate.dataset.favoriteCarId === carId) updateButton(candidate, !wasFavorite)
      })
      document.dispatchEvent(new CustomEvent('automarket:favorite-change', {
        detail: { carId, isFavorite: !wasFavorite },
      }))
    } catch (error) {
      console.error('The favorite could not be updated:', error)
      window.alert('The favorite could not be updated. Please try again.')
    } finally {
      button.disabled = false
    }
  })
}
