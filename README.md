# Yunique Fashion Store — Yuno SDK Demo

A customer-facing demo built for Yunique Fashion Store, showcasing how Yuno's Web SDK solves three core payment needs:

| Need | How it's solved |
|------|-----------------|
| **Credit Card acceptance** | Yuno's embedded checkout surfaces credit card as a first-class payment method — no external processor contracts required |
| **Embedded checkout** | The entire payment flow lives inside `yunique-store.com` — customers never navigate away |
| **Extensibility** | 300+ payment methods (APMs, digital wallets, BNPL) can be enabled from the Yuno dashboard with zero code changes |

## Demo flow

1. Browse fashion products on the homepage
2. Add items to your bag
3. Click **Proceed to Checkout**
4. On the checkout page, change the **Billing Country** dropdown — notice how the available payment methods update automatically for each market
5. Select **Credit Card**, fill in the card details, and click **Pay**
6. After payment, see the in-page confirmation — you never left the store

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure credentials

```bash
cp .env.example .env
```

Edit `.env` with your Yuno credentials (provided by your Yuno Sales Engineer):

```
PUBLIC_API_KEY=sandbox_...
PRIVATE_SECRET_KEY=sandbox_...
ACCOUNT_CODE=...
```

### 3. Start the server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
├── server.js           # Express backend — creates Yuno checkout sessions & payments
├── public/
│   ├── index.html      # Fashion store homepage (product catalogue + cart)
│   ├── checkout.html   # Checkout page with embedded Yuno SDK
│   ├── css/styles.css  # Full stylesheet
│   └── js/
│       ├── api.js      # Frontend API helpers
│       ├── store.js    # Cart logic for the store page
│       └── checkout.js # Yuno SDK initialization & payment flow
└── .env.example
```

## Key Yuno SDK calls (checkout.js)

```js
// 1. Initialize once
const yuno = await Yuno.initialize(publicApiKey)

// 2. Configure & mount — re-run when country changes
await yuno.startCheckout({
  checkoutSession,          // Server-generated session per order
  elementSelector: '#yuno-checkout',  // Renders payment method list here
  countryCode,              // Drives which APMs are available
  renderMode: { type: 'element', ... }, // Everything inline, no redirects
  yunoCreatePayment: async (token) => { /* call your server */ },
  yunoPaymentResult: (status) => { /* show result */ },
})
yuno.mountCheckout()

// 3. Trigger when user clicks Pay
yuno.startPayment()
```
