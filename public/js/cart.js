class Cart {
  constructor() {
    this.cartItems = []
    this.init()
  }

  async init() {
    await this.loadCart()
    this.setupEventListeners()
    this.renderCart()
    this.updateGlobalCounter() 
  }

  async loadCart() {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        this.cartItems = await response.json()
        this.saveToStorage()
      }
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error)
      this.loadFromStorage()
    }
  }

  saveToStorage() {
    localStorage.setItem('cartItems', JSON.stringify(this.cartItems))
    const totalCount = this.cartItems.reduce((sum, item) => sum + item.quantity, 0)
    localStorage.setItem('cartTotalCount', totalCount.toString())
    console.log('Сохранено в localStorage:', totalCount, 'товаров')
    
    window.dispatchEvent(new CustomEvent('cartUpdated', { 
      detail: { count: totalCount }
    }))
  }

  loadFromStorage() {
    const saved = localStorage.getItem('cartItems')
    if (saved) {
      this.cartItems = JSON.parse(saved)
    }
  }

  renderCart() {
    const container = document.querySelector('.cart-items')
    const summaryContainer = document.querySelector('.cart-summary')

    if (!container) return

    if (this.cartItems.length === 0) {
      container.innerHTML = `
        <div class="empty-cart">
          <h3>Корзина пуста</h3>
          <p>Добавьте товары из каталога</p>
          <a href="catalog.html" class="cta">Перейти в каталог</a>
        </div>
      `
      if (summaryContainer) summaryContainer.innerHTML = ''
      this.updateGlobalCounter()
      return
    }

    container.innerHTML = this.cartItems.map(item => `
      <div class="cart-item" data-product-id="${item.product_id}">
        <img src="${item.image_url}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
        <div class="item-details">
          <h3>${item.name}</h3>
          <p class="item-price">${this.formatPrice(item.price)}</p>
          <div class="quantity-controls">
            <button class="quantity-btn minus" data-product-id="${item.product_id}">-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="quantity-btn plus" data-product-id="${item.product_id}">+</button>
          </div>
        </div>
        <button class="remove-item" data-product-id="${item.product_id}" title="Удалить товар">&times;</button>
      </div>
    `).join('')

    this.updateSummary()
    this.updateGlobalCounter()
  }

  updateSummary() {
    const container = document.querySelector('.cart-summary')
    if (!container) return

    const totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const total = subtotal

    container.innerHTML = `
      <div class="summary-card">
        <h3>Итого</h3>
        <div class="summary-row">
          <span>Товары (${totalItems})</span>
          <span>${this.formatPrice(subtotal)}</span>
        </div>
        <div class="summary-row">
          <span>Доставка</span>
          <span>Бесплатно</span>
        </div>
        <div class="summary-row total">
          <span>К оплате</span>
          <span>${this.formatPrice(total)}</span>
        </div>
        <button class="checkout-btn cta">Оформить заказ</button>
        <a href="catalog.html" class="continue-shopping">Продолжить покупки</a>
      </div>
    `
  }

  formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price)
  }

  setupEventListeners() {
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('remove-item')) {
        await this.removeFromCart(e.target.dataset.productId)
      } else if (e.target.classList.contains('minus')) {
        await this.updateQuantity(e.target.dataset.productId, -1)
      } else if (e.target.classList.contains('plus')) {
        await this.updateQuantity(e.target.dataset.productId, 1)
      } else if (e.target.classList.contains('checkout-btn')) {
        this.checkout()
      }
    })
  }

  async removeFromCart(productId) {
    try {
      const response = await fetch(`/api/cart?productId=${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        this.cartItems = this.cartItems.filter(item => item.product_id != productId)
        this.saveToStorage()
        this.renderCart()
        this.showNotification('Товар удален из корзины')
      }
    } catch (error) {
      console.error('Ошибка удаления:', error)
    }
  }

  async updateQuantity(productId, change) {
    const item = this.cartItems.find(item => item.product_id == productId)
    if (!item) return

    const newQuantity = item.quantity + change
    if (newQuantity < 1) {
      await this.removeFromCart(productId)
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: parseInt(productId),
          quantity: newQuantity
        })
      })

      if (response.ok) {
        item.quantity = newQuantity
        this.saveToStorage()
        this.renderCart()
      }
    } catch (error) {
      console.error('Ошибка обновления:', error)
    }
  }

  updateGlobalCounter() {
    const totalCount = this.cartItems.reduce((sum, item) => sum + item.quantity, 0)
    
    const counters = document.querySelectorAll('.cart-count')
    counters.forEach(counter => {
      counter.textContent = totalCount
    })
    
    localStorage.setItem('cartTotalCount', totalCount.toString())
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cartTotalCount',
      newValue: totalCount.toString()
    }))
  }

  checkout() {
    if (this.cartItems.length === 0) {
      this.showNotification('Корзина пуста', 'error')
      return
    }

    fetch('/api/user', { credentials: 'include' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Not authenticated')
        }
        return response.json()
      })
      .then(userData => {
        this.showCheckoutModal()
      })
      .catch(error => {
        this.showNotification('Для оформления заказа необходимо войти в систему', 'error')
        setTimeout(() => {
          const authButton = document.getElementById('authButton')
          if (authButton) authButton.click()
        }, 1000)
      })
  }

  showCheckoutModal() {
    const modal = document.createElement('div')
    modal.className = 'modal active'
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="modal-close" id="closeCheckoutModal">&times;</button>
        
        <div class="login-form-container">
          <div class="login-header">
            <h3>Оформление заказа</h3>
            <p>Заполните данные для доставки</p>
          </div>
          
          <form id="checkoutForm">
            <div class="form-group">
              <label>Адрес доставки *</label>
              <input type="text" id="shippingAddress" required placeholder="Введите адрес доставки">
            </div>
            
            <div class="form-group">
              <label>Способ оплаты *</label>
              <select id="paymentMethod" required style="width: 100%; padding: 14px 16px; border: 2px solid #e8e2dc; border-radius: 10px; font-size: 15px; background: #fbf9f6;">
                <option value="">Выберите способ оплаты</option>
                <option value="card">Банковская карта</option>
                <option value="cash">Наличные при получении</option>
                <option value="online">Онлайн-оплата</option>
              </select>
            </div>
            
            <div class="summary-card" style="margin: 20px 0; background: #f8f5f2; padding: 20px; border-radius: 10px;">
              <h4 style="margin-top: 0;">Состав заказа</h4>
              ${this.cartItems.map(item => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>${item.name} × ${item.quantity}</span>
                  <span>${this.formatPrice(item.price * item.quantity)}</span>
                </div>
              `).join('')}
              <div style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px; font-weight: bold;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Итого:</span>
                  <span>${this.formatPrice(this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
                </div>
              </div>
            </div>
            
            <button type="submit" class="submit-btn">Подтвердить заказ</button>
          </form>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    document.getElementById('closeCheckoutModal').addEventListener('click', () => {
      modal.remove()
    })

    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        modal.remove()
      }
    })

    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
      e.preventDefault()

      const shippingAddress = document.getElementById('shippingAddress').value
      const paymentMethod = document.getElementById('paymentMethod').value

      if (!shippingAddress || !paymentMethod) {
        this.showNotification('Заполните все обязательные поля', 'error')
        return
      }

      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            shippingAddress: shippingAddress,
            paymentMethod: paymentMethod
          })
        })

        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          
          if (response.ok) {
            modal.remove()
            this.showNotification(`Заказ успешно оформлен! Номер заказа: #${data.orderId}`, 'success')
            this.clearCart()
            
            setTimeout(() => {
              window.location.href = 'account.html'
            }, 2000)
          } else {
            this.showNotification(data.error || 'Ошибка оформления заказа', 'error')
          }
        } else {
          const text = await response.text()
          console.error('Неожиданный ответ от сервера:', text)
          this.showNotification('Ошибка сервера. Пожалуйста, попробуйте позже.', 'error')
        }
      } catch (error) {
        console.error('Ошибка оформления заказа:', error)
        this.showNotification('Ошибка соединения с сервером', 'error')
      }
    })
  }

  async clearCart() {
    try {
      for (const item of this.cartItems) {
        await fetch(`/api/cart?productId=${item.product_id}`, {
          method: 'DELETE'
        })
      }
      this.cartItems = []
      this.saveToStorage()
      this.renderCart()
    } catch (error) {
      console.error('Ошибка очистки:', error)
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.textContent = message
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      z-index: 10000;
    `

    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const savedCount = localStorage.getItem('cartTotalCount') || '0'
  document.querySelectorAll('.cart-count').forEach(counter => {
    counter.textContent = savedCount
  })

  if (document.querySelector('.cart-items')) {
    new Cart()
  }
})