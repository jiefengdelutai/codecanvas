const mysql = require('mysql2/promise')
require('dotenv').config()

async function resetDatabase() {
  console.log('🔄 开始重置数据库...\n')

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '3306')
  })

  try {
    const dbName = process.env.DB_NAME || 'codecanvas'
    
    console.log('1. 删除现有数据库...')
    await connection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``)
    console.log('✅ 数据库删除成功')

    console.log('2. 创建新数据库...')
    await connection.execute(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    console.log('✅ 数据库创建成功')

    console.log('\n🎉 数据库重置完成！')
    console.log('💡 现在可以重新启动后端服务：npm run dev')

  } catch (error) {
    console.error('❌ 数据库重置失败:', error.message)
  } finally {
    await connection.end()
  }
}

resetDatabase()
