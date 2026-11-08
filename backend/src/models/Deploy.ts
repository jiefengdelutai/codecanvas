import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

/**
 * 部署模型
 */
class Deploy extends Model {
  public id!: string
  public projectId!: string
  public url!: string
  public status!: 'pending' | 'success' | 'failed'
  public errorMessage!: string | null
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Deploy.init(
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
    url: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '部署后的访问地址',
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '部署失败的错误信息',
    },
  },
  {
    sequelize,
    tableName: 'deploys',
    timestamps: true,
    indexes: [
      {
        fields: ['projectId'],  // 添加索引提高查询性能
      },
      {
        fields: ['status'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
)

// 注释掉外键关联，改为在业务层处理关联关系
// Deploy.belongsTo(Project, { foreignKey: 'projectId', as: 'project' })
// Project.hasMany(Deploy, { foreignKey: 'projectId', as: 'deploys' })

export default Deploy

