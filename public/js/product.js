class ProductPage {
  constructor() {
    this.productId = this.getProductIdFromURL();
    this.product = null;
    this.currentSlide = 0;
    this.images = [];
    this.init();
  }

  init() {
    if (this.productId) {
      this.loadProduct();
    } else {
      this.showError('ID товара не указан');
    }
  }

  getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  async loadProduct() {
    try {
      const response = await fetch(`/api/product?id=${this.productId}`);
      
      if (response.ok) {
        this.product = await response.json();
        this.images = this.getProductImages();
        this.renderProduct();
      } else if (response.status === 404) {
        this.showError('Товар не найден');
      } else {
        throw new Error('Ошибка сервера');
      }
    } catch (error) {
      console.error('Ошибка загрузки товара:', error);
      this.showError('Ошибка загрузки товара');
    }
  }

  getProductImages() {
    const baseImage = this.product.image_url;
    
    const additionalImages = [
      baseImage,
      this.getAlternativeImage(baseImage, 'view1'),
      this.getAlternativeImage(baseImage, 'view2'),
      this.getAlternativeImage(baseImage, 'view3'),
      this.getAlternativeImage(baseImage, 'view4'),
      this.getAlternativeImage(baseImage, 'view5')
    ].filter(img => img !== null);

    return additionalImages;
  }

  getAlternativeImage(baseImage, viewType) {
    if (!baseImage) return null;

    if (baseImage.includes('hoff.ru')) {
      const baseUrl = baseImage.split('?')[0];
      
      switch(viewType) {
        case 'view1':
          return baseImage;
        case 'view2':
          return baseUrl.replace('/upload/', '/upload/iblock/') + '?view=angle';
        case 'view3':
          return baseUrl.replace('/upload/', '/upload/iblock/') + '?view=front';
        case 'view4':
          return baseUrl.replace('/upload/', '/upload/iblock/') + '?view=side';
        case 'view5':
          return baseUrl.replace('/upload/', '/upload/iblock/') + '?view=detail';
        default:
          return baseImage;
      }
    }
    
    return baseImage;
  }

  renderProduct() {
    document.title = `${this.product.name} — Магазин мебели`;
    
    const container = document.getElementById('productContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    
    loadingMessage.style.display = 'none';
    
    container.innerHTML = `
      <div>
        <!-- Слайдер товара -->
        <div class="product-slider">
          <div class="main-slider">
            ${this.images.map((img, index) => `
              <img src="${img}" alt="${this.product.name} - вид ${index + 1}" 
                   class="main-slide ${index === 0 ? 'active' : ''}" 
                   onerror="this.src='https://via.placeholder.com/600x400?text=Image+${index + 1}'">
            `).join('')}
          </div>
          
          ${this.images.length > 1 ? `
            <div class="slider-controls">
              <button class="slider-nav slider-prev">‹</button>
              <button class="slider-nav slider-next">›</button>
            </div>
            
            <div class="thumbnails">
              ${this.images.map((img, index) => `
                <img src="${img}" alt="${this.product.name} - миниатюра ${index + 1}" 
                     class="thumbnail ${index === 0 ? 'active' : ''}"
                     data-index="${index}"
                     onerror="this.src='https://via.placeholder.com/80x80?text=Thumb+${index + 1}'">
              `).join('')}
            </div>
          ` : ''}
        </div>

        <section class="section">
          <h2>Описание</h2>
          <p>${this.product.description || 'Описание отсутствует'}</p>
          
          <h3>Характеристики</h3>
          <ul>
            <li><strong>Материал:</strong> ${this.product.material || 'Не указан'}</li>
            <li><strong>Цвет:</strong> ${this.product.color || 'Не указан'}</li>
            ${this.product.dimensions ? `<li><strong>Размеры:</strong> ${this.product.dimensions}</li>` : ''}
            ${this.product.weight ? `<li><strong>Вес:</strong> ${this.product.weight} кг</li>` : ''}
            <li><strong>Категория:</strong> ${this.product.category_name || 'Не указана'}</li>
            ${this.product.manufacturer_name ? `<li><strong>Производитель:</strong> ${this.product.manufacturer_name}</li>` : ''}
          </ul>
          
          ${this.getAdditionalInfo()}
        </section>
      </div>
      
      <aside class="card">
        <h3>${this.product.name}</h3>
        <p class="price">${this.formatPrice(this.product.price)}</p>
        <p><strong>Категория:</strong> ${this.product.category_name || 'Не указана'}</p>
        <p><strong>Доступность:</strong> <span style="color: #27ae60;">В наличии</span></p>
        
        <div style="margin: 20px 0;">
          <label for="quantity" style="display: block; margin-bottom: 8px; font-weight: 500;">Количество:</label>
          <div class="quantity-controls" style="display: flex; align-items: center; gap: 15px; justify-content: flex-start;">
            <button class="quantity-btn minus">-</button>
            <span class="quantity">1</span>
            <button class="quantity-btn plus">+</button>
          </div>
        </div>
        
        <button class="cta add-to-cart-btn" style="display: block; text-align: center; margin-bottom: 10px; width: 100%;">
          Добавить в корзину
        </button>
      </aside>
    `;

    this.setupEventListeners();
    this.setupSlider();
  }

  setupSlider() {
    if (this.images.length <= 1) return;

    const mainSlides = document.querySelectorAll('.main-slide');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');

    const showSlide = (index) => {
      mainSlides.forEach(slide => {
        slide.classList.remove('active');
      });
      thumbnails.forEach(thumb => thumb.classList.remove('active'));
      
      setTimeout(() => {
        mainSlides[index].classList.add('active');
        thumbnails[index].classList.add('active');
        this.currentSlide = index;
      }, 50);
    };

    thumbnails.forEach((thumb, index) => {
      thumb.addEventListener('click', () => showSlide(index));
    });

    prevBtn.addEventListener('click', () => {
      const newIndex = this.currentSlide === 0 ? this.images.length - 1 : this.currentSlide - 1;
      showSlide(newIndex);
    });

    nextBtn.addEventListener('click', () => {
      const newIndex = this.currentSlide === this.images.length - 1 ? 0 : this.currentSlide + 1;
      showSlide(newIndex);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        const newIndex = this.currentSlide === 0 ? this.images.length - 1 : this.currentSlide - 1;
        showSlide(newIndex);
      } else if (e.key === 'ArrowRight') {
        const newIndex = this.currentSlide === this.images.length - 1 ? 0 : this.currentSlide + 1;
        showSlide(newIndex);
      }
    });
  }

  getAdditionalInfo() {
    const info = [];
    
    if (this.product.manufacturer_name) {
      info.push(`<li><strong>Производитель:</strong> ${this.product.manufacturer_name}</li>`);
    }
    
    if (info.length > 0) {
      return `
        <h3>Дополнительная информация</h3>
        <ul>
          ${info.join('')}
        </ul>
      `;
    }
    
    return '';
  }

  formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  }

  setupEventListeners() {
    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');
    const quantityElement = document.querySelector('.quantity');
    const addToCartBtn = document.querySelector('.add-to-cart-btn');

    if (minusBtn && plusBtn && quantityElement) {
      minusBtn.addEventListener('click', () => {
        let quantity = parseInt(quantityElement.textContent);
        if (quantity > 1) {
          quantityElement.textContent = quantity - 1;
        }
      });

      plusBtn.addEventListener('click', () => {
        let quantity = parseInt(quantityElement.textContent);
        quantityElement.textContent = quantity + 1;
      });
    }

    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', async () => {
        const quantity = parseInt(quantityElement.textContent);

        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: parseInt(this.productId),
              quantity: quantity
            })
          });

          if (response.ok) {
            const cartResponse = await fetch('/api/cart');
            const cartItems = await cartResponse.json();
            const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            
            localStorage.setItem('cartTotalCount', totalCount.toString());
            
            document.querySelectorAll('.cart-count').forEach(counter => {
              counter.textContent = totalCount;
            });
            
            this.showNotification('Товар добавлен в корзину');
          } else {
            this.showNotification('Ошибка добавления в корзину', 'error');
          }
        } catch (error) {
          console.error('Ошибка добавления в корзину:', error);
          this.showNotification('Ошибка добавления в корзину', 'error');
        }
      });
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      z-index: 10000;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  showError(message) {
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'block';
    console.error(message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ProductPage();
});