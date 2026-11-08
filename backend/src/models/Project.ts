import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

/**
 * 项目模型
 */
class Project extends Model {
  public id!: string
  public userId!: number
  public name!: string
  public description!: string | null
  public content!: string
  public thumbnail!: string | null
  public status!: 'draft' | 'published' | 'archived'
  public tags!: string
  public viewCount!: number
  public size!: number
  public isFavorite!: boolean
  public lastAccessedAt!: Date | null
  public isPublishedAsTemplate!: boolean
  public templateId!: string | null
  public deployUrl!: string | null
  public deployStatus!: 'deploying' | 'deployed' | 'failed' | null
  public currentVersion!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.BIGINT,  // 改为BIGINT，对应User表的id类型
      allowNull: false,
      // 移除外键约束，只保留逻辑关联
      comment: '用户ID，逻辑关联users表',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    thumbnail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft',
      allowNull: false,
      comment: '项目状态：草稿/已发布/已归档',
    },
    tags: {
      type: DataTypes.STRING(500),
      defaultValue: '',
      allowNull: false,
      comment: '项目标签，逗号分隔',
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '访问次数',
    },
    size: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '项目大小（字节）',
    },
    isFavorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否收藏',
    },
    lastAccessedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后访问时间',
    },
    isPublishedAsTemplate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否已发布为模板',
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '关联的模板ID',
    },
    deployUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '部署URL',
    },
    deployStatus: {
      type: DataTypes.ENUM('deploying', 'deployed', 'failed'),
      allowNull: true,
      comment: '部署状态',
    },
    currentVersion: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      comment: '当前版本号，每次保存自动递增',
    },
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['createdAt'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['isFavorite'],
      },
    ],
  }
)

// 注释掉外键关联，改为在业务层处理关联关系
// Project.belongsTo(User, { foreignKey: 'userId', as: 'user' })
// User.hasMany(Project, { foreignKey: 'userId', as: 'projects' })

export default Project

