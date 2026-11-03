const navigationItems = [
  { label: 'Home', href: '/' },
  { label: 'Cars', href: '/pages/cars.html' },
  { label: 'Add Car', href: '/pages/add-car.html' },
  { label: 'Favorites', href: '/pages/favorites.html' },
  { label: 'My Listings', href: '/pages/my-listings.html' },
]

function createNavigationLinks() {
  return navigationItems
    .map(
      ({ label, href }) => `
        <li class="nav-item">
          <a class="nav-link${href === '/' ? ' active' : ''}" href="${href}"${
            href === '/' ? ' aria-current="page"' : ''
          }>${label}</a>
        </li>`,
    )
    .join('')
}

export function renderSiteHeader() {
  const header = document.querySelector('#site-header')

  if (!header) return

  header.innerHTML = `
    <nav class="navbar navbar-expand-xl navbar-dark fixed-top" aria-label="Main navigation">
      <div class="container">
        <a class="navbar-brand" href="/">
          <span class="brand-mark"><i class="bi bi-speedometer2" aria-hidden="true"></i></span>
          Auto<span>Market</span>
        </a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#main-navigation"
          aria-controls="main-navigation"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="main-navigation">
          <ul class="navbar-nav mx-auto mb-3 mb-xl-0">
            ${createNavigationLinks()}
          </ul>
          <div class="navbar-actions d-flex flex-column flex-sm-row gap-2">
            <a class="btn btn-link" href="/pages/login.html">Login</a>
            <a class="btn btn-primary" href="/pages/register.html">Register</a>
          </div>
        </div>
      </div>
    </nav>`
}

export function renderSiteFooter() {
  const footer = document.querySelector('#site-footer')

  if (!footer) return

  footer.innerHTML = `
    <div class="container py-5">
      <div class="row g-5">
        <div class="col-lg-5">
          <a class="footer-brand" href="/">Auto<span>Market</span></a>
          <p class="footer-copy mt-3 mb-4">
            A straightforward place to discover, compare, and list cars.
          </p>
          <div class="social-links" aria-label="Social media links">
            <a href="#" aria-label="Facebook"><i class="bi bi-facebook" aria-hidden="true"></i></a>
            <a href="#" aria-label="Instagram"><i class="bi bi-instagram" aria-hidden="true"></i></a>
            <a href="#" aria-label="LinkedIn"><i class="bi bi-linkedin" aria-hidden="true"></i></a>
          </div>
        </div>
        <div class="col-6 col-lg-3 offset-lg-1">
          <h2 class="footer-heading">Marketplace</h2>
          <ul class="footer-links list-unstyled mb-0">
            <li><a href="/pages/cars.html">Browse Cars</a></li>
            <li><a href="/pages/add-car.html">Sell Your Car</a></li>
            <li><a href="/pages/favorites.html">Favorites</a></li>
          </ul>
        </div>
        <div class="col-6 col-lg-3">
          <h2 class="footer-heading">Account</h2>
          <ul class="footer-links list-unstyled mb-0">
            <li><a href="/pages/login.html">Login</a></li>
            <li><a href="/pages/register.html">Register</a></li>
            <li><a href="/pages/my-listings.html">My Listings</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container d-flex flex-column flex-sm-row justify-content-between gap-2 py-3">
        <span>&copy; ${new Date().getFullYear()} AutoMarket. All rights reserved.</span>
        <span>Course capstone project</span>
      </div>
    </div>`
}
