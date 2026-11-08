-- 清理聊天表的外键约束
USE codecanvas;

-- 删除 chat_sessions 表的外键约束
ALTER TABLE chat_sessions DROP FOREIGN KEY IF EXISTS chat_sessions_ibfk_1;

-- 删除 chat_messages 表的外键约束（如果存在）
ALTER TABLE chat_messages DROP FOREIGN KEY IF EXISTS chat_messages_ibfk_1;

-- 查看表结构确认外键已删除
SHOW CREATE TABLE chat_sessions;
SHOW CREATE TABLE chat_messages;
