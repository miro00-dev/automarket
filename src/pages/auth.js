function getFriendlyAuthError(error, action) {
  const code = error?.code || ''
  const message = error?.message?.toLowerCase() || ''

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) return 'The email or password is incorrect.'
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) return 'Confirm your email address before logging in.'
  if (code === 'user_already_exists' || message.includes('already registered')) return 'An account with this email already exists.'
  if (code === 'weak_password' || message.includes('password should be')) return 'Choose a stronger password with at least 6 characters.'
  if (code === 'over_email_send_rate_limit' || message.includes('rate limit')) return 'Too many attempts were made. Wait a moment and try again.'

  return action === 'register'
    ? 'Your account could not be created. Please check your details and try again.'
    : 'Login failed. Please check your details and try again.'
}

function setFormLoading(form, isLoading, loadingLabel, defaultLabel) {
  const button = form.querySelector('button[type="submit"]')
  button.disabled = isLoading
  form.querySelector('[data-auth-spinner]').classList.toggle('d-none', !isLoading)
  form.querySelector('[data-auth-icon]').classList.toggle('d-none', isLoading)
  form.querySelector('[data-auth-label]').textContent = isLoading ? loadingLabel : defaultLabel
}

function getSafeRedirect() {
  const redirect = new URLSearchParams(window.location.search).get('redirect')
  return redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
}

function initializeLoginForm() {
  const form = document.querySelector('#login-form')
  if (!form) return
  const errorMessage = document.querySelector('#login-error')
  const successMessage = document.querySelector('#login-success')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    errorMessage.classList.add('d-none')
    successMessage.classList.add('d-none')
    form.classList.add('was-validated')
    if (!form.checkValidity()) return form.querySelector(':invalid')?.focus()

    const formData = new FormData(form)
    setFormLoading(form, true, 'Logging in...', 'Login')

    try {
      const { loginWithEmail } = await import('../services/auth-service.js')
      await loginWithEmail(formData.get('email').trim(), formData.get('password'))
      successMessage.classList.remove('d-none')
      successMessage.focus()
      window.setTimeout(() => window.location.assign(getSafeRedirect()), 500)
    } catch (error) {
      console.error('Supabase login failed:', error)
      errorMessage.textContent = getFriendlyAuthError(error, 'login')
      errorMessage.classList.remove('d-none')
      errorMessage.focus()
      setFormLoading(form, false, 'Logging in...', 'Login')
    }
  })
}

function initializeRegisterForm() {
  const form = document.querySelector('#register-form')
  if (!form) return
  const passwordInput = form.querySelector('#register-password')
  const confirmationInput = form.querySelector('#register-password-confirmation')
  const confirmationError = form.querySelector('#password-confirmation-error')
  const errorMessage = document.querySelector('#register-error')
  const successMessage = document.querySelector('#register-success')

  const validateConfirmation = () => {
    const matches = confirmationInput.value === passwordInput.value
    confirmationInput.setCustomValidity(matches ? '' : 'Passwords do not match.')
    confirmationError.textContent = matches ? 'Confirm your password.' : 'The passwords do not match.'
  }

  passwordInput.addEventListener('input', validateConfirmation)
  confirmationInput.addEventListener('input', validateConfirmation)

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    errorMessage.classList.add('d-none')
    successMessage.classList.add('d-none')
    validateConfirmation()
    form.classList.add('was-validated')
    if (!form.checkValidity()) return form.querySelector(':invalid')?.focus()

    const formData = new FormData(form)
    setFormLoading(form, true, 'Creating account...', 'Create Account')

    try {
      const { registerWithEmail } = await import('../services/auth-service.js')
      const data = await registerWithEmail(formData.get('email').trim(), formData.get('password'))
      form.reset()
      form.classList.remove('was-validated')
      validateConfirmation()
      successMessage.textContent = data.session
        ? 'Your account was created and you are now logged in.'
        : 'Your account was created. Check your email for the confirmation link before logging in.'
      successMessage.classList.remove('d-none')
      successMessage.focus()
      setFormLoading(form, false, 'Creating account...', 'Create Account')
    } catch (error) {
      console.error('Supabase registration failed:', error)
      errorMessage.textContent = getFriendlyAuthError(error, 'register')
      errorMessage.classList.remove('d-none')
      errorMessage.focus()
      setFormLoading(form, false, 'Creating account...', 'Create Account')
    }
  })
}

export function initializeAuthPages() {
  initializeLoginForm()
  initializeRegisterForm()
}
