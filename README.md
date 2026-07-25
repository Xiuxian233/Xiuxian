# Xiuxian

移动端优先的 AI 修仙世界 Web App MVP。

## 核心体验

- 用户创建道号与所在城市，进入个人 AI 修仙世界。
- 每天生成一个延续历史的修仙事件。
- 用户选择会写入长期记忆，并影响后续剧情。
- 完成事件后有概率获得唯一数字藏品。
- 用户可在同城市宗门分舵分享自己的修仙经历。

## Windows 本地运行

1. 安装 Node.js 18 或更高版本。
2. 在项目目录打开 PowerShell 或 Windows Terminal。
3. 执行：

```powershell
npm run dev
```

打开 `http://127.0.0.1:5173` 查看应用。

## macOS / Linux 本地运行

```bash
npm run dev
```

打开 `http://127.0.0.1:5173` 查看应用。

## 检查与构建

```bash
npm test
npm run build
```

当前实现为无后端静态 MVP，使用 `localStorage` 保存用户档案、每日事件、藏品与分舵动态，便于快速验证用户是否愿意持续回到一个会记住自己的 AI 修仙世界。
