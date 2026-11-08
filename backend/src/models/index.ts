import User from './User'
import Project from './Project'
import Template from './Template'
import Version from './Version'
import Deploy from './Deploy'
import ChatSession from './ChatSession'
import ChatMessage from './ChatMessage'
import ProjectCollaborator from './ProjectCollaborator'
import { setupAssociations } from './associations'
import { UserService } from '../services/userService'
import { sequelize } from '../config/database'

/**
 * 初始化数据库
 */
export const initDatabase = async () => {
  try {
    console.log('🔄 开始初始化数据库模型...')
    
    // 初始化用户表和数据
    await UserService.initializeUserTable()
    
    // 设置模型关联关系
    setupAssociations()
    
    // 清理可能存在的外键约束
    console.log('🧹 清理外键约束...')
    try {
      // 查询现有的外键约束
      const [foreignKeys] = await sequelize.query(`
        SELECT CONSTRAINT_NAME, TABLE_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = 'codecanvas' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_NAME IN ('chat_sessions', 'chat_messages')
      `)
      
      // 删除找到的外键约束
      for (const fk of foreignKeys as any[]) {
        try {
          await sequelize.query(`ALTER TABLE ${fk.TABLE_NAME} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`)
          console.log(`✅ 删除外键约束: ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}`)
        } catch (dropError) {
          console.log(`⚠️  删除外键约束失败: ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}`)
        }
      }
      
      if ((foreignKeys as any[]).length === 0) {
        console.log('ℹ️  未找到需要清理的外键约束')
      }
    } catch (error) {
      console.log('ℹ️  外键约束清理跳过（查询失败）')
    }
    
    // 同步所有表（无外键约束，可以并行）
    console.log('📋 同步数据表...')
    await Promise.all([
      Template.sync({ alter: true }),    // 模板表
      Project.sync({ alter: true }),     // 项目表
      ChatSession.sync({ alter: true }), // 聊天会话表
      ChatMessage.sync({ alter: true }), // 聊天消息表
      Version.sync({ alter: true }),     // 版本表
      Deploy.sync({ alter: true }),      // 部署表
      ProjectCollaborator.sync({ alter: true }), // 项目协作者表
    ])
    console.log('✅ 所有数据表同步完成')
    
    console.log('✅ 数据库模型初始化完成')
  } catch (error) {
    console.error('❌ 数据库模型初始化失败:', error)
    console.log('⚠️  服务将继续启动，但某些功能可能不可用')
    // 不抛出错误，让服务继续启动
  }
}

// 导出所有模型
export {
  User,
  Project,
  Template,
  Version,
  Deploy,
  ChatSession,
  ChatMessage,
  ProjectCollaborator,
}

export default {
  User,
  Project,
  Template,
  Version,
  Deploy,
  ChatSession,
  ChatMessage,
  ProjectCollaborator,
  initDatabase,
}

