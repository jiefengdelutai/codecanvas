const fs = require('fs');
const path = require('path');

// 配置
const config = {
  frontend: {
    path: './frontend/src',
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.less'],
    exclude: ['node_modules', 'dist', 'build', '.next']
  },
  backend: {
    path: './backend/src',
    extensions: ['.ts', '.js', '.sql'],
    exclude: ['node_modules', 'dist', 'build']
  }
};

// 统计结果
const stats = {
  frontend: {
    files: 0,
    lines: 0,
    codeLines: 0,
    commentLines: 0,
    blankLines: 0,
    byExtension: {}
  },
  backend: {
    files: 0,
    lines: 0,
    codeLines: 0,
    commentLines: 0,
    blankLines: 0,
    byExtension: {}
  }
};

/**
 * 检查是否应该排除该路径
 */
function shouldExclude(filePath, excludeList) {
  return excludeList.some(exclude => filePath.includes(exclude));
}

/**
 * 统计单个文件的代码行数
 */
function countFileLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let inBlockComment = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    
    // 空行
    if (trimmed === '') {
      blankLines++;
      return;
    }

    // 块注释处理
    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
      commentLines++;
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      return;
    }

    if (inBlockComment) {
      commentLines++;
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      return;
    }

    if (trimmed.endsWith('*/')) {
      commentLines++;
      inBlockComment = false;
      return;
    }

    // 单行注释
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      commentLines++;
      return;
    }

    // CSS注释
    if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) {
      commentLines++;
      return;
    }

    // 代码行
    codeLines++;
  });

  return {
    total: lines.length,
    codeLines,
    commentLines,
    blankLines
  };
}

/**
 * 递归遍历目录
 */
function traverseDirectory(dirPath, extensions, excludeList, statsObj) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`路径不存在: ${dirPath}`);
    return;
  }

  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    
    // 检查是否应该排除
    if (shouldExclude(fullPath, excludeList)) {
      return;
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      traverseDirectory(fullPath, extensions, excludeList, statsObj);
    } else if (stat.isFile()) {
      const ext = path.extname(fullPath);
      
      // 检查文件扩展名
      if (extensions.includes(ext)) {
        const lineStats = countFileLines(fullPath);
        
        statsObj.files++;
        statsObj.lines += lineStats.total;
        statsObj.codeLines += lineStats.codeLines;
        statsObj.commentLines += lineStats.commentLines;
        statsObj.blankLines += lineStats.blankLines;

        // 按扩展名统计
        if (!statsObj.byExtension[ext]) {
          statsObj.byExtension[ext] = {
            files: 0,
            lines: 0,
            codeLines: 0
          };
        }
        statsObj.byExtension[ext].files++;
        statsObj.byExtension[ext].lines += lineStats.total;
        statsObj.byExtension[ext].codeLines += lineStats.codeLines;
      }
    }
  });
}

/**
 * 格式化数字（添加千位分隔符）
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 打印统计结果
 */
