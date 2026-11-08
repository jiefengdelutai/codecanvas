import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

/**
 * 版本模型
 */
class Version extends Model {
  public id!: string
  public projectId!: string
  public version!: string
  public content!: string
  public description!: string | null
  public readonly createdAt!: Date
}

Version.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      // 移除外键约束，只保留逻辑关联
      comment: '项目ID，逻辑关联projects表',
    },
    version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '版本号，如 v1.0.0',
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      comment: '该版本的完整内容',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '版本说明',
    },
  },
  {
    sequelize,
    tableName: 'versions',
    timestamps: true,
    updatedAt: false, // 版本不需要更新时间
    indexes: [
      {
        fields: ['projectId'],  // 添加索引提高查询性能
      },
      {
        fields: ['createdAt'],
      },
      {
        fields: ['projectId', 'version'],  // 复合索引，确保同一项目版本号唯一
        unique: true,
      },
    ],
  }
)

// 注释掉外键关联，改为在业务层处理关联关系
// Version.belongsTo(Project, { foreignKey: 'projectId', as: 'project' })
// Project.hasMany(Version, { foreignKey: 'projectId', as: 'versions' })

export default Version

