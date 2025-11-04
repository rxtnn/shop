
document.addEventListener("DOMContentLoaded", () => {
  const authButton = document.getElementById("authButton")
  const loginModal = document.getElementById("loginModal")
  const closeModal = document.getElementById("closeModal")
  const loginForm = document.getElementById("loginForm")
  const logoutBtn = document.getElementById("logoutBtn")
  const registerLinks = document.querySelectorAll('.register-link a')


  if (authButton) {
    authButton.style.visibility = 'hidden';

    authButton.style.minWidth = '120px';
    authButton.style.minHeight = '40px';
  }

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        updateUIForLoggedInUser(data.user)
      } else {
        updateUIForLoggedOutUser()
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error)
      updateUIForLoggedOutUser()
    } finally {
      if (authButton) {
        authButton.style.visibility = 'visible';
      }
    }
  }

  function updateUIForLoggedInUser(user) {
    if (authButton) {
      authButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span style="margin-left: 5px;">${user.firstName || 'Кабинет'}</span>
      `
      authButton.href = "account.html"
      authButton.classList.add('account-icon')
    }

    if (logoutBtn) {
      logoutBtn.style.display = "inline-block"
    }

    updateAccountPage(user)
  }

  function updateUIForLoggedOutUser() {
    if (authButton) {
      authButton.innerHTML = "Войти"
      authButton.href = "#"
      authButton.classList.remove('account-icon')
    }

    if (logoutBtn) {
      logoutBtn.style.display = "none"
    }
    if (window.location.pathname.includes("account.html")) {
      window.location.href = "index.html"
    }
  }

  function updateAccountPage(user) {
    if (window.location.pathname.includes("account.html")) {
      const userInfoElement = document.getElementById('userInfo')
      if (userInfoElement) {
        userInfoElement.innerHTML = `
          <div class="card">
            <h3>Информация о пользователе</h3>
            <p><strong>Имя:</strong> ${user.firstName} ${user.lastName || ''}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            ${user.phone ? `<p><strong>Телефон:</strong> ${user.phone}</p>` : ''}
            <p><strong>Роль:</strong> ${user.role}</p>
          </div>
        `
      }
    }
  }

  if (authButton) {
    authButton.addEventListener("click", (e) => {
      if (authButton.classList.contains('account-icon')) {
        return 
      }
      
      e.preventDefault()
      showLoginForm()
      loginModal.classList.add("active")
      document.body.style.overflow = "hidden"
    })
  }

  function closeLoginModal() {
    loginModal.classList.remove("active")
    document.body.style.overflow = "auto"
  }

  if (closeModal) {
    closeModal.addEventListener("click", closeLoginModal)
  }

  if (loginModal) {
    loginModal.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-backdrop")) {
        closeLoginModal()
      }
    })
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && loginModal.classList.contains("active")) {
      closeLoginModal()
    }
  })

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const email = document.getElementById("loginEmail").value
      const password = document.getElementById("loginPassword").value
      const rememberMe = document.getElementById("rememberMe").checked

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: email,
            password: password,
            rememberMe: rememberMe
          })
        })

        const data = await response.json()

        if (response.ok) {
          closeLoginModal()

          await checkAuthStatus()

          showNotification('Вы успешно вошли в систему!', 'success')

          setTimeout(() => {
            window.location.href = "account.html"
          }, 1000)
        } else {
          showNotification(data.error || 'Ошибка входа', 'error')
        }
      } catch (error) {
        console.error('Ошибка входа:', error)
        showNotification('Ошибка соединения с сервером', 'error')
      }
    })
  }

  registerLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      showRegisterForm()
    })
  })

  function showRegisterForm() {
    const modalContent = document.querySelector('.modal-content')
    modalContent.innerHTML = `
      <button class="modal-close" id="closeModal">&times;</button>
      
      <div class="login-form-container">
        <div class="login-header">
          <h3>Регистрация</h3>
          <p>Создайте новый аккаунт</p>
        </div>
        
        <form id="registerForm">
          <div class="form-group">
            <label>Имя *</label>
            <input type="text" id="registerName" required placeholder="Введите ваше имя">
          </div>
          
          <div class="form-group">
            <label>Фамилия</label>
            <input type="text" id="registerLastName" placeholder="Введите вашу фамилию">
          </div>
          
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="registerEmail" required placeholder="Введите ваш email">
          </div>
          
          <div class="form-group">
            <label>Телефон</label>
            <input type="tel" id="registerPhone" placeholder="Введите ваш телефон">
          </div>
          
          <div class="form-group">
            <label>Пароль *</label>
            <input type="password" id="registerPassword" required placeholder="Придумайте пароль (минимум 6 символов)" minlength="6">
          </div>
          
          <div class="form-group">
            <label>Подтвердите пароль *</label>
            <input type="password" id="registerConfirmPassword" required placeholder="Повторите пароль">
          </div>
          
          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" id="acceptTerms" required>
              Я принимаю <a href="#" style="color: #8b5e3c;">условия использования</a>
            </label>
          </div>
          
          <button type="submit" class="submit-btn">Зарегистрироваться</button>
        </form>
        
        <div class="register-link">
          <p>Уже есть аккаунт? <a href="#" class="login-link">Войти</a></p>
        </div>
      </div>
    `

    document.getElementById('closeModal').addEventListener('click', closeLoginModal)

    document.getElementById('registerForm').addEventListener('submit', handleRegister)

    document.querySelector('.login-link').addEventListener('click', (e) => {
      e.preventDefault()
      showLoginForm()
    })
  }

  function showLoginForm() {
    const modalContent = document.querySelector('.modal-content')
    modalContent.innerHTML = `
      <button class="modal-close" id="closeModal">&times;</button>
      
      <div class="login-form-container">
        <div class="login-header">
          <h3>Вход в аккаунт</h3>
          <p>Начните покупать с умом!</p>
        </div>
        
        <form id="loginForm">
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="loginEmail" required placeholder="Введите ваш email">
          </div>
          
          <div class="form-group">
            <label>Пароль</label>
            <input type="password" id="loginPassword" required placeholder="Введите ваш пароль">
          </div>
          
          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" id="rememberMe">
              Запомнить меня
            </label>
            <a href="#" class="forgot-password">Забыли пароль?</a>
          </div>
          
          <button type="submit" class="submit-btn">Войти</button>
        </form>
        
        <div class="register-link">
          <p>Еще нет аккаунта? <a href="#" class="register-link-btn">Зарегистрироваться</a></p>
        </div>
      </div>
    `

    document.getElementById('closeModal').addEventListener('click', closeLoginModal)

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById("loginEmail").value
      const password = document.getElementById("loginPassword").value
      const rememberMe = document.getElementById("rememberMe").checked

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: email,
            password: password,
            rememberMe: rememberMe
          })
        })

        const data = await response.json()

        if (response.ok) {
          closeLoginModal()
          await checkAuthStatus()
          showNotification('Вы успешно вошли в систему!', 'success')
          setTimeout(() => {
            window.location.href = "account.html"
          }, 1000)
        } else {
          showNotification(data.error || 'Ошибка входа', 'error')
        }
      } catch (error) {
        console.error('Ошибка входа:', error)
        showNotification('Ошибка соединения с сервером', 'error')
      }
    })

    document.querySelector('.register-link-btn').addEventListener('click', (e) => {
      e.preventDefault()
      showRegisterForm()
    })
  }

  async function handleRegister(e) {
    e.preventDefault()

    const firstName = document.getElementById("registerName").value
    const lastName = document.getElementById("registerLastName").value
    const email = document.getElementById("registerEmail").value
    const phone = document.getElementById("registerPhone").value
    const password = document.getElementById("registerPassword").value
    const confirmPassword = document.getElementById("registerConfirmPassword").value
    const acceptTerms = document.getElementById("acceptTerms").checked

    if (!firstName || !email || !password || !confirmPassword) {
      showNotification("Пожалуйста, заполните все обязательные поля", 'error')
      return
    }

    if (password.length < 6) {
      showNotification("Пароль должен содержать минимум 6 символов", 'error')
      return
    }

    if (password !== confirmPassword) {
      showNotification("Пароли не совпадают", 'error')
      return
    }

    if (!acceptTerms) {
      showNotification("Необходимо принять условия использования", 'error')
      return
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: password,
          phone: phone
        })
      })

      const data = await response.json()

      if (response.ok) {
        showNotification('Аккаунт успешно создан! Теперь вы можете войти.', 'success')
        
        setTimeout(() => {
          showLoginForm()
          document.getElementById('loginEmail').value = email
        }, 1500)
      } else {
        showNotification(data.error || 'Ошибка регистрации', 'error')
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error)
      showNotification('Ошибка соединения с сервером', 'error')
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const response = await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include'
        })

        if (response.ok) {
          showNotification("Вы вышли из аккаунта", 'success')
          setTimeout(() => {
            window.location.href = "index.html"
          }, 1000)
        }
      } catch (error) {
        console.error('Ошибка выхода:', error)
        showNotification('Ошибка при выходе из системы', 'error')
      }
    })
  }

  function showNotification(message, type = 'success') {
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.textContent = message

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `

    if (type === 'success') {
      notification.style.backgroundColor = '#4CAF50'
    } else {
      notification.style.backgroundColor = '#f44336'
    }

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 4000)
  }

  checkAuthStatus()
})