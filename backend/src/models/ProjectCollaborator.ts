import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

/**
 * 项目协作者模型
 */
class ProjectCollaborator extends Model {
  public id!: string
  public projectId!: string
  public userId!: number
  public role!: 'owner' | 'editor'
  public addedBy!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

ProjectCollaborator.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '项目ID，逻辑关联projects表',
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '协作者用户ID，逻辑关联users表',
    },
    role: {
      type: DataTypes.ENUM('owner', 'editor'),
      allowNull: false,
      defaultValue: 'editor',
      comment: '角色：owner-创建者，editor-编辑者',
    },
    addedBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '添加该协作者的用户ID',
    },
  },
  {
    sequelize,
    tableName: 'project_collaborators',
    timestamps: true,
    indexes: [
      {
        fields: ['projectId'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['projectId', 'userId'],
        unique: true, // 确保同一用户在同一项目中只能有一个角色
      },
    ],
  }
)

export default ProjectCollaborator
