class Catalog {
  constructor() {
    this.products = []
    this.filteredProducts = []
    this.categories = []
    this.filters = {
      categories: [],
      priceRange: [0, 50000],
      materials: [],
      searchQuery: ''
    }
    this.currentCategory = null
    this.init()
  }

  async init() {
    console.log('Инициализация каталога...')
    await this.loadCategories()
    await this.loadProducts()
    this.setupEventListeners()
    this.updateCartCounter()
    

    this.handleUrlParams()
  }

  async loadCategories() {
    try {
      console.log('Загрузка категорий...')
      const response = await fetch('/api/categories')
      if (response.ok) {
        this.categories = await response.json()
        console.log(`Загружено ${this.categories.length} категорий:`, this.categories)
        this.renderCategories()
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error)
    }
  }

  async loadProducts() {
    try {
      console.log('Загрузка товаров...')
      const response = await fetch('/api/products')
      if (response.ok) {
        this.products = await response.json()
        console.log(`Загружено ${this.products.length} товаров:`, this.products)
        this.filteredProducts = [...this.products]
        this.renderProducts()
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error)
      this.showNotification('Ошибка загрузки товаров', 'error')
    } finally {
      document.getElementById('loadingMessage').style.display = 'none'
    }
  }

  renderCategories() {
    const container = document.getElementById('categoriesFilter')
    if (!container) {
      console.error('Контейнер категорий не найден')
      return
    }
    
    console.log('Рендеринг категорий...')
    container.innerHTML = this.categories.map(category => `
      <label class="filter-option">
        <input type="checkbox" name="category" value="${category.id}" 
               ${this.currentCategory && this.currentCategory.id === category.id ? 'checked' : ''}>
        ${category.name}
      </label>
    `).join('')
  }

