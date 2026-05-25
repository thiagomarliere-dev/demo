let cart = JSON.parse(localStorage.getItem('cart') || '[]')

function formatMoney(amount) {
  return `$${amount.toFixed(2)}`
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart))
  renderAll()
}

function renderAll() {
  const count = cart.reduce((s, i) => s + i.qty, 0)
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  document.getElementById('cart-badge').textContent = count
  document.getElementById('cart-count-text').textContent = `(${count})`
  document.getElementById('cart-total').textContent = formatMoney(total)

  const checkoutBtn = document.getElementById('btn-to-checkout')
  if (cart.length > 0) {
    checkoutBtn.style.cssText = ''
  } else {
    checkoutBtn.style.cssText = 'pointer-events:none;opacity:.4'
  }

  const itemsEl = document.getElementById('cart-drawer-items')
  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Your bag is empty</p>'
    return
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <div class="cart-item-controls">
          <button onclick="changeQty(${item.id},-1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${item.id},1)">+</button>
          <button onclick="removeItem(${item.id})" class="remove-btn">✕</button>
        </div>
      </div>
      <span class="cart-item-price">${formatMoney(item.price * item.qty)}</span>
    </div>
  `).join('')
}

window.addToCart = function(item) {
  const existing = cart.find(i => i.id === item.id)
  if (existing) {
    existing.qty++
  } else {
    cart.push({ ...item })
  }
  saveCart()
  openCart()
}

window.changeQty = function(id, delta) {
  const item = cart.find(i => i.id === id)
  if (!item) return
  item.qty = Math.max(0, item.qty + delta)
  if (item.qty === 0) cart = cart.filter(i => i.id !== id)
  saveCart()
}

window.removeItem = function(id) {
  cart = cart.filter(i => i.id !== id)
  saveCart()
}

window.openCart = function() {
  document.getElementById('cart-drawer').classList.add('open')
  document.getElementById('overlay').classList.add('show')
}

window.closeCart = function() {
  document.getElementById('cart-drawer').classList.remove('open')
  document.getElementById('overlay').classList.remove('show')
}

document.getElementById('open-cart').addEventListener('click', openCart)

renderAll()
