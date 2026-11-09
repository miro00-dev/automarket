function getFriendlyAuthError(error, action) {
  const code = error?.code || ''
  const message = error?.message?.toLowerCase() || ''

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) return 'The email or password is incorrect.'
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) return 'Confirm your email address before logging in.'
  if (code === 'user_already_exists' || message.includes('already registered')) return 'An account with this email already exists.'
  if (code === 'weak_password' || message.includes('password should be')) return 'Choose a stronger password with at least 6 characters.'
  if (code === 'over_email_send_rate_limit' || message.includes('rate limit')) return 'Too many attempts were made. Wait a moment and try again.'

  if (action === 'reset-request') return 'The reset email could not be sent. Please wait a moment and try again.'
  if (action === 'password-update') return 'Your password could not be updated. Request a new recovery link and try again.'

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

function initializeForgotPasswordForm() {
  const form = document.querySelector('#forgot-password-form')
  if (!form) return
  const errorMessage = document.querySelector('#forgot-password-error')
  const successMessage = document.querySelector('#forgot-password-success')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    errorMessage.classList.add('d-none')
    successMessage.classList.add('d-none')
    form.classList.add('was-validated')
    if (!form.checkValidity()) return form.querySelector(':invalid')?.focus()

    const email = new FormData(form).get('email').trim()
    setFormLoading(form, true, 'Sending link...', 'Send Reset Link')

    try {
      const { requestPasswordReset } = await import('../services/auth-service.js')
      await requestPasswordReset(email)
      form.reset()
      form.classList.remove('was-validated')
      successMessage.textContent = 'If an AutoMarket account exists for that email, a password recovery link has been sent.'
      successMessage.classList.remove('d-none')
      successMessage.focus()
    } catch (error) {
      console.error('Supabase password reset request failed:', error)
      errorMessage.textContent = getFriendlyAuthError(error, 'reset-request')
      errorMessage.classList.remove('d-none')
      errorMessage.focus()
    } finally {
      setFormLoading(form, false, 'Sending link...', 'Send Reset Link')
    }
  })
}

function initializeUpdatePasswordForm() {
  const form = document.querySelector('#update-password-form')
  if (!form) return

  const passwordInput = form.querySelector('#new-password')
  const confirmationInput = form.querySelector('#new-password-confirmation')
  const confirmationError = form.querySelector('#new-password-confirmation-error')
  const submitButton = form.querySelector('button[type="submit"]')
  const checkingMessage = document.querySelector('#recovery-checking')
  const errorMessage = document.querySelector('#update-password-error')
  const successMessage = document.querySelector('#update-password-success')
  const recoveryFlag = 'automarket-password-recovery'
  let recoverySessionReady = sessionStorage.getItem(recoveryFlag) === 'true'

  const validateConfirmation = () => {
    const matches = confirmationInput.value === passwordInput.value
    confirmationInput.setCustomValidity(matches ? '' : 'Passwords do not match.')
    confirmationError.textContent = matches ? 'Confirm your new password.' : 'The passwords do not match.'
  }

  const showRecoveryError = (message) => {
    checkingMessage.classList.add('d-none')
    errorMessage.textContent = message
    errorMessage.classList.remove('d-none')
    errorMessage.focus()
    submitButton.disabled = true
  }

  const enableForm = () => {
    recoverySessionReady = true
    sessionStorage.setItem(recoveryFlag, 'true')
    checkingMessage.classList.add('d-none')
    errorMessage.classList.add('d-none')
    submitButton.disabled = false
  }

  const hashParameters = new URLSearchParams(window.location.hash.slice(1))
  const queryParameters = new URLSearchParams(window.location.search)
  const recoveryError = hashParameters.get('error_description') || queryParameters.get('error_description')
  const hasRecoveryParameters = hashParameters.get('type') === 'recovery'
    || hashParameters.has('access_token')
    || queryParameters.has('code')

  passwordInput.addEventListener('input', validateConfirmation)
  confirmationInput.addEventListener('input', validateConfirmation)

  import('../services/auth-service.js').then(async ({ getCurrentSession, subscribeToPasswordRecovery }) => {
    const unsubscribe = subscribeToPasswordRecovery(enableForm)
    window.addEventListener('pagehide', unsubscribe, { once: true })

    try {
      const session = await getCurrentSession()
      if (recoveryError) {
        showRecoveryError('This password recovery link is invalid or has expired. Request a new link.')
      } else if (recoverySessionReady || (hasRecoveryParameters && session?.user)) {
        enableForm()
      } else {
        showRecoveryError('Open this page using the recovery link sent to your email address.')
      }
    } catch (error) {
      console.error('Supabase recovery session could not be verified:', error)
      showRecoveryError('The recovery link could not be verified. Request a new link and try again.')
    }
  }).catch((error) => {
    console.error('Supabase recovery services could not be loaded:', error)
    showRecoveryError('The recovery link could not be verified. Please try again later.')
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    errorMessage.classList.add('d-none')
    successMessage.classList.add('d-none')
    validateConfirmation()
    form.classList.add('was-validated')
    if (!recoverySessionReady) return showRecoveryError('Request a new password recovery link before continuing.')
    if (!form.checkValidity()) return form.querySelector(':invalid')?.focus()

    setFormLoading(form, true, 'Updating password...', 'Set New Password')
    try {
      const { updatePassword } = await import('../services/auth-service.js')
      await updatePassword(passwordInput.value)
      sessionStorage.removeItem(recoveryFlag)
      form.reset()
      form.classList.remove('was-validated')
      validateConfirmation()
      successMessage.classList.remove('d-none')
      successMessage.focus()
      form.classList.add('d-none')
    } catch (error) {
      console.error('Supabase password update failed:', error)
      errorMessage.textContent = getFriendlyAuthError(error, 'password-update')
      errorMessage.classList.remove('d-none')
      errorMessage.focus()
      setFormLoading(form, false, 'Updating password...', 'Set New Password')
    }
  })
}

export function initializeAuthPages() {
  initializeLoginForm()
  initializeRegisterForm()
  initializeForgotPasswordForm()
  initializeUpdatePasswordForm()
}
