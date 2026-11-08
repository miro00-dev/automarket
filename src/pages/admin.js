import {
  deleteAdminCar,
  getAdminDashboardData,
  isCurrentUserAdmin,
  setAdminCarStatus,
  setUserAccountStatus,
} from '../services/admin-service.js'
import { escapeHtml } from '../utils/html.js'
import { priceFormatter } from '../utils/formatters.js'

const statusLabels = { active: 'Approved', pending: 'Pending', rejected: 'Rejected', suspended: 'Suspended' }

function redirectToLogin() {
  const returnPath = `${window.location.pathname}${window.location.search}`
  window.location.replace(`/pages/login.html?redirect=${encodeURIComponent(returnPath)}`)
}

function formatDate(value) {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
}

function badge(status) {
  const variants = { active: 'success', pending: 'warning', rejected: 'danger', suspended: 'danger' }
  return `<span class="badge text-bg-${variants[status] || 'secondary'}">${escapeHtml(statusLabels[status] || status)}</span>`
}

function renderStatistics(statistics = {}) {
  const cards = [
    ['Total users', statistics.totalUsers ?? 0, 'people'],
    ['Total listings', statistics.totalListings ?? 0, 'car-front'],
    ['Pending review', statistics.pendingListings ?? 0, 'hourglass-split'],
    ['Approved', statistics.approvedListings ?? 0, 'check-circle'],
  ]
  document.querySelector('#admin-statistics').innerHTML = cards.map(([label, value, icon]) => `
    <div class="col-sm-6 col-xl-3"><article class="admin-stat-card h-100">
      <i class="bi bi-${icon}" aria-hidden="true"></i><div><span>${escapeHtml(label)}</span><strong>${value}</strong></div>
    </article></div>`).join('')
}

function updatePagination(prefix, page, pageSize, total) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  document.querySelector(`#${prefix}-page-label`).textContent = `Page ${page} of ${totalPages}`
  document.querySelector(`[data-page-target="${prefix}"][data-page-direction="previous"]`).disabled = page <= 1
  document.querySelector(`[data-page-target="${prefix}"][data-page-direction="next"]`).disabled = page >= totalPages
}

function renderCars(cars = [], pagination = {}) {
  const body = document.querySelector('#admin-listings-body')
  const empty = document.querySelector('#admin-listings-empty')
  empty.classList.toggle('d-none', cars.length > 0)
  body.innerHTML = cars.map((car) => `
    <tr>
      <td><strong>${escapeHtml(car.make)} ${escapeHtml(car.model)}</strong><small class="d-block text-body-secondary">ID: ${escapeHtml(car.id)}</small></td>
      <td>${escapeHtml(car.year)}</td><td>${priceFormatter.format(Number(car.price) || 0)}</td>
      <td>${badge(car.status)}</td><td>${formatDate(car.created_at)}</td>
      <td><div class="admin-row-actions">
        <a class="btn btn-sm btn-outline-dark" href="/pages/car-details.html?id=${encodeURIComponent(car.id)}" aria-label="View listing"><i class="bi bi-eye"></i></a>
        <button class="btn btn-sm btn-success" data-car-action="active" data-car-id="${escapeHtml(car.id)}" ${car.status === 'active' ? 'disabled' : ''}>Approve</button>
        <button class="btn btn-sm btn-outline-warning" data-car-action="rejected" data-car-id="${escapeHtml(car.id)}" ${car.status === 'rejected' ? 'disabled' : ''}>Reject</button>
        <button class="btn btn-sm btn-outline-danger" data-car-action="delete" data-car-id="${escapeHtml(car.id)}">Delete</button>
      </div></td>
    </tr>`).join('')
  updatePagination('cars', pagination.carsPage ?? 1, pagination.pageSize ?? 20, pagination.carsTotal ?? 0)
}

