# 智荐优游 - Steam游戏推荐系统

基于协同过滤算法的Steam游戏促销个性化推荐与愿望单降价提醒系统。

课程设计项目，使用 React + TypeScript + Vite 构建的纯前端应用。

## 功能特性

- 游戏浏览：浏览Steam精选游戏，搜索游戏，查看详情
- AI推荐：基于游戏类型、标签、内容的智能推荐
- 协同过滤：基于用户相似度的推荐算法
- 愿望单：收藏喜欢的游戏，降价时提醒
- 价格监控：实时同步Steam价格，促销折扣一目了然
- 游戏评分：给玩过的游戏打分，提升推荐准确度
- Steam导入：导入Steam游戏库和游玩时长
- 深色主题：赛博朋克风格，符合游戏玩家审美
- 响应式：适配桌面和移动端

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **样式方案**: TailwindCSS 3
- **状态管理**: Zustand 5
- **路由管理**: React Router 7
- **图标库**: Lucide React
- **数据存储**: localStorage（纯前端）
- **外部API**: Steam Store API, Steam Web API

## 运行环境

- **操作系统**: Windows 10/11, macOS 12+, Linux
- **Node.js**: 18.x 及以上
- **npm**: 9.x 及以上
- **浏览器**: Chrome 100+, Edge 100+, Firefox 90+, Safari 15+

## 安装与启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置Steam API Key（可选）

如果需要导入Steam游戏库，需要配置API Key：

在项目根目录创建 `.env` 文件：

```
VITE_STEAM_API_KEY=你的SteamAPIKey
```

没有API Key也可以使用，只是不能导入Steam游戏库，其他功能正常。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173/ 即可。

### 4. 构建生产版本

```bash
npm run build
```

构建产物在 `dist` 目录，可以部署到任何静态服务器。

### 5. 预览生产版本

```bash
npm run preview
```

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── NavBar.tsx       # 导航栏
│   ├── GameCard.tsx     # 游戏卡片
│   ├── SaleBadge.tsx    # 促销标签
│   ├── RatingModal.tsx  # 评分弹窗
│   ├── PriceAlert.tsx   # 价格提醒
│   ├── Toast.tsx        # 消息提示
│   └── ...
├── pages/               # 页面组件
│   ├── HomePage.tsx     # 首页（推荐）
│   ├── GameDetailPage.tsx # 游戏详情
│   ├── SearchPage.tsx   # 搜索页
│   ├── WishlistPage.tsx # 愿望单
│   ├── ProfilePage.tsx  # 个人中心
│   ├── AdminPage.tsx    # 管理后台
│   ├── LoginPage.tsx    # 登录
│   ├── RegisterPage.tsx # 注册
│   └── ...
├── stores/              # Zustand状态管理
│   ├── userStore.ts     # 用户状态
│   ├── gameStore.ts     # 游戏状态
│   ├── wishlistStore.ts # 愿望单状态
│   ├── settingsStore.ts # 设置状态
│   └── toastStore.ts    # Toast状态
├── utils/               # 工具函数
│   ├── storage.ts       # 本地存储
│   ├── recommendation.ts # 协同过滤算法
│   ├── aiApi.ts         # AI推荐算法
│   ├── steamSearch.ts   # Steam搜索API
│   └── steamApi.ts      # Steam Web API
├── data/                # 数据定义
│   └── mockData.ts      # 类型定义
├── hooks/               # 自定义Hooks
├── App.tsx              # 根组件
├── main.tsx             # 入口文件
└── index.css            # 全局样式
```

## 关键模块说明

| 模块 | 主要文件 | 功能 |
|------|----------|------|
| 用户模块 | src/stores/userStore.ts | 注册、登录、资料管理 |
| 游戏模块 | src/stores/gameStore.ts | 游戏库、购买、评分、价格同步 |
| 愿望单模块 | src/stores/wishlistStore.ts | 愿望单增删、降价提醒 |
| AI推荐 | src/utils/aiApi.ts | 基于内容的智能推荐 |
| 协同过滤 | src/utils/recommendation.ts | 基于用户的协同过滤推荐 |
| Steam搜索 | src/utils/steamSearch.ts | 游戏搜索、详情、价格 |

## 开发文档

详细文档在 `md/` 目录下：

1. [可行性分析报告](md/01-可行性分析报告.md)
2. [需求规格说明书](md/02-需求规格说明书.md)
3. [软件设计文档](md/03-软件设计文档.md)
4. [软件测试报告](md/05-软件测试报告.md)

## AI使用说明

详见 [AI_USAGE.md](AI_USAGE.md)

## 说明

- 本项目为课程设计，纯前端实现，数据存储在浏览器本地
- 游戏数据来自Steam公开API，版权归原作者所有
- 仅用于学习和交流，请勿用于商业用途

## License

MIT