function printStats() {
  console.log('\n' + '='.repeat(80));
  console.log('CodeCanvas 项目代码统计');
  console.log('='.repeat(80));

  // 前端统计
  console.log('\n📱 前端代码统计 (frontend/src)');
  console.log('-'.repeat(80));
  console.log(`文件数量:     ${formatNumber(stats.frontend.files)} 个`);
  console.log(`总行数:       ${formatNumber(stats.frontend.lines)} 行`);
  console.log(`代码行数:     ${formatNumber(stats.frontend.codeLines)} 行`);
  console.log(`注释行数:     ${formatNumber(stats.frontend.commentLines)} 行`);
  console.log(`空白行数:     ${formatNumber(stats.frontend.blankLines)} 行`);
  
  console.log('\n按文件类型分类:');
  Object.entries(stats.frontend.byExtension)
    .sort((a, b) => b[1].codeLines - a[1].codeLines)
    .forEach(([ext, data]) => {
      console.log(`  ${ext.padEnd(8)} ${formatNumber(data.files).padStart(6)} 个文件  ${formatNumber(data.codeLines).padStart(8)} 行代码`);
    });

  // 后端统计
  console.log('\n🔧 后端代码统计 (backend/src)');
  console.log('-'.repeat(80));
  console.log(`文件数量:     ${formatNumber(stats.backend.files)} 个`);
  console.log(`总行数:       ${formatNumber(stats.backend.lines)} 行`);
  console.log(`代码行数:     ${formatNumber(stats.backend.codeLines)} 行`);
  console.log(`注释行数:     ${formatNumber(stats.backend.commentLines)} 行`);
  console.log(`空白行数:     ${formatNumber(stats.backend.blankLines)} 行`);
  
  console.log('\n按文件类型分类:');
  Object.entries(stats.backend.byExtension)
    .sort((a, b) => b[1].codeLines - a[1].codeLines)
    .forEach(([ext, data]) => {
      console.log(`  ${ext.padEnd(8)} ${formatNumber(data.files).padStart(6)} 个文件  ${formatNumber(data.codeLines).padStart(8)} 行代码`);
    });

  // 总计
  console.log('\n📊 总计');
  console.log('-'.repeat(80));
  const totalFiles = stats.frontend.files + stats.backend.files;
  const totalLines = stats.frontend.lines + stats.backend.lines;
  const totalCodeLines = stats.frontend.codeLines + stats.backend.codeLines;
  const totalCommentLines = stats.frontend.commentLines + stats.backend.commentLines;
  const totalBlankLines = stats.frontend.blankLines + stats.backend.blankLines;

  console.log(`总文件数:     ${formatNumber(totalFiles)} 个`);
  console.log(`总行数:       ${formatNumber(totalLines)} 行`);
  console.log(`总代码行数:   ${formatNumber(totalCodeLines)} 行`);
  console.log(`总注释行数:   ${formatNumber(totalCommentLines)} 行`);
  console.log(`总空白行数:   ${formatNumber(totalBlankLines)} 行`);

  // 占比分析
  console.log('\n📈 占比分析');
  console.log('-'.repeat(80));
  const frontendPercent = ((stats.frontend.codeLines / totalCodeLines) * 100).toFixed(2);
  const backendPercent = ((stats.backend.codeLines / totalCodeLines) * 100).toFixed(2);
  console.log(`前端代码占比: ${frontendPercent}%`);
  console.log(`后端代码占比: ${backendPercent}%`);

  // 代码质量指标
  console.log('\n📝 代码质量指标');
  console.log('-'.repeat(80));
  const frontendCommentRatio = ((stats.frontend.commentLines / stats.frontend.codeLines) * 100).toFixed(2);
  const backendCommentRatio = ((stats.backend.commentLines / stats.backend.codeLines) * 100).toFixed(2);
  console.log(`前端注释率:   ${frontendCommentRatio}%`);
  console.log(`后端注释率:   ${backendCommentRatio}%`);
  console.log(`平均注释率:   ${((totalCommentLines / totalCodeLines) * 100).toFixed(2)}%`);

  console.log('\n' + '='.repeat(80) + '\n');

  // 生成JSON报告
  const report = {
    timestamp: new Date().toISOString(),
    frontend: stats.frontend,
    backend: stats.backend,
    total: {
      files: totalFiles,
      lines: totalLines,
      codeLines: totalCodeLines,
      commentLines: totalCommentLines,
      blankLines: totalBlankLines
    },
    analysis: {
      frontendPercent: parseFloat(frontendPercent),
      backendPercent: parseFloat(backendPercent),
      frontendCommentRatio: parseFloat(frontendCommentRatio),
      backendCommentRatio: parseFloat(backendCommentRatio),
      averageCommentRatio: parseFloat(((totalCommentLines / totalCodeLines) * 100).toFixed(2))
    }
  };

  fs.writeFileSync('code-stats.json', JSON.stringify(report, null, 2), 'utf-8');
  console.log('✅ 详细报告已保存到 code-stats.json\n');
}

// 主函数
function main() {
  console.log('开始统计代码...\n');

  // 统计前端
  traverseDirectory(
    config.frontend.path,
    config.frontend.extensions,
    config.frontend.exclude,
    stats.frontend
  );

  // 统计后端
  traverseDirectory(
    config.backend.path,
    config.backend.extensions,
    config.backend.exclude,
    stats.backend
  );

  // 打印结果
  printStats();
}

// 执行
main();
