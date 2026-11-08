import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database'

// ChatMessage 属性接口
interface ChatMessageAttributes {
  id: number
  sessionId: number
  type: 'user' | 'assistant'
  content: string
  createdAt: Date
  updatedAt: Date
}

// 创建时的可选属性
interface ChatMessageCreationAttributes extends Optional<ChatMessageAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * 聊天消息模型
 * 用于存储聊天会话中的消息
 */
class ChatMessage extends Model<ChatMessageAttributes, ChatMessageCreationAttributes> implements ChatMessageAttributes {
  public id!: number
  public sessionId!: number
  public type!: 'user' | 'assistant'
  public content!: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

// 初始化模型
ChatMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '会话ID，逻辑关联chat_sessions表',
    },
    type: {
      type: DataTypes.ENUM('user', 'assistant'),
      allowNull: false,
      comment: '消息类型：user-用户消息，assistant-AI助手消息',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '消息内容',
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
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    timestamps: true,
    indexes: [
      {
        fields: ['sessionId'],
      },
      {
        fields: ['sessionId', 'createdAt'],
      },
    ],
  }
)

export default ChatMessage
