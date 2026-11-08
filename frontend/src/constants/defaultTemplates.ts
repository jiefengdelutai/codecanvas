// 默认代码模板
export interface CodeTemplate {
  html: string
  css: string
  js: string
}

// 试用模板 - 包含欢迎页面的完整示例
export const welcomeTemplate: CodeTemplate = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>个人主页</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
        }

        header {
            position: relative;
            width: 100%;
            background: #fff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 50px;
            max-width: 1400px;
            margin: 0 auto;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }

        .nav-links {
            display: flex;
            gap: 40px;
            list-style: none;
        }

        .nav-links a {
            text-decoration: none;
            color: #666;
            font-size: 16px;
            transition: color 0.3s;
        }

        .nav-links a:hover {
            color: #333;
        }

        .hero-section {
            width: 100%;
            height: 400px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }

        .hero-placeholder {
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3)),
                        url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400"><rect fill="%23667eea" width="1200" height="400"/><path fill="%23764ba2" opacity="0.3" d="M0,200 Q300,100 600,200 T1200,200 L1200,400 L0,400 Z"/></svg>');
            background-size: cover;
            background-position: center;
        }

        .main-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 60px 20px;
            display: grid;
            grid-template-columns: 350px 1fr;
            gap: 60px;
        }

        .sidebar {
            background: #f8f9fa;
            padding: 40px 30px;
            border-radius: 10px;
            height: fit-content;
        }

        .profile-image {
            width: 180px;
            height: 180px;
            border-radius: 50%;
            background: linear-gradient(135deg, #e0e0e0, #f5f5f5);
            margin: 0 auto 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
            color: #999;
            border: 5px solid #fff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .profile-name {
            text-align: center;
            font-size: 28px;
            color: #3498db;
            margin-bottom: 30px;
            font-weight: 600;
        }

        .profile-info {
            margin-bottom: 15px;
            font-size: 16px;
            color: #555;
        }

        .profile-info strong {
            display: inline-block;
            width: 60px;
            color: #333;
        }

        .content-section {
            background: #fff;
        }

        .section-title {
            font-size: 32px;
            color: #333;
            margin-bottom: 30px;
            font-weight: 600;
        }

        .intro-text {
            font-size: 16px;
            color: #555;
            line-height: 1.8;
            margin-bottom: 20px;
        }

        .skills-section {
            margin-top: 50px;
        }

        .skills-title {
            font-size: 28px;
            color: #333;
            margin-bottom: 30px;
            font-weight: 600;
        }

        .skill-item {
            margin-bottom: 40px;
        }

        .skill-name {
            font-size: 20px;
            color: #3498db;
            margin-bottom: 15px;
            font-weight: 600;
        }

        .skill-description {
            font-size: 15px;
            color: #666;
            line-height: 1.8;
        }

        footer {
            background: #3d4f5f;
            color: #fff;
            text-align: center;
            padding: 30px 20px;
            margin-top: 60px;
        }

        @media (max-width: 968px) {
            .main-content {
                grid-template-columns: 1fr;
                gap: 40px;
            }

            nav {
                flex-direction: column;
                gap: 20px;
                padding: 20px;
            }

            .nav-links {
                gap: 20px;
                flex-wrap: wrap;
                justify-content: center;
            }

            .hero-section {
                height: 300px;
            }
        }

        @media (max-width: 600px) {
            .nav-links {
                font-size: 14px;
                gap: 15px;
            }

            .section-title {
                font-size: 26px;
            }

            .skills-title {
                font-size: 22px;
            }

            .hero-section {
                height: 250px;
            }
        }
    </style>
</head>
<body>
    <header>
        <nav>
            <div class="logo">个人主页</div>
            <ul class="nav-links">
                <li><a href="#home">首页</a></li>
                <li><a href="#hobbies">兴趣爱好</a></li>
                <li><a href="#hometown">我的家乡</a></li>
                <li><a href="#school">我的学校</a></li>
                <li><a href="#login" onclick="handleLogin()">个人相册</a></li>
            </ul>
        </nav>
    </header>

    <section class="hero-section">
        <div class="hero-placeholder"></div>
    </section>

    <main class="main-content">
        <aside class="sidebar">
            <div class="profile-image">☕</div>
            <h2 class="profile-name">张三</h2>
            <div class="profile-info"><strong>年龄：</strong>20岁</div>
            <div class="profile-info"><strong>性别：</strong>男</div>
            <div class="profile-info"><strong>年级：</strong>大二</div>
            <div class="profile-info"><strong>邮箱：</strong>zhangsan</div>
        </aside>

        <section class="content-section">
            <h1 class="section-title">个人简介</h1>
            <p class="intro-text">
                我是一名积极倡导的在校大学生，熟练掌握HTML、CSS、JavaScript等前端技术，对用户体验有深入理解。工作认真负责，具备良好的团队协作能力和沟通能力。
            </p>
            <p class="intro-text">
                曾参与多个项目的开发，包括企业官网、电商平台和后台管理系统等。持续学习新技术，关注行业发展动态。
            </p>

            <div class="skills-section">
                <h2 class="skills-title">技能介绍</h2>
                
                <div class="skill-item">
                    <h3 class="skill-name">HTML/CSS</h3>
                    <p class="skill-description">
                        熟练掌握HTML5和CSS3，能够编写语义化的HTML结构和优雅的CSS样式，熟悉响应式布局和CSS预处理器。
                    </p>
                </div>

                <div class="skill-item">
                    <h3 class="skill-name">JavaScript</h3>
                    <p class="skill-description">
                        精通原生JavaScript，熟悉ES6+新特性，了解TypeScript，能够编写高质量、可维护的代码。
                    </p>
                </div>

                <div class="skill-item">
                    <h3 class="skill-name">工具与工程化</h3>
                    <p class="skill-description">
                        熟悉开发工具，了解前端性能优化和调试浏览器兼容性问题。
                    </p>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <p>© 我的个人主页</p>
    </footer>

    <script>
        function handleLogin() {
            // 登录逻辑占位函数
            console.log('登录功能待实现');
        }
    </script>
</body>
</html>`,
  css: `/* 在这里添加您的CSS样式 */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    text-align: center;
}

p {
    color: #666;
    line-height: 1.6;
}`,
  js: `// 在这里添加您的JavaScript代码
console.log('Hello CodeCanvas!');`
}

// 空白模板 - 用于创建新项目
export const blankTemplate: CodeTemplate = {
  html: '',
  css: '',
  js: ''
}

// 基础HTML模板 - 包含基本的HTML结构
export const basicTemplate: CodeTemplate = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的网页</title>
</head>
<body>
    <h1>Hello World!</h1>
    <p>开始您的创作吧！</p>
</body>
</html>`,
  css: `/* 在这里添加您的CSS样式 */`,
  js: `// 在这里添加您的JavaScript代码`
}

// 导出所有模板
export const templates = {
  welcome: welcomeTemplate,
  blank: blankTemplate,
  basic: basicTemplate
}

// 默认导出欢迎模板（保持向后兼容）
export default welcomeTemplate
