import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/base.css'
import { renderSiteFooter, renderSiteHeader } from './components/site-layout.js'
import { initializeBrowseCarsPage } from './pages/browse-cars.js'
import { initializeCarDetailsPage } from './pages/car-details.js'
import { initializeHomePage } from './pages/home.js'

// Shared application entry point for every AutoMarket page.
document.documentElement.classList.add('js-enabled')

renderSiteHeader()
renderSiteFooter()
initializeHomePage()
initializeBrowseCarsPage()
initializeCarDetailsPage()
