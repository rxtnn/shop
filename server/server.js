const http = require("http")
const fs = require("fs")
const path = require("path")
const url = require("url")
const mysql = require("mysql2")
const bcrypt = require("bcryptjs")

const PORT = 3000


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'furniture_shop'
})

db.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err)
    console.log('Продолжаем без базы данных...')
  } else {
    console.log('Успешное подключение к базе данных')
  }
})

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
}

let cartItems = []

let sessions = {}

function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function checkAuth(req) {
  const cookies = parseCookies(req.headers.cookie)
  const sessionToken = cookies.sessionToken
  
  if (sessionToken && sessions[sessionToken]) {
    return sessions[sessionToken]
  }
  return null
}

function parseCookies(cookieHeader) {
  const cookies = {}
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      cookies[name] = value
    })
  }
  return cookies
}

const apiRoutes = {
  '/api/register': async (req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ error: "Method not allowed" }))
    }

    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        const { firstName, lastName, email, password, phone } = JSON.parse(body)

        if (!email || !password || !firstName) {
          res.writeHead(400, { "Content-Type": "application/json" })
          return res.end(JSON.stringify({ error: "Все обязательные поля должны быть заполнены" }))
        }

        if (password.length < 6) {
          res.writeHead(400, { "Content-Type": "application/json" })
          return res.end(JSON.stringify({ error: "Пароль должен содержать минимум 6 символов" }))
        }

        const checkUserQuery = 'SELECT id FROM users WHERE email = ?'
        db.query(checkUserQuery, [email], async (err, results) => {
          if (err) {
            console.error('Ошибка проверки пользователя:', err)
            res.writeHead(500, { "Content-Type": "application/json" })
            return res.end(JSON.stringify({ error: "Database error" }))
          }

          if (results.length > 0) {
            res.writeHead(409, { "Content-Type": "application/json" })
            return res.end(JSON.stringify({ error: "Пользователь с таким email уже существует" }))
          }

          const hashedPassword = await bcrypt.hash(password, 10)

          const insertUserQuery = `
            INSERT INTO users (first_name, last_name, email, password_hash, phone, role) 
            VALUES (?, ?, ?, ?, ?, 'customer')
          `
          
          db.query(insertUserQuery, [firstName, lastName, email, hashedPassword, phone], (err, results) => {
            if (err) {
              console.error('Ошибка создания пользователя:', err)
              res.writeHead(500, { "Content-Type": "application/json" })
              return res.end(JSON.stringify({ error: "Ошибка создания пользователя" }))
            }

            console.log(`Пользователь создан: ${email}`)
            res.writeHead(201, { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            })
            res.end(JSON.stringify({ 
              success: true, 
              message: "Пользователь успешно зарегистрирован",
              userId: results.insertId 
            }))
          })
        })

      } catch (error) {
        console.error('Ошибка парсинга JSON:', error)
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid JSON" }))
      }
    })
  },

  '/api/login': async (req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ error: "Method not allowed" }))
    }

    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        const { email, password, rememberMe } = JSON.parse(body)

        if (!email || !password) {
          res.writeHead(400, { "Content-Type": "application/json" })
          return res.end(JSON.stringify({ error: "Email и пароль обязательны" }))
        }

        const findUserQuery = 'SELECT * FROM users WHERE email = ?'
        db.query(findUserQuery, [email], async (err, results) => {
          if (err) {
            console.error('Ошибка поиска пользователя:', err)
            res.writeHead(500, { "Content-Type": "application/json" })
            return res.end(JSON.stringify({ error: "Database error" }))
          }

          if (results.length === 0) {
            res.writeHead(401, { "Content-Type": "application/json" })
            return res.end(JSON.stringify({ error: "Неверный email или пароль" }))
          }

          const user = results[0]

          const isPasswordValid = await bcrypt.compare(password, user.password_hash)
          if (!isPasswordValid) {
            res.writeHead(401, { "Content-Type": "application/json" })
            return res.end(JSON.stringify({ error: "Неверный email или пароль" }))
          }

          const sessionToken = generateSessionToken()
          sessions[sessionToken] = {
            userId: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            role: user.role
          }

          const cookieOptions = [
            `sessionToken=${sessionToken}`,
            'HttpOnly',
            'Path=/'
          ]

          if (rememberMe) {
            cookieOptions.push('Max-Age=2592000') // 30 дней
          }

          console.log(`Пользователь вошел: ${email}`)
          res.writeHead(200, { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Set-Cookie": cookieOptions.join('; ')
          })
          res.end(JSON.stringify({ 
            success: true, 
            message: "Вход выполнен успешно",
            user: {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              phone: user.phone,
              role: user.role
            }
          }))
        })

      } catch (error) {
        console.error('Ошибка парсинга JSON:', error)
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid JSON" }))
      }
    })
  },

  '/api/logout': async (req, res) => {
    const cookies = parseCookies(req.headers.cookie)
    const sessionToken = cookies.sessionToken
    
    if (sessionToken && sessions[sessionToken]) {
      delete sessions[sessionToken]
    }

    res.writeHead(200, { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Set-Cookie": "sessionToken=; HttpOnly; Path=/; Max-Age=0"
    })
    res.end(JSON.stringify({ success: true, message: "Выход выполнен успешно" }))
  },

  '/api/user': async (req, res) => {
    const user = checkAuth(req)
    
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ error: "Not authenticated" }))
    }

    res.writeHead(200, { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    })
    res.end(JSON.stringify({ user }))
  },

  '/api/user/update': async (req, res) => {
    if (req.method !== 'PUT') {
      res.writeHead(405, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ error: "Method not allowed" }))
    }

    const user = checkAuth(req)
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ error: "Not authenticated" }))
    }

    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        const { firstName, lastName, email, phone } = JSON.parse(body)

        if (!firstName || !email) {
          res.writeHead(400, { "Content-Type": "application/json" })
          return res.end(JSON.stringify({ error: "Имя и email обязательны" }))
        }

        const checkEmailQuery = 'SELECT id FROM users WHERE email = ? AND id != ?'
        db.query(checkEmailQuery, [email, user.userId], (err, results) => {
          if (err) {
            console.error('Ошибка проверки email:', err)
            res.writeHead(500, { "Content-Type": "application/json" })
            return res.end(JSON.stringify({ error: "Database error" }))
          }

          if (results.length > 0) {
            res.writeHead(409, { "Content-Type": "application/json" })
            return res.end(JSON.stringify({ error: "Email уже используется другим пользователем" }))
          }

          const updateQuery = `
            UPDATE users 
            SET first_name = ?, last_name = ?, email = ?, phone = ?
            WHERE id = ?
          `
          
          db.query(updateQuery, [firstName, lastName, email, phone, user.userId], (err, results) => {
            if (err) {
              console.error('Ошибка обновления пользователя:', err)
              res.writeHead(500, { "Content-Type": "application/json" })
              return res.end(JSON.stringify({ error: "Ошибка обновления данных" }))
            }

            const sessionToken = parseCookies(req.headers.cookie).sessionToken
            if (sessionToken && sessions[sessionToken]) {
              sessions[sessionToken].firstName = firstName
              sessions[sessionToken].lastName = lastName
              sessions[sessionToken].email = email
              sessions[sessionToken].phone = phone
            }

            res.writeHead(200, { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            })
            res.end(JSON.stringify({ 
              success: true, 
              message: "Данные обновлены",
              user: {
                id: user.userId,
                firstName,
                lastName,
                email,
                phone,
                role: user.role
              }
            }))
          })
        })

      } catch (error) {
        console.error('Ошибка парсинга JSON:', error)
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid JSON" }))
      }
    })
  },

  '/api/user/change-password': async (req, res) => {
    if (req.method !== 'PUT') {
      res.writeHead(405, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ error: "Method not allowed" }))
    }

    const user = checkAuth(req)
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ error: "Not authenticated" }))
    }

    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        const { currentPassword, newPassword } = JSON.parse(body)

        if (!currentPassword || !newPassword) {
          res.writeHead(400, { "Content-Type": "application/json" })
          return res.end(JSON.stringify({ error: "Текущий и новый пароль обязательны" }))
        }

        if (newPassword.length < 6) {
          res.writeHead(400, { "Content-Type": "application/json" })
          return res.end(JSON.stringify({ error: "Новый пароль должен содержать минимум 6 символов" }))
        }

        const getUserQuery = 'SELECT password_hash FROM users WHERE id = ?'
        db.query(getUserQuery, [user.userId], async (err, results) => {
          if (err || results.length === 0) {
            console.error('Ошибка получения пользователя:', err)
            res.writeHead(500, { "Content-Type": "application/json" })
            return res.end(JSON.stringify({ error: "Database error" }))
          }

          const currentHashedPassword = results[0].password_hash

          const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentHashedPassword)
          if (!isCurrentPasswordValid) {
            res.writeHead(401, { "Content-Type": "application/json" })
            return res.end(JSON.stringify({ error: "Текущий пароль неверен" }))
          }

          const newHashedPassword = await bcrypt.hash(newPassword, 10)

          const updateQuery = 'UPDATE users SET password_hash = ? WHERE id = ?'
          
          db.query(updateQuery, [newHashedPassword, user.userId], (err, results) => {
            if (err) {
              console.error('Ошибка обновления пароля:', err)
              res.writeHead(500, { "Content-Type": "application/json" })
              return res.end(JSON.stringify({ error: "Ошибка обновления пароля" }))
            }

            res.writeHead(200, { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            })
            res.end(JSON.stringify({ 
              success: true, 
              message: "Пароль успешно изменен"
            }))
          })
        })

      } catch (error) {
        console.error('Ошибка парсинга JSON:', error)
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid JSON" }))
      }
    })
  },

  '/api/orders': async (req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ error: "Method not allowed" }))
    }

    const user = checkAuth(req)
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ error: "Not authenticated" }))
    }

    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        const { shippingAddress, paymentMethod } = JSON.parse(body)

        if (cartItems.length === 0) {
          res.writeHead(400, { "Content-Type": "application/json" })
          return res.end(JSON.stringify({ error: "Корзина пуста" }))
        }

        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        const createOrderQuery = `
          INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status) 
          VALUES (?, ?, ?, ?, 'processing')
        `
        
        db.query(createOrderQuery, [user.userId, totalAmount, shippingAddress, paymentMethod], (err, orderResults) => {
          if (err) {
            console.error('Ошибка создания заказа:', err)
            res.writeHead(500, { "Content-Type": "application/json" })
            return res.end(JSON.stringify({ error: "Ошибка создания заказа" }))
          }

          const orderId = orderResults.insertId

          const orderItemsQueries = cartItems.map(item => {
            return new Promise((resolve, reject) => {
              const insertItemQuery = `
                INSERT INTO order_items (order_id, product_id, quantity, unit_price) 
                VALUES (?, ?, ?, ?)
              `
              db.query(insertItemQuery, [orderId, item.product_id, item.quantity, item.price], (err, results) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(results)
                }
              })
            })
          })

          Promise.all(orderItemsQueries)
            .then(() => {
              cartItems = []
              
              res.writeHead(201, { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              })
              res.end(JSON.stringify({ 
                success: true, 
                message: "Заказ успешно создан",
                orderId: orderId,
                totalAmount: totalAmount
              }))
            })
            .catch(error => {
              console.error('Ошибка добавления товаров в заказ:', error)
              res.writeHead(500, { "Content-Type": "application/json" })
              res.end(JSON.stringify({ error: "Ошибка добавления товаров в заказ" }))
            })
        })

      } catch (error) {
        console.error('Ошибка парсинга JSON:', error)
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid JSON" }))
      }
    })
  },

  '/api/user/orders': async (req, res) => {
    const user = checkAuth(req)
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ error: "Not authenticated" }))
    }

    try {
      const query = `
        SELECT o.*, 
               GROUP_CONCAT(CONCAT(oi.product_id, ':', oi.quantity, ':', oi.unit_price, ':', p.name, ':', COALESCE(p.image_url, ''))) as items_data
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.order_date DESC
        LIMIT 10
      `
      
      db.query(query, [user.userId], (err, results) => {
        if (err) {
          console.error('Ошибка запроса заказов:', err)
          res.writeHead(500, { "Content-Type": "application/json" })
          return res.end(JSON.stringify({ error: "Database error" }))
        }

        const orders = results.map(order => {
          const items = order.items_data ? order.items_data.split(',').map(item => {
            const [productId, quantity, unitPrice, productName, imageUrl] = item.split(':')
            return {
              product_id: parseInt(productId),
              quantity: parseInt(quantity),
              unit_price: parseFloat(unitPrice),
              product_name: productName,
              image_url: imageUrl || 'https://via.placeholder.com/100x100?text=No+Image'
            }
          }) : []

          return {
            id: order.id,
            order_date: order.order_date,
            total_amount: parseFloat(order.total_amount),
            status: order.status,
            shipping_address: order.shipping_address,
            payment_method: order.payment_method,
            items: items
          }
        })

        res.writeHead(200, { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        })
        res.end(JSON.stringify(orders))
      })
    } catch (error) {
      console.error('Ошибка получения заказов:', error)
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Server error" }))
    }
  },

  '/api/products': async (req, res) => {
    try {
      console.log('Запрос товаров из БД...')
      
      const query = `
        SELECT p.*, c.name as category_name, m.name as manufacturer_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        ORDER BY p.id
      `
      
      db.query(query, (err, results) => {
        if (err) {
          console.error('Ошибка запроса к БД:', err)
          res.writeHead(500, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Database error" }))
        } else {
          console.log(`Получено ${results.length} товаров из БД`)
          
          const products = results.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price),
            category_name: product.category_name,
            category_id: product.category_id,
            image_url: product.image_url,
            material: product.material,
            color: product.color,
            dimensions: product.dimensions,
            weight: product.weight,
            manufacturer_id: product.manufacturer_id,
            manufacturer_name: product.manufacturer_name
          }))
          
          res.writeHead(200, { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          })
          res.end(JSON.stringify(products))
        }
      })
    } catch (error) {
      console.error('Ошибка получения товаров:', error)
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Server error" }))
    }
  },

  '/api/categories': async (req, res) => {
    try {
      console.log('Запрос категорий из БД...')
      
      db.query('SELECT * FROM categories ORDER BY id', (err, results) => {
        if (err) {
          console.error('Ошибка запроса категорий:', err)
          res.writeHead(500, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Database error" }))
        } else {
          console.log(`Получено ${results.length} категорий из БД`)
          res.writeHead(200, { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          })
          res.end(JSON.stringify(results))
        }
      })
    } catch (error) {
      console.error('Ошибка получения категорий:', error)
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Server error" }))
    }
  },

  '/api/product': async (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const productId = parsedUrl.query.id
    
    if (!productId) {
      res.writeHead(400, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ error: "Product ID is required" }))
    }

    try {
      console.log(`Запрос товара ${productId} из БД...`)
      
      const query = `
        SELECT p.*, c.name as category_name, m.name as manufacturer_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        WHERE p.id = ?
      `
      
      db.query(query, [productId], (err, results) => {
        if (err) {
          console.error('Ошибка запроса товара:', err)
          res.writeHead(500, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Database error" }))
        } else if (results.length === 0) {
          res.writeHead(404, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Product not found" }))
        } else {
          const product = results[0]
          const formattedProduct = {
            id: product.id,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price),
            category_name: product.category_name,
            category_id: product.category_id,
            image_url: product.image_url,
            material: product.material,
            color: product.color,
            dimensions: product.dimensions,
            weight: product.weight,
            manufacturer_id: product.manufacturer_id,
            manufacturer_name: product.manufacturer_name
          }
          
          res.writeHead(200, { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          })
          res.end(JSON.stringify(formattedProduct))
        }
      })
    } catch (error) {
      console.error('Ошибка получения товара:', error)
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Server error" }))
    }
  },
  
  '/api/cart': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    
    if (req.method === 'GET') {
      res.writeHead(200, { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      })
      res.end(JSON.stringify(cartItems))
    }
    
    else if (req.method === 'POST') {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      
      req.on('end', async () => {
        try {
          const { productId, quantity = 1 } = JSON.parse(body)
          console.log(`Добавление товара ${productId} в корзину...`)
          
          const query = 'SELECT * FROM products WHERE id = ?'
          db.query(query, [productId], (err, results) => {
            if (err || results.length === 0) {
              console.error('Товар не найден в БД:', productId)
              res.writeHead(404, { "Content-Type": "application/json" })
              res.end(JSON.stringify({ error: "Product not found" }))
              return
            }
            
            const product = results[0]
            const existingItem = cartItems.find(item => item.product_id == productId)
            
            if (existingItem) {
              existingItem.quantity += quantity
            } else {
              cartItems.push({
                cart_id: Date.now(),
                product_id: productId,
                quantity: quantity,
                name: product.name,
                price: parseFloat(product.price),
                image_url: product.image_url
              })
            }
            
            console.log(`Товар ${productId} добавлен в корзину. Всего товаров: ${cartItems.length}`)
            res.writeHead(200, { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            })
            res.end(JSON.stringify({ success: true }))
          })
        } catch (error) {
          console.error('Ошибка парсинга JSON:', error)
          res.writeHead(400, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Invalid JSON" }))
        }
      })
    }
    
    else if (req.method === 'DELETE') {
      const productId = parsedUrl.query.productId
      console.log(`Удаление товара ${productId} из корзины...`)
      
      cartItems = cartItems.filter(item => item.product_id != productId)
      
      res.writeHead(200, { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      })
      res.end(JSON.stringify({ success: true }))
    }
    
    else if (req.method === 'PUT') {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      
      req.on('end', () => {
        try {
          const { productId, quantity } = JSON.parse(body)
          const item = cartItems.find(item => item.product_id == productId)
          
          if (item) {
            item.quantity = quantity
            res.writeHead(200, { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            })
            res.end(JSON.stringify({ success: true }))
          } else {
            res.writeHead(404, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: "Item not found" }))
          }
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Invalid JSON" }))
        }
      })
    }
  }
}

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`)

  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname

  if (apiRoutes[pathname]) {
    return apiRoutes[pathname](req, res)
  }

  if (pathname === '/catalog.html' || pathname === '/catalog') {
    const filePath = path.join(__dirname, '../public', 'catalog.html')
    return fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(404, { "Content-Type": "text/html" })
        res.end("<h1>404 - File Not Found</h1>", "utf-8")
      } else {
        res.writeHead(200, { "Content-Type": "text/html" })
        res.end(content, "utf-8")
      }
    })
  }

  if (pathname === '/product.html' || pathname === '/product') {
    const filePath = path.join(__dirname, '../public', 'product.html')
    return fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(404, { "Content-Type": "text/html" })
        res.end("<h1>404 - File Not Found</h1>", "utf-8")
      } else {
        res.writeHead(200, { "Content-Type": "text/html" })
        res.end(content, "utf-8")
      }
    })
  }

  if (pathname === '/cart.html' || pathname === '/cart') {
    const filePath = path.join(__dirname, '../public', 'cart.html')
    return fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(404, { "Content-Type": "text/html" })
        res.end("<h1>404 - File Not Found</h1>", "utf-8")
      } else {
        res.writeHead(200, { "Content-Type": "text/html" })
        res.end(content, "utf-8")
      }
    })
  }

  if (pathname === '/about.html' || pathname === '/about') {
    const filePath = path.join(__dirname, '../public', 'about.html')
    return fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(404, { "Content-Type": "text/html" })
        res.end("<h1>404 - File Not Found</h1>", "utf-8")
      } else {
        res.writeHead(200, { "Content-Type": "text/html" })
        res.end(content, "utf-8")
      }
    })
  }

  if (pathname === '/account.html' || pathname === '/account') {
    const filePath = path.join(__dirname, '../public', 'account.html')
    return fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(404, { "Content-Type": "text/html" })
        res.end("<h1>404 - File Not Found</h1>", "utf-8")
      } else {
        res.writeHead(200, { "Content-Type": "text/html" })
        res.end(content, "utf-8")
      }
    })
  }

  if (pathname === '/login.html' || pathname === '/login') {
    const filePath = path.join(__dirname, '../public', 'login.html')
    return fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(404, { "Content-Type": "text/html" })
        res.end("<h1>404 - File Not Found</h1>", "utf-8")
      } else {
        res.writeHead(200, { "Content-Type": "text/html" })
        res.end(content, "utf-8")
      }
    })
  }

  let filePath = path.join(__dirname, '../public', req.url)
  if (filePath === path.join(__dirname, '../public', '/')) {
    filePath = path.join(__dirname, '../public', 'index.html')
  }

  const extname = String(path.extname(filePath)).toLowerCase()
  const contentType = mimeTypes[extname] || "application/octet-stream"

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/html" })
        res.end("<h1>404 - File Not Found</h1>", "utf-8")
      } else {
        res.writeHead(500)
        res.end(`Server Error: ${error.code}`, "utf-8")
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType })
      res.end(content, "utf-8")
    }
  })
})

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`)
  console.log("Press Ctrl+C to stop the server")
})