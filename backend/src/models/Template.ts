import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

/**
 * 模板模型
 */
class Template extends Model {
  public id!: string
  public name!: string
  public description!: string | null
  public content!: string
  public thumbnail!: string | null
  public category!: string
  public tags!: string | null
  public downloads!: number
  public authorId!: number
  public authorName!: string | null
  public sourceProjectId!: string | null
  public isPublic!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Template.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'general',
    },
    tags: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '标签，逗号分隔',
    },
    downloads: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    authorId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '作者ID',
    },
    authorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '作者名称',
    },
    sourceProjectId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '来源项目ID',
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: '是否公开',
    },
  },
  {
    sequelize,
    tableName: 'templates',
    timestamps: true,
  }
)

export default Template

