import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/base.css'
import { initializeAuthNavigation, renderSiteFooter, renderSiteHeader } from './components/site-layout.js'
import { initializeFavoritesController } from './components/favorites-controller.js'
import { initializeAuthPages } from './pages/auth.js'
import { initializeBrowseCarsPage } from './pages/browse-cars.js'
import { initializeCarDetailsPage } from './pages/car-details.js'
import { initializeHomePage } from './pages/home.js'
import { initializeFavoritesPage } from './pages/favorites.js'
import { initializeMyListingsPage } from './pages/my-listings.js'
import { initializeProfilePage } from './pages/profile.js'
import { initializeSellCarPage } from './pages/sell-car.js'

// Shared application entry point for every AutoMarket page.
document.documentElement.classList.add('js-enabled')

renderSiteHeader()
initializeAuthNavigation()
renderSiteFooter()
initializeAuthPages()
initializeHomePage()
initializeFavoritesPage()
initializeMyListingsPage()
initializeProfilePage()
initializeBrowseCarsPage()
initializeCarDetailsPage()
initializeSellCarPage()
initializeFavoritesController()
