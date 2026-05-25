const express = require('express')
const path = require('path')
const fetch = require('node-fetch')
const { v4: uuidv4 } = require('uuid')

require('dotenv').config()

const ACCOUNT_CODE = process.env.ACCOUNT_CODE
const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY
const PRIVATE_SECRET_KEY = process.env.PRIVATE_SECRET_KEY
const PORT = process.env.PORT || 3000

const CURRENCY_MAP = {
  CO: 'COP', BR: 'BRL', MX: 'MXN', PE: 'PEN',
  CL: 'CLP', EC: 'USD', AR: 'ARS', US: 'USD',
  GB: 'GBP', FR: 'EUR', DE: 'EUR', ES: 'EUR',
}

let API_URL
let CUSTOMER_ID

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/public-api-key', (req, res) => {
  res.json({ publicApiKey: PUBLIC_API_KEY })
})

app.post('/checkout/sessions', async (req, res) => {
  const country = req.query.country || 'CO'
  const currency = CURRENCY_MAP[country] || 'USD'
  const amount = req.body?.amount || 28500

  try {
    const response = await fetch(`${API_URL}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: ACCOUNT_CODE,
        merchant_order_id: `YFS-${Date.now()}`,
        payment_description: 'Yunique Fashion Store',
        country,
        customer_id: CUSTOMER_ID,
        amount: { currency, value: amount },
        customer_payer: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@yunique.com',
          document: { document_number: '123456789', document_type: 'CI' },
          billing_address: {
            address_line_1: '123 Fashion Ave',
            city: 'New York',
            country,
            state: 'NY',
            zip_code: '10001',
          },
        },
      }),
    }).then(r => r.json())

    res.json(response)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/payments', async (req, res) => {
  const { checkoutSession, oneTimeToken } = req.body
  const country = req.query.country || 'CO'
  const currency = CURRENCY_MAP[country] || 'USD'

  try {
    const response = await fetch(`${API_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'X-idempotency-key': uuidv4(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: ACCOUNT_CODE,
        merchant_order_id: `YFS-PAY-${Date.now()}`,
        country,
        amount: { currency, value: 28500 },
        checkout: { session: checkoutSession },
        customer_payer: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@yunique.com',
          document: { document_number: '123456789', document_type: 'CI' },
        },
        payment_method: { token: oneTimeToken, vaulted_token: null },
        additional_data: {
          order: {
            items: [{
              category: 'Fashion',
              id: 'YFS-001',
              name: 'Fashion Item',
              quantity: 1,
              unit_amount: 28500,
              brand: 'Yunique',
            }],
          },
        },
      }),
    }).then(r => r.json())

    res.json(response)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, async () => {
  API_URL = generateApiUrl()
  CUSTOMER_ID = await createCustomer()
  console.log(`\n  Yunique Fashion Store Demo`)
  console.log(`  http://localhost:${PORT}\n`)
})

function generateApiUrl() {
  const prefixMap = { dev: '-dev', staging: '-staging', sandbox: '-sandbox', prod: '' }
  const prefix = PUBLIC_API_KEY?.split('_')[0]
  const suffix = prefixMap[prefix] ?? '-sandbox'
  return `https://api${suffix}.y.uno`
}

async function createCustomer() {
  try {
    const { id } = await fetch(`${API_URL}/v1/customers`, {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        country: 'CO',
        merchant_customer_id: `yfs-${Date.now()}`,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@yunique.com',
      }),
    }).then(r => r.json())
    return id
  } catch {
    return null
  }
}
