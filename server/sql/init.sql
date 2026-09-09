-- 综合商品商城数据库初始化脚本。请使用 MySQL 8.0+ 执行。
CREATE DATABASE IF NOT EXISTS web_mall DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE web_mall;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS goods;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(50) DEFAULT '',
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE goods (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  sales INT NOT NULL DEFAULT 0,
  image VARCHAR(1000) NOT NULL DEFAULT '',
  description TEXT,
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1上架，0下架',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_goods_category FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_goods_category_status (category_id, status),
  INDEX idx_goods_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cart_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  goods_id BIGINT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_goods FOREIGN KEY (goods_id) REFERENCES goods(id) ON DELETE CASCADE,
  UNIQUE KEY uk_cart_user_goods (user_id, goods_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE favorites (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  goods_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorite_goods FOREIGN KEY (goods_id) REFERENCES goods(id) ON DELETE CASCADE,
  UNIQUE KEY uk_favorite_user_goods (user_id, goods_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE addresses (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  receiver VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  province VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  district VARCHAR(50) NOT NULL,
  detail VARCHAR(255) NOT NULL,
  is_default TINYINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_address_user_default (user_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  address_id BIGINT UNSIGNED DEFAULT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(20) DEFAULT NULL COMMENT '支付方式，仅保存 card 等非敏感标记',
  payment_brand VARCHAR(20) DEFAULT NULL COMMENT '卡组织，如 Visa、Mastercard',
  payment_last4 CHAR(4) DEFAULT NULL COMMENT '支付卡末四位，不保存完整卡号或 CVV',
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_order_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  INDEX idx_order_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  goods_id BIGINT UNSIGNED NOT NULL,
  goods_name VARCHAR(120) NOT NULL,
  goods_image VARCHAR(1000) NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL COMMENT '下单时单价快照',
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL COMMENT '下单时小计快照',
  CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_item_goods FOREIGN KEY (goods_id) REFERENCES goods(id),
  INDEX idx_order_item_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 密码均为 password（bcrypt 加密），可在实际部署后自行修改。
INSERT INTO users (username, email, password, phone, role) VALUES
('demo_user', 'user@mall.test', '$2b$10$89hnUHoFmfeJ6hdwgEdWGuE7ccE54y2NFdX6ss.rI3IUNKVYvSKBC', '13800138000', 'user'),
('admin', 'admin@mall.test', '$2b$10$89hnUHoFmfeJ6hdwgEdWGuE7ccE54y2NFdX6ss.rI3IUNKVYvSKBC', '13900139000', 'admin');

INSERT INTO categories (name, icon, sort) VALUES
('数码产品', 'Monitor', 1), ('家用电器', 'HomeFilled', 2), ('服装鞋包', 'Handbag', 3),
('食品饮料', 'Coffee', 4), ('图书文具', 'Reading', 5), ('生活用品', 'Goods', 6);

-- 图片采用公开 Unsplash Source 地址，仅用于课程演示；部署时可改为自有图片服务。
INSERT INTO goods (name, category_id, price, original_price, stock, sales, image, description, status) VALUES
('NovaBook Air 轻薄笔记本 14英寸', 1, 4699.00, 5299.00, 36, 128, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', '14 英寸高清屏，轻薄机身，适合学习、办公和日常创作。', 1),
('澎湃蓝牙降噪耳机', 1, 329.00, 429.00, 150, 286, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', '40dB 主动降噪，长续航，沉浸式听音体验。', 1),
('智能运动手表 Pro', 1, 599.00, 699.00, 82, 203, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', '全天心率监测，多种运动模式，支持消息提醒。', 1),
('口袋便携投影仪', 1, 899.00, 1099.00, 45, 90, 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80', '1080P 解码，小巧便携，打造家庭影院。', 1),
('空气循环扇', 2, 269.00, 329.00, 120, 322, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80', '柔和自然风，四季空气循环，静音节能。', 1),
('全自动胶囊咖啡机', 2, 799.00, 999.00, 68, 156, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80', '一键萃取香醇咖啡，简洁操作，适合家庭使用。', 1),
('多功能电煮锅', 2, 199.00, 259.00, 110, 418, 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80', '煮、蒸、焖多种模式，小户型也能轻松下厨。', 1),
('手持挂烫机', 2, 189.00, 229.00, 96, 174, 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=800&q=80', '快速预热，便携熨烫，出差旅行好帮手。', 1),
('简约纯棉卫衣', 3, 159.00, 199.00, 210, 562, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80', '宽松舒适版型，精梳棉面料，四季可穿。', 1),
('复古通勤托特包', 3, 229.00, 289.00, 75, 134, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80', '大容量收纳，质感耐磨，通勤出行都适宜。', 1),
('轻盈跑步运动鞋', 3, 349.00, 429.00, 136, 377, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', '回弹中底，透气鞋面，为日常跑步而生。', 1),
('羊毛混纺围巾', 3, 129.00, 169.00, 90, 105, 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=800&q=80', '柔软亲肤，经典配色，送礼自用皆宜。', 1),
('山野冻干咖啡礼盒', 4, 89.00, 109.00, 300, 680, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', '精选阿拉比卡豆，香气馥郁，独立小包装。', 1),
('每日坚果混合装', 4, 79.90, 99.90, 278, 846, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', '七种坚果科学配比，每日一包营养补给。', 1),
('低糖燕麦早餐杯', 4, 39.90, 49.90, 450, 1090, 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=800&q=80', '高纤低糖，即冲即食，忙碌早晨也能好好吃饭。', 1),
('茉莉花茶礼罐', 4, 119.00, 139.00, 160, 256, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80', '花香清雅，鲜爽回甘，简约礼罐包装。', 1),
('设计的心理学', 5, 58.00, 68.00, 260, 491, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=800&q=80', '理解日常设计背后的逻辑，启发产品思维。', 1),
('高效学习手册', 5, 42.00, 52.00, 220, 350, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80', '帮助建立专注、复盘与知识管理习惯。', 1),
('极简周计划本', 5, 29.90, 39.90, 340, 728, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', '清晰规划每一周，让重要事项按时发生。', 1),
('静音中性笔套装', 5, 24.90, 32.90, 600, 1210, 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80', '顺滑不断墨，简洁配色，办公学习常备。', 1),
('天然香氛洗衣凝珠', 6, 49.90, 59.90, 380, 903, 'https://images.unsplash.com/photo-1583947582886-f40ec95dd752?auto=format&fit=crop&w=800&q=80', '留香持久，低泡易漂洗，温和洁净衣物。', 1),
('折叠收纳箱三件套', 6, 69.00, 89.00, 190, 305, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80', '分类收纳，折叠不占空间，让家更整洁。', 1),
('保温随行杯', 6, 99.00, 129.00, 250, 633, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80', '304 不锈钢内胆，长效保温，轻巧防漏。', 1),
('柔软亲肤毛巾礼盒', 6, 79.00, 99.00, 215, 429, 'https://images.unsplash.com/photo-1584556819528-4c20f1ab7e99?auto=format&fit=crop&w=800&q=80', '加厚吸水，柔软耐用，为家庭日常而生。', 1);
