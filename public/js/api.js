export async function getPublicApiKey() {
  const resp = await fetch('/public-api-key')
  const { publicApiKey } = await resp.json()
  return publicApiKey
}

export async function getCheckoutSession(country = 'CO', amount = 28500) {
  const resp = await fetch(`/checkout/sessions?country=${country}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  })
  return resp.json()
}

export async function createPayment(data, country = 'CO') {
  const resp = await fetch(`/payments?country=${country}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return resp.json()
}
