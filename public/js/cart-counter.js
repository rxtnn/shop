
class CartCounter {
  constructor() {
    this.init()
  }

  init() {
    this.updateCounter()
    this.setupStorageListener()
  }

  updateCounter() {
    const totalCount = localStorage.getItem('cartTotalCount') || '0'
    const cartCountElements = document.querySelectorAll('.cart-count')
    cartCountElements.forEach(element => {
      element.textContent = totalCount
    })
  }

  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'cartTotalCount') {
        this.updateCounter()
      }
    })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new CartCounter()
})