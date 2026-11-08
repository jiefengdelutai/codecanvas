import User from './User'
import ChatSession from './ChatSession'
import ChatMessage from './ChatMessage'

/**
 * 定义模型之间的关联关系（逻辑关联，不使用数据库外键）
 */
export const setupAssociations = () => {
  // User 与 ChatSession 的关联（逻辑关联）
  User.hasMany(ChatSession, {
    foreignKey: 'userId',
    as: 'chatSessions',
    constraints: false, // 不创建外键约束
  })
  
  ChatSession.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    constraints: false, // 不创建外键约束
  })

  // ChatSession 与 ChatMessage 的关联（逻辑关联）
  ChatSession.hasMany(ChatMessage, {
    foreignKey: 'sessionId',
    as: 'messages',
    constraints: false, // 不创建外键约束
  })
  
  ChatMessage.belongsTo(ChatSession, {
    foreignKey: 'sessionId',
    as: 'session',
    constraints: false, // 不创建外键约束
  })
}

export default setupAssociations
