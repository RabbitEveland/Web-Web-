-- 为已初始化的 web_mall 数据库增加模拟支付回单字段。
-- 不保存完整卡号、有效期或 CVV，仅保存卡组织、末四位和支付时间。
USE web_mall;

ALTER TABLE orders
  ADD COLUMN payment_method VARCHAR(20) DEFAULT NULL COMMENT '支付方式，仅保存 card 等非敏感标记' AFTER status,
  ADD COLUMN payment_brand VARCHAR(20) DEFAULT NULL COMMENT '卡组织，如 Visa、Mastercard' AFTER payment_method,
  ADD COLUMN payment_last4 CHAR(4) DEFAULT NULL COMMENT '支付卡末四位，不保存完整卡号或 CVV' AFTER payment_brand,
  ADD COLUMN paid_at TIMESTAMP NULL DEFAULT NULL AFTER payment_last4;
