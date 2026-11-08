const mysql = require('mysql2/promise')
require('dotenv').config()

async function fixDatabase() {
  console.log('🔧 开始清理数据库表（无外键约束版本）...\n')

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'codecanvas',
    port: parseInt(process.env.DB_PORT || '3306')
  })

  try {
    console.log('1. 检查现有表...')
    const [tables] = await connection.execute('SHOW TABLES')
    const tableNames = tables.map(t => Object.values(t)[0])
    console.log('现有表:', tableNames)

    if (tableNames.length === 0) {
      console.log('✅ 数据库中没有表，无需清理')
      console.log('💡 现在可以直接启动后端服务：npm run dev')
      return
    }

    console.log('\n2. 删除所有表（无外键约束，可以直接删除）...')
    const tablesToDrop = ['versions', 'deploys', 'templates', 'projects', 'users']
    
    for (const table of tablesToDrop) {
      if (tableNames.includes(table)) {
        try {
          await connection.execute(`DROP TABLE IF EXISTS \`${table}\``)
          console.log(`✅ 删除表 ${table}`)
        } catch (error) {
          console.log(`⚠️  表 ${table} 删除失败:`, error.message)
        }
      } else {
        console.log(`ℹ️  表 ${table} 不存在，跳过`)
      }
    }

    console.log('\n🎉 数据库清理完成！')
    console.log('💡 现在可以重新启动后端服务：npm run dev')
    console.log('📝 服务启动时会自动创建所需的表结构')

  } catch (error) {
    console.error('❌ 数据库清理失败:', error.message)
    console.log('\n🔧 手动解决方案：')
    console.log('1. 连接到MySQL数据库')
    console.log('2. 执行以下SQL命令：')
    console.log('   USE codecanvas;')
    console.log('   DROP TABLE IF EXISTS versions, deploys, templates, projects, users;')
    console.log('3. 重新启动后端服务')
  } finally {
    await connection.end()
  }
}

fixDatabase()
