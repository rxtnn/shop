-- --------------------------------------------------------
-- Хост:                         127.0.0.1
-- Версия сервера:               8.4.3 - MySQL Community Server - GPL
-- Операционная система:         Win64
-- HeidiSQL Версия:              12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Дамп структуры базы данных furniture_shop
CREATE DATABASE IF NOT EXISTS `furniture_shop` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `furniture_shop`;

-- Дамп структуры для таблица furniture_shop.cart
CREATE TABLE IF NOT EXISTS `cart` (
  `cart_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL DEFAULT '1',
  `product_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Дамп данных таблицы furniture_shop.cart: ~0 rows (приблизительно)

-- Дамп структуры для таблица furniture_shop.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Дамп данных таблицы furniture_shop.categories: ~4 rows (приблизительно)
INSERT INTO `categories` (`id`, `name`, `description`, `image_url`) VALUES
	(1, 'Стулья', 'Комфортные стулья для дома и офиса', 'https://hoff.ru/upload/iblock/bf3/j6rb03mhflu8dcucs2mecsv4e38g3u32.jpg'),
	(2, 'Столы', 'Столы различных стилей и размеров', 'https://hoff.ru/upload/iblock/6db/dqye6cj9eh4c6d2gqq5njlmf1epuki3k.jpg'),
	(3, 'Диваны', 'Удобные диваны для гостиной', 'https://hoff.ru/upload/iblock/0ed/0edb35ba3079e952f590fcbd3a738c2d.jpg'),
	(4, 'Кровати', 'Качественные кровати для спальни', 'https://hoff.ru/upload/iblock/7ca/7ca3c9f3e89ce5b68468fcc016358a99.jpg');

-- Дамп структуры для таблица furniture_shop.manufacturers
CREATE TABLE IF NOT EXISTS `manufacturers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Дамп данных таблицы furniture_shop.manufacturers: ~3 rows (приблизительно)
INSERT INTO `manufacturers` (`id`, `name`, `country`) VALUES
	(1, 'МебельПро', 'Россия'),
	(2, 'ComfortStyle', 'Германия'),
	(3, 'WoodMaster', 'Италия');

-- Дамп структуры для таблица furniture_shop.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `shipping_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_method` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Дамп данных таблицы furniture_shop.orders: ~0 rows (приблизительно)
INSERT INTO `orders` (`id`, `user_id`, `order_date`, `total_amount`, `status`, `shipping_address`, `payment_method`) VALUES
	(1, 2, '2025-10-26 16:41:05', 12400.00, 'processing', 'qqqqqqqqqqqqqqqqqqqqq', 'online');

-- Дамп структуры для таблица furniture_shop.order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Дамп данных таблицы furniture_shop.order_items: ~0 rows (приблизительно)
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES
	(1, 1, 2, 1, 12400.00);

-- Дамп структуры для таблица furniture_shop.products
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int DEFAULT NULL,
  `manufacturer_id` int DEFAULT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `price` decimal(10,2) NOT NULL,
  `dimensions` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `weight` decimal(10,2) DEFAULT NULL,
  `material` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `manufacturer_id` (`manufacturer_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Дамп данных таблицы furniture_shop.products: ~12 rows (приблизительно)
INSERT INTO `products` (`id`, `category_id`, `manufacturer_id`, `name`, `description`, `price`, `dimensions`, `weight`, `material`, `color`, `image_url`) VALUES
	(1, 3, 1, 'Диван "Nordic"', 'Комфортный диван в скандинавском стиле. Каркас — массив дерева, обивка — прочная ткань.', 15900.00, '200×90×85 см', 45.00, 'Дерево, Ткань', 'Серый', 'https://hoff.ru/upload/iblock/eec/l3c7432ujmlraq1b6yxm621u61b8k7j4.jpg'),
	(2, 1, 2, 'Кресло "Lounge"', 'Эргономичное кресло для отдыха с регулируемой спинкой.', 12400.00, '70×80×100 см', 15.00, 'Металл, Ткань', 'Бежевый', 'https://hoff.ru/upload/iblock/804/gx5k9e2rxrqox8b8dr6zvkpcpvjdvnq6.jpg'),
	(3, 2, 3, 'Стол "Scandi"', 'Минималистичный деревянный стол в скандинавском стиле.', 7200.00, '120×60×75 см', 25.00, 'Массив дерева', 'Белый', 'https://hoff.ru/upload/iblock/686/2cmbn3xblh9l4h38w8rj01162yckrumi.jpg'),
	(4, 4, 1, 'Кровать "Dream"', 'Просторная двуспальная кровать с ортопедическим основанием.', 23400.00, '160×200×110 см', 60.00, 'Дерево, Металл', 'Коричневый', 'https://hoff.ru/upload/iblock/ec2/ec20531f89e7a5e0e692ae49b0825636.jpg'),
	(5, 1, 2, 'Стул "Office Pro"', 'Офисный стул с регулировкой высоты и поддержкой поясницы.', 5400.00, '50×50×80 см', 8.00, 'Пластик, Ткань', 'Черный', 'https://hoff.ru/upload/iblock/b39/b394340e2a1cdfcfab790cabe16692bf.jpg'),
	(6, 2, 3, 'Журнальный столик "Modern"', 'Стильный журнальный столик со стеклянной столешницей.', 8900.00, '80×80×45 см', 12.00, 'Стекло, Металл', 'Прозрачный', 'https://hoff.ru/upload/iblock/891/rqr47wgks193zgdpkftranoqnf1w0zjy.jpg'),
	(7, 3, 1, 'Угловой диван "Comfort"', 'Вместительный угловой диван с механизмом трансформации.', 28900.00, '250×160×85 см', 75.00, 'Дерево, Ткань', 'Синий', 'https://hoff.ru/upload/iblock/140/bicn666w91y7nvb54h1jbhe3djkybk8u.jpg'),
	(8, 4, 2, 'Детская кровать "Junior"', 'Безопасная детская кровать с защитными бортиками.', 15600.00, '90×200×85 см', 35.00, 'Дерево', 'Белый', 'https://hoff.ru/upload/iblock/04d/lih11zmw2gmww111re8eyw9fe5y7h7um.jpg'),
	(9, 1, 3, 'Барный стул "Loft"', 'Высокий барный стул в стиле лофт.', 6700.00, '40×40×75 см', 5.00, 'Металл, Дерево', 'Черный', 'https://hoff.ru/upload/iblock/7db/mebg0d6agbjnp3o34j9btdakki2fei4i.jpg'),
	(10, 2, 1, 'Обеденный стол "Family"', 'Большой обеденный стол для всей семьи.', 18700.00, '180×90×75 см', 40.00, 'Массив дерева', 'Натуральный', 'https://hoff.ru/upload/iblock/e0e/o796r5ptkfg2d80omd8wf0zmx7k5io4u.jpg'),
	(11, 3, 2, 'Диван-кровать "Compact"', 'Компактный диван-кровать для небольших помещений.', 13200.00, '140×80×75 см', 38.00, 'Дерево, Ткань', 'Зеленый', 'https://hoff.ru/upload/iblock/0e8/0e81b2cf1b75d7b5f8f213f63a6c6c9f.jpg'),
	(12, 4, 3, 'Кровать с ящиками "Storage"', 'Практичная кровать со встроенными ящиками для хранения.', 31500.00, '180×200×110 см', 70.00, 'Дерево', 'Венге', 'https://hoff.ru/upload/iblock/77a/77a9b2305fa8d9cc8b0ff635f3437628.jpg');

-- Дамп структуры для таблица furniture_shop.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `first_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'customer',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Дамп данных таблицы furniture_shop.users: ~2 rows (приблизительно)
INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`) VALUES
	(1, 'demo@user.com', 'demo', 'Демо', 'Пользователь', '+79990000000', 'customer'),
	(2, 'admin@test.com', '$2b$10$41WUTCBOiprZttG1ZhdnEu9E9lyJqccLJYab8DeSb0Z5Yv1JZKHJy', 'admin1', 'admin', '7777777777', 'customer');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