function renderUsers(users = [], pagination = {}) {
  const body = document.querySelector('#admin-users-body')
  const empty = document.querySelector('#admin-users-empty')
  empty.classList.toggle('d-none', users.length > 0)
  body.innerHTML = users.map((user) => `
    <tr>
      <td><strong>${escapeHtml(user.full_name || 'No profile name')}</strong><small class="d-block text-body-secondary">${escapeHtml(user.email || 'No email')}</small></td>
      <td>${escapeHtml(user.city || 'Not provided')}</td><td>${formatDate(user.created_at)}</td>
      <td>${user.is_admin ? '<span class="badge text-bg-primary">Admin</span>' : badge(user.status)}</td>
      <td><div class="admin-row-actions">
        ${user.is_admin ? '<span class="text-body-secondary small">Protected administrator</span>' : user.status === 'suspended'
          ? `<button class="btn btn-sm btn-success" data-user-action="active" data-user-id="${escapeHtml(user.id)}">Reactivate</button>`
          : `<button class="btn btn-sm btn-outline-danger" data-user-action="suspended" data-user-id="${escapeHtml(user.id)}">Suspend</button>`}
      </div></td>
    </tr>`).join('')
  updatePagination('users', pagination.usersPage ?? 1, pagination.pageSize ?? 20, pagination.usersTotal ?? 0)
}

export async function initializeAdminPage() {
  const page = document.querySelector('#admin-dashboard')
  if (!page) return

  const loading = document.querySelector('#admin-loading')
  const content = document.querySelector('#admin-content')
  const denied = document.querySelector('#admin-access-denied')
  const errorBox = document.querySelector('#admin-error')
  const errorText = document.querySelector('#admin-error-message')
  const pages = { carsPage: 1, usersPage: 1, pageSize: 20 }

  const showError = (error) => {
    console.error('Admin dashboard operation failed:', error)
    errorText.textContent = error.message || 'The admin operation could not be completed.'
    errorBox.classList.remove('d-none')
    errorBox.focus()
  }

  const loadDashboard = async () => {
    errorBox.classList.add('d-none')
    const data = await getAdminDashboardData(pages)
    renderStatistics(data?.statistics)
    renderCars(data?.cars, data?.pagination)
    renderUsers(data?.users, data?.pagination)
    content.classList.remove('d-none')
  }

  try {
    const { getCurrentSession } = await import('../services/auth-service.js')
    const session = await getCurrentSession()
    if (!session?.user) return redirectToLogin()
    if (!(await isCurrentUserAdmin())) {
      loading.classList.add('d-none')
      denied.classList.remove('d-none')
      return
    }
    await loadDashboard()
  } catch (error) {
    showError(error)
  } finally {
    loading.classList.add('d-none')
  }

  page.addEventListener('click', async (event) => {
    const pageButton = event.target.closest('[data-page-target]')
    if (pageButton) {
      const key = `${pageButton.dataset.pageTarget}Page`
      const change = pageButton.dataset.pageDirection === 'next' ? 1 : -1
      pages[key] = Math.max(1, pages[key] + change)
      pageButton.disabled = true
      try {
        await loadDashboard()
      } catch (error) {
        pages[key] = Math.max(1, pages[key] - change)
        showError(error)
      }
      return
    }

    const carButton = event.target.closest('[data-car-action]')
    const userButton = event.target.closest('[data-user-action]')
    if (!carButton && !userButton) return

    const button = carButton || userButton
    const originalText = button.textContent
    try {
      if (carButton) {
        const { carAction, carId } = carButton.dataset
        if (carAction === 'delete') {
          if (!window.confirm('Permanently delete this listing? This cannot be undone.')) return
          button.disabled = true
          button.textContent = 'Deleting images...'
          await deleteAdminCar(carId)
        } else {
          await setAdminCarStatus(carId, carAction)
        }
      } else {
        const { userAction, userId } = userButton.dataset
        let reason = null
        if (userAction === 'suspended') {
          if (!window.confirm('Suspend this account from modifying AutoMarket data?')) return
          reason = window.prompt('Optional suspension reason (maximum 500 characters):')
          if (reason?.length > 500) throw new Error('Suspension reason cannot exceed 500 characters.')
        }
        await setUserAccountStatus(userId, userAction, reason)
      }
      button.disabled = true
      button.textContent = 'Updating...'
      await loadDashboard()
    } catch (error) {
      showError(error)
      button.disabled = false
      button.textContent = originalText
    }
  })
}
