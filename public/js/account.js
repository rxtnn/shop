class AccountPage {
  constructor() {
    this.user = null;
    this.isEditing = false;
    this.init();
  }

  async init() {
    await this.loadUserData();
    this.setupEventListeners();
    await this.loadOrdersHistory();
  }

  async loadUserData() {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        this.renderUserInfo();
        
        document.getElementById('logoutBtn').style.display = 'inline-block';
        document.getElementById('toggleEditBtn').style.display = 'inline-block';
      } else {
        window.location.href = 'index.html';
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      this.showNotification('Ошибка загрузки данных', 'error');
    }
  }

  renderUserInfo() {
    const container = document.getElementById('userInfo');
    
    if (this.isEditing) {
      container.innerHTML = this.getEditForm();
    } else {
      container.innerHTML = this.getUserInfoCard();
    }
  }

  getUserInfoCard() {
    return `
      <div class="card">
        <h3>Личная информация</h3>
        <div style="line-height: 1.6;">
          <p><strong>Имя:</strong> ${this.user.firstName}</p>
          <p><strong>Фамилия:</strong> ${this.user.lastName || 'Не указана'}</p>
          <p><strong>Email:</strong> ${this.user.email}</p>
          <p><strong>Телефон:</strong> ${this.user.phone || 'Не указан'}</p>
          <p><strong>Роль:</strong> ${this.user.role}</p>
        </div>
      </div>
      <div class="card">
        <h3>Безопасность</h3>
        <p>Измените пароль для защиты вашего аккаунта</p>
        <button class="cta" style="margin-top: 15px; background: transparent; color: #8b5e3c; border: 2px solid #8b5e3c;" 
                onclick="accountPage.changePassword()">
          Сменить пароль
        </button>
      </div>
    `;
  }

  getEditForm() {
    return `
      <div class="card">
        <h3>Редактирование данных</h3>
        <form id="editUserForm" style="margin-top: 20px;">
          <div class="form-group">
            <label>Имя *</label>
            <input type="text" id="editFirstName" value="${this.user.firstName}" required 
                   style="width: 100%; padding: 10px; border: 1px solid #e8e2dc; border-radius: 6px;">
          </div>
          
          <div class="form-group">
            <label>Фамилия</label>
            <input type="text" id="editLastName" value="${this.user.lastName || ''}" 
                   style="width: 100%; padding: 10px; border: 1px solid #e8e2dc; border-radius: 6px;">
          </div>
          
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="editEmail" value="${this.user.email}" required 
                   style="width: 100%; padding: 10px; border: 1px solid #e8e2dc; border-radius: 6px;">
          </div>
          
          <div class="form-group">
            <label>Телефон</label>
            <input type="tel" id="editPhone" value="${this.user.phone || ''}" 
                   style="width: 100%; padding: 10px; border: 1px solid #e8e2dc; border-radius: 6px;">
          </div>
          
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button type="submit" class="cta">Сохранить</button>
            <button type="button" class="cta" style="background: transparent; color: #8b5e3c; border: 2px solid #8b5e3c;"
                    onclick="accountPage.cancelEdit()">
              Отмена
            </button>
          </div>
        </form>
      </div>
      <div class="card">
        <h3>Важная информация</h3>
        <ul style="color: #6b5f57; font-size: 14px; line-height: 1.5;">
          <li>Поля помеченные * обязательны для заполнения</li>
          <li>После изменения email потребуется подтверждение</li>
          <li>Изменения вступят в силу сразу после сохранения</li>
        </ul>
      </div>
    `;
  }

  setupEventListeners() {
    document.getElementById('toggleEditBtn').addEventListener('click', () => {
      this.toggleEdit();
    });

    document.addEventListener('submit', (e) => {
      if (e.target.id === 'editUserForm') {
        e.preventDefault();
        this.saveUserData();
      }
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    document.getElementById('toggleEditBtn').textContent = 
      this.isEditing ? 'Отменить редактирование' : 'Редактировать данные';
    this.renderUserInfo();
  }

  cancelEdit() {
    this.isEditing = false;
    document.getElementById('toggleEditBtn').textContent = 'Редактировать данные';
    this.renderUserInfo();
  }

  async saveUserData() {
    const formData = {
      firstName: document.getElementById('editFirstName').value,
      lastName: document.getElementById('editLastName').value,
      email: document.getElementById('editEmail').value,
      phone: document.getElementById('editPhone').value
    };

    if (!formData.firstName || !formData.email) {
      this.showNotification('Заполните обязательные поля', 'error');
      return;
    }

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        this.isEditing = false;
        document.getElementById('toggleEditBtn').textContent = 'Редактировать данные';
        this.renderUserInfo();
        this.showNotification('Данные успешно обновлены', 'success');
      } else {
        const error = await response.json();
        this.showNotification(error.error || 'Ошибка обновления', 'error');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      this.showNotification('Ошибка соединения с сервером', 'error');
    }
  }

  async loadOrdersHistory() {
    try {
      const response = await fetch('/api/user/orders', {
        credentials: 'include'
      });

      const ordersContainer = document.getElementById('ordersHistory');
      
      if (response.ok) {
        const orders = await response.json();
        this.renderOrders(orders);
      } else {
        ordersContainer.innerHTML = `
          <div class="card" style="text-align: center; padding: 40px;">
            <h4>История заказов пуста</h4>
            <p>У вас еще нет завершенных заказов</p>
            <a href="catalog.html" class="cta" style="margin-top: 15px;">Перейти к покупкам</a>
          </div>
        `;
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      document.getElementById('ordersHistory').innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <p style="color: #e74c3c;">Ошибка загрузки истории заказов</p>
        </div>
      `;
    }
  }

  renderOrders(orders) {
    const container = document.getElementById('ordersHistory');
    
    if (orders.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <h4>История заказов пуста</h4>
          <p>У вас еще нет завершенных заказов</p>
          <a href="catalog.html" class="cta" style="margin-top: 15px;">Перейти к покупкам</a>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="card" style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: between; align-items: start; flex-wrap: wrap; gap: 15px;">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 10px 0;">Заказ #${order.id}</h4>
            <p style="margin: 0; color: #6b5f57; font-size: 14px;">
              ${new Date(order.order_date).toLocaleDateString('ru-RU')}
            </p>
            <p style="margin: 5px 0; color: #6b5f57;">
              Статус: <span style="color: ${
                order.status === 'completed' ? '#27ae60' : 
                order.status === 'processing' ? '#f39c12' : '#e74c3c'
              };">${this.getStatusText(order.status)}</span>
            </p>
          </div>
          <div style="text-align: right;">
            <strong style="font-size: 18px; color: #8b5e3c;">
              ${this.formatPrice(order.total_amount)}
            </strong>
            <button class="cta" style="margin-top: 10px; padding: 5px 10px; font-size: 12px;"
                    onclick="accountPage.viewOrderDetails(${order.id})">
              Подробнее
            </button>
          </div>
        </div>
        
        <!-- Детали заказа (скрыты по умолчанию) -->
        <div id="orderDetails-${order.id}" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e8e2dc;">
          <h5 style="margin: 0 0 10px 0;">Состав заказа:</h5>
          ${order.items ? order.items.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f5f5f5;">
              <span>${item.product_name} × ${item.quantity}</span>
              <span>${this.formatPrice(item.unit_price * item.quantity)}</span>
            </div>
          `).join('') : '<p>Информация о товарах недоступна</p>'}
          
          ${order.shipping_address ? `
            <div style="margin-top: 10px;">
              <strong>Адрес доставки:</strong> ${order.shipping_address}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  getStatusText(status) {
    const statusMap = {
      'pending': 'Ожидание',
      'processing': 'В обработке',
      'shipped': 'Отправлен',
      'completed': 'Завершен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  }

  formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  }

  viewOrderDetails(orderId) {
    const detailsElement = document.getElementById(`orderDetails-${orderId}`);
    if (detailsElement) {
      detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
    }
  }

  changePassword() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        
        <div class="login-form-container">
          <div class="login-header">
            <h3>Смена пароля</h3>
            <p>Введите текущий и новый пароль</p>
          </div>
          
          <form id="changePasswordForm">
            <div class="form-group">
              <label>Текущий пароль *</label>
              <input type="password" id="currentPassword" required placeholder="Введите текущий пароль">
            </div>
            
            <div class="form-group">
              <label>Новый пароль *</label>
              <input type="password" id="newPassword" required placeholder="Введите новый пароль (минимум 6 символов)" minlength="6">
            </div>
            
            <div class="form-group">
              <label>Подтвердите новый пароль *</label>
              <input type="password" id="confirmPassword" required placeholder="Повторите новый пароль">
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button type="submit" class="cta">Сменить пароль</button>
              <button type="button" class="cta" style="background: transparent; color: #8b5e3c; border: 2px solid #8b5e3c;"
                      onclick="this.closest('.modal').remove()">
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (!currentPassword || !newPassword || !confirmPassword) {
        this.showNotification('Заполните все поля', 'error');
        return;
      }

      if (newPassword.length < 6) {
        this.showNotification('Новый пароль должен содержать минимум 6 символов', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        this.showNotification('Новые пароли не совпадают', 'error');
        return;
      }

      try {
        const response = await fetch('/api/user/change-password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        });

        if (response.ok) {
          modal.remove();
          this.showNotification('Пароль успешно изменен', 'success');
        } else {
          const error = await response.json();
          this.showNotification(error.error || 'Ошибка смены пароля', 'error');
        }
      } catch (error) {
        console.error('Ошибка смены пароля:', error);
        this.showNotification('Ошибка соединения с сервером', 'error');
      }
    });
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: relative;
      background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      margin-bottom: 15px;
      z-index: 100;
    `;
    
    const container = document.getElementById('notificationArea');
    container.innerHTML = '';
    container.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

let accountPage;

document.addEventListener('DOMContentLoaded', () => {
  accountPage = new AccountPage();
});