import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database'

// ChatSession 属性接口
interface ChatSessionAttributes {
  id: number
  userId: number
  title: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 创建时的可选属性
interface ChatSessionCreationAttributes extends Optional<ChatSessionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * 聊天会话模型
 * 用于管理用户的聊天会话
 */
class ChatSession extends Model<ChatSessionAttributes, ChatSessionCreationAttributes> implements ChatSessionAttributes {
  public id!: number
  public userId!: number
  public title!: string
  public isActive!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

// 初始化模型
ChatSession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID，逻辑关联users表',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '新对话',
      comment: '会话标题',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否为活跃会话',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ChatSession',
    tableName: 'chat_sessions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['userId', 'isActive'],
      },
    ],
  }
)

export default ChatSession
