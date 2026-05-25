import { getPublicApiKey, getCheckoutSession, createPayment } from './api.js'

let yunoInstance = null
let currentCheckoutSession = null
let pageTotal = 0

function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function getCart() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  if (cart.length === 0) {
    cart.push({ id: 1, name: 'Silk Evening Dress', price: 285, qty: 1 })
  }
  return cart
}

function renderOrderSummary() {
  const cart = getCart()
  pageTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  document.getElementById('order-items').innerHTML = cart
    .map(item => `
      <div class="order-item">
        <div class="order-item-info">
          <span class="order-item-name">${item.name}</span>
          <span class="order-item-qty">× ${item.qty}</span>
        </div>
        <span class="order-item-price">${formatMoney(item.price * item.qty)}</span>
      </div>
    `).join('')

  document.getElementById('subtotal').textContent = formatMoney(pageTotal)
  document.getElementById('order-total').textContent = formatMoney(pageTotal)
  document.getElementById('pay-amount').textContent = formatMoney(pageTotal)
}

function showLoading(show) {
  document.getElementById('checkout-loading').style.display = show ? 'flex' : 'none'
}

function showResult(status) {
  const success = ['SUCCEEDED', 'APPROVED', 'VERIFIED'].includes(status)
  const pending = ['PENDING', 'CREATED'].includes(status)

  const iconEl = document.getElementById('result-icon')
  iconEl.textContent = success ? '✓' : pending ? '⏳' : '✗'
  iconEl.className = `result-icon ${success ? 'success' : pending ? 'pending' : 'error'}`

  document.getElementById('result-title').textContent = success
    ? 'Payment Successful!'
    : pending ? 'Payment Processing…' : 'Payment Failed'

  document.getElementById('result-message').textContent = success
    ? 'Thank you for your purchase. A confirmation has been sent to your email.'
    : pending
    ? 'Your payment is being processed. We will notify you shortly.'
    : 'There was an issue processing your payment. Please try again.'

  document.getElementById('btn-pay').style.display = 'none'
  document.getElementById('yuno-checkout').style.display = 'none'
  document.getElementById('form-element').style.display = 'none'
  document.getElementById('payment-result').style.display = 'block'
}

async function initCheckout() {
  const country = document.getElementById('country-select').value

  showLoading(true)
  document.getElementById('btn-pay').disabled = true
  document.getElementById('yuno-checkout').innerHTML = ''
  document.getElementById('form-element').innerHTML = ''
  document.getElementById('action-form-element').innerHTML = ''

  try {
    const amountInCents = Math.round(pageTotal * 100)
    const sessionData = await getCheckoutSession(country, amountInCents)
    currentCheckoutSession = sessionData.checkout_session

    const publicApiKey = await getPublicApiKey()

    if (!yunoInstance) {
      yunoInstance = await Yuno.initialize(publicApiKey)
    }

    await yunoInstance.startCheckout({
      checkoutSession: currentCheckoutSession,
      elementSelector: '#yuno-checkout',
      countryCode: sessionData.country || country,
      language: 'en',
      showLoading: true,
      keepLoader: true,
      renderMode: {
        type: 'element',
        elementSelector: {
          apmForm: '#form-element',
          actionForm: '#action-form-element',
        },
      },
      card: {
        type: 'extends',
      },
      onLoading: ({ isLoading }) => {
        if (!isLoading) showLoading(false)
      },
      async yunoCreatePayment(oneTimeToken) {
        await createPayment(
          { oneTimeToken, checkoutSession: currentCheckoutSession },
          country
        )
        yunoInstance.continuePayment()
      },
      yunoPaymentResult(status) {
        showResult(status)
        yunoInstance.hideLoader()
      },
      yunoError(error) {
        if (error !== 'CANCELED_BY_USER') {
          console.error('Yuno payment error:', error)
        }
        yunoInstance.hideLoader()
      },
    })

    yunoInstance.mountCheckout()
    document.getElementById('btn-pay').disabled = false
    showLoading(false)
  } catch (err) {
    console.error('Checkout initialization failed:', err)
    showLoading(false)
  }
}

function init() {
  renderOrderSummary()

  document.getElementById('country-select').addEventListener('change', initCheckout)

  document.getElementById('btn-pay').addEventListener('click', () => {
    if (yunoInstance) yunoInstance.startPayment()
  })

  initCheckout()
}

window.addEventListener('yuno-sdk-ready', init)
