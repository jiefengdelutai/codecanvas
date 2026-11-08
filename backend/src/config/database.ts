import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

// 数据库配置
const dbConfig = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || '',
  DB: process.env.DB_NAME || 'codecanvas',
  PORT: parseInt(process.env.DB_PORT || '3306'),
  dialect: 'mysql' as const,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
}

// 创建 Sequelize 实例
export const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.dialect,
    pool: dbConfig.pool,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '+08:00',
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
    }
  }
)

/**
 * 连接数据库
 */
export const connectDB = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')
    console.log(`📦 数据库: ${dbConfig.DB}@${dbConfig.HOST}:${dbConfig.PORT}`)
    return true
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    return false
  }
}

/**
 * 同步数据库模型
 */
export const syncDatabase = async (force: boolean = false) => {
  try {
    await sequelize.sync({ force })
    console.log('✅ 数据库模型同步成功')
  } catch (error) {
    console.error('❌ 数据库模型同步失败:', error)
    throw error
  }
}

export default sequelize

