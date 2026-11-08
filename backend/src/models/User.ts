import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

/**
 * 用户模型接口
 */
export interface UserAttributes {
  id: number
  username: string
  email: string
  password_hash: string
  nickname?: string
  avatar_url?: string | null
  avatar_mime?: string | null
  phone?: string
  role: 'admin' | 'user' | 'premium'
  status: 'active' | 'inactive' | 'banned'
  email_verified: boolean
  phone_verified: boolean
  ai_quota_used: number
  ai_quota_limit: number
  storage_used: number
  storage_limit: number
  project_count: number
  project_limit: number
  last_login_at?: Date
  last_login_ip?: string
  login_count: number
  preferences?: any
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number
  public username!: string
  public email!: string
  public password_hash!: string
  public nickname?: string
  public avatar_url?: string | null
  public avatar_mime?: string | null
  public phone?: string
  public role!: 'admin' | 'user' | 'premium'
  public status!: 'active' | 'inactive' | 'banned'
  public email_verified!: boolean
  public phone_verified!: boolean
  public ai_quota_used!: number
  public ai_quota_limit!: number
  public storage_used!: number
  public storage_limit!: number
  public project_count!: number
  public project_limit!: number
  public last_login_at?: Date
  public last_login_ip?: string
  public login_count!: number
  public preferences?: any
  public readonly created_at!: Date
  public readonly updated_at!: Date
  public deleted_at?: Date
}

User.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { isEmail: true } },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    nickname: { type: DataTypes.STRING(50), allowNull: true },
    avatar_url: { type: DataTypes.STRING(500), allowNull: true },
    avatar_mime: { type: DataTypes.STRING(100), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    role: { type: DataTypes.ENUM('admin', 'user', 'premium'), allowNull: false, defaultValue: 'user' },
    status: { type: DataTypes.ENUM('active', 'inactive', 'banned'), allowNull: false, defaultValue: 'active' },
    email_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    phone_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ai_quota_used: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ai_quota_limit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1000 },
    storage_used: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    storage_limit: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 1073741824 },
    project_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    project_limit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    last_login_at: { type: DataTypes.DATE, allowNull: true },
    last_login_ip: { type: DataTypes.STRING(45), allowNull: true },
    login_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    preferences: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'users', timestamps: true, paranoid: true, createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at' }
)

export default User