  renderProducts() {
    const container = document.getElementById('productsGrid')
    if (!container) {
      console.error('Контейнер товаров не найден')
      return
    }
    
    console.log(`Рендеринг ${this.filteredProducts.length} товаров...`)
    
    if (this.filteredProducts.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <h3>Товары не найдены</h3>
          <p>Попробуйте изменить параметры фильтрации</p>
          <button class="cta" onclick="catalog.resetFilters()" style="margin-top: 15px;">Сбросить фильтры</button>
        </div>
      `
      document.getElementById('noProductsMessage').style.display = 'none'
      return
    }

    document.getElementById('noProductsMessage').style.display = 'none'
    
    container.innerHTML = this.filteredProducts.map(product => `
      <article class="card" data-product-id="${product.id}">
        <img src="${product.image_url}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
        <h3>${product.name}</h3>
        <p class="price">${this.formatPrice(product.price)}</p>
        <p class="category">${product.category_name}</p>
        ${product.material ? `<p class="material"><small>Материал: ${product.material}</small></p>` : ''}
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button class="cta add-to-cart-btn" data-product-id="${product.id}">В корзину</button>
          <a class="cta" href="/product.html?id=${product.id}" style="background: transparent; color: #8b5e3c; border: 2px solid #8b5e3c; text-decoration: none;">Подробнее</a>
        </div>
      </article>
    `).join('')

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        this.addToCart(e.target.dataset.productId)
      })
    })
  }

  setupEventListeners() {
    console.log('Настройка обработчиков событий...')
    
    const searchBtn = document.getElementById('searchBtn')
    const searchInput = document.getElementById('searchInput')
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.applyFilters())
    }
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.searchQuery = e.target.value
        this.applyFilters()
      })
    }

    const priceSlider = document.getElementById('priceSlider')
    if (priceSlider) {
      const maxPrice = Math.max(...this.products.map(p => p.price), 50000)
      priceSlider.max = maxPrice
      priceSlider.value = maxPrice
      
      const maxPriceElement = document.getElementById('maxPrice')
      if (maxPriceElement) {
        maxPriceElement.textContent = this.formatPrice(maxPrice)
      }
      
      this.filters.priceRange[1] = maxPrice
      
      priceSlider.addEventListener('input', (e) => {
        this.filters.priceRange[1] = parseInt(e.target.value)
        const maxPriceElement = document.getElementById('maxPrice')
        if (maxPriceElement) {
          maxPriceElement.textContent = this.formatPrice(e.target.value)
        }
      })
    }

    const applyFiltersBtn = document.getElementById('applyFilters')
    const resetFiltersBtn = document.getElementById('resetFilters')
    
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => this.applyFilters())
    }
    
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => this.resetFilters())
    }

    document.addEventListener('change', (e) => {
      if (e.target.name === 'category' || e.target.name === 'material') {
        this.applyFilters()
      }
    })
  }

  applyFilters() {
    console.log('Применение фильтров...', this.filters)
    
    this.filteredProducts = this.products.filter(product => {
      const categoryCheckboxes = document.querySelectorAll('input[name="category"]:checked')
      if (categoryCheckboxes.length > 0) {
        const selectedCategories = Array.from(categoryCheckboxes).map(cb => parseInt(cb.value))
        if (!selectedCategories.includes(product.category_id)) {
          console.log(`Товар ${product.name} отфильтрован по категории`)
          return false
        }
      }

      if (product.price < this.filters.priceRange[0] || product.price > this.filters.priceRange[1]) {
        console.log(`Товар ${product.name} отфильтрован по цене`)
        return false
      }

      const materialCheckboxes = document.querySelectorAll('input[name="material"]:checked')
      if (materialCheckboxes.length > 0) {
        const selectedMaterials = Array.from(materialCheckboxes).map(cb => cb.value)
        if (!selectedMaterials.some(material => product.material?.includes(material))) {
          console.log(`Товар ${product.name} отфильтрован по материалу`)
          return false
        }
      }

      if (this.filters.searchQuery) {
        const query = this.filters.searchQuery.toLowerCase()
        if (!product.name.toLowerCase().includes(query) && 
            !product.description.toLowerCase().includes(query)) {
          console.log(`Товар ${product.name} отфильтрован по поиску`)
          return false
        }
      }

      return true
    })

    console.log(`После фильтрации осталось ${this.filteredProducts.length} товаров`)
    this.renderProducts()
  }

  resetFilters() {
    console.log('Сброс фильтров...')
    
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false
    })
    
    const priceSlider = document.getElementById('priceSlider')
    if (priceSlider) {
      const maxPrice = Math.max(...this.products.map(p => p.price), 50000)
      priceSlider.value = maxPrice
    }
    
    const maxPriceElement = document.getElementById('maxPrice')
    if (maxPriceElement) {
      const maxPrice = Math.max(...this.products.map(p => p.price), 50000)
      maxPriceElement.textContent = this.formatPrice(maxPrice)
    }
    
    const searchInput = document.getElementById('searchInput')
    if (searchInput) {
      searchInput.value = ''
    }
    
    const maxPrice = Math.max(...this.products.map(p => p.price), 50000)
    this.filters = {
      categories: [],
      priceRange: [0, maxPrice],
      materials: [],
      searchQuery: ''
    }
    
    this.currentCategory = null
    this.filteredProducts = [...this.products]
    
    this.renderProducts()
    
    const url = new URL(window.location)
    url.search = ''
    window.history.replaceState({}, '', url)
  }

  handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search)
    const categoryId = urlParams.get('category')
    
    if (categoryId) {
      console.log('Обработка параметра категории из URL:', categoryId)
      
      const category = this.categories.find(c => c.id == categoryId)
      if (category) {
        this.currentCategory = category
        
        setTimeout(() => {
          const categoryCheckbox = document.querySelector(`input[name="category"][value="${categoryId}"]`)
          if (categoryCheckbox) {
            categoryCheckbox.checked = true
            this.applyFilters()
          }
        }, 100)
      }
    }
  }

  async addToCart(productId) {
    try {
      console.log(`Добавление товара ${productId} в корзину...`)
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: parseInt(productId),
          quantity: 1
        })
      })

      if (response.ok) {
        const cartResponse = await fetch('/api/cart')
        const cartItems = await cartResponse.json()
        const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
        
        localStorage.setItem('cartTotalCount', totalCount.toString())
        this.updateCartCounter()
        this.showNotification('Товар добавлен в корзину')
      } else {
        console.error('Ошибка добавления в корзину:', response.status)
        this.showNotification('Ошибка добавления в корзину', 'error')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      this.showNotification('Ошибка добавления в корзину', 'error')
    }
  }

  formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price)
  }

  updateCartCounter() {
    const totalCount = localStorage.getItem('cartTotalCount') || '0'
    document.querySelectorAll('.cart-count').forEach(counter => {
      counter.textContent = totalCount
    })
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div')
    notification.className = 'notification'
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

let catalog

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM загружен, инициализация каталога...')
  catalog = new Catalog()
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'cartTotalCount') {
      document.querySelectorAll('.cart-count').forEach(counter => {
        counter.textContent = e.newValue || '0'
      })
    }
  })
})