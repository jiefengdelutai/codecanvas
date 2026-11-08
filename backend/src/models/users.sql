-- 用户表创建SQL
CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户唯一标识',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱地址',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希值',
  `nickname` VARCHAR(50) NULL DEFAULT NULL COMMENT '用户昵称',
  `avatar_url` VARCHAR(500) NULL DEFAULT NULL COMMENT '头像URL',
  `phone` VARCHAR(20) NULL DEFAULT NULL COMMENT '手机号',
  `role` ENUM('admin', 'user', 'premium') NOT NULL DEFAULT 'user' COMMENT '用户角色',
  `status` ENUM('active', 'inactive', 'banned') NOT NULL DEFAULT 'active' COMMENT '账户状态',
  `email_verified` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '邮箱验证状态',
  `phone_verified` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '手机验证状态',
  `ai_quota_used` INT NOT NULL DEFAULT 0 COMMENT '已使用AI调用次数',
  `ai_quota_limit` INT NOT NULL DEFAULT 1000 COMMENT 'AI调用次数限制',
  `storage_used` BIGINT NOT NULL DEFAULT 0 COMMENT '已使用存储空间(字节)',
  `storage_limit` BIGINT NOT NULL DEFAULT 1073741824 COMMENT '存储空间限制(1GB)',
  `project_count` INT NOT NULL DEFAULT 0 COMMENT '项目数量',
  `project_limit` INT NOT NULL DEFAULT 10 COMMENT '项目数量限制',
  `last_login_at` TIMESTAMP NULL DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(45) NULL DEFAULT NULL COMMENT '最后登录IP',
  `login_count` INT NOT NULL DEFAULT 0 COMMENT '登录次数统计',
  `preferences` JSON NULL DEFAULT NULL COMMENT '用户偏好设置',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT '软删除时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_role` (`role`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 创建索引以优化查询性能
CREATE INDEX `idx_last_login` ON `users` (`last_login_at`);
CREATE INDEX `idx_email_verified` ON `users` (`email_verified`);
CREATE INDEX `idx_phone_verified` ON `users` (`phone_verified`);
