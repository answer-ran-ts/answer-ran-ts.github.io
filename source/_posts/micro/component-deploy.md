---
title: 如何部署和使用公司组件库？
date: 2025-02-11 00:09:00
tags:
  - Vue
  - 组件库
  - 部署
categories:
  - 前端
  - 架构
---

# 如何部署和使用公司组件库？

本文介绍如何部署和使用公司内部组件库，包括发布流程、使用方式和最佳实践。

## 1. 组件库发布

### 1.1 发布准备

```json
// package.json
{
  "name": "@company/vue-components",
  "version": "1.0.0",
  "private": true,
  "files": ["dist"],
  "main": "./dist/index.umd.js",
  "module": "./dist/index.es.js",
  "types": "./dist/types/index.d.ts",
  "scripts": {
    "build": "vite build",
    "release": "npm run build && npm publish"
  }
}
```

### 1.2 私有仓库配置

```bash
# .npmrc
registry=http://npm.company.com
@company:registry=http://npm.company.com
//npm.company.com/:_authToken=${NPM_TOKEN}
```

### 1.3 发布流程

```bash
# 1. 更新版本号
npm version patch  # 修订版本
npm version minor  # 次版本
npm version major  # 主版本

# 2. 构建并发布
npm run release
```

## 2. 组件库使用

### 2.1 安装

```bash
# npm
npm i @company/vue-components -S

# yarn
yarn add @company/vue-components

# pnpm
pnpm add @company/vue-components
```

### 2.2 完整引入

```typescript
// main.ts
import { createApp } from 'vue'
import MyUI from '@company/vue-components'
import '@company/vue-components/dist/style.css'

const app = createApp(App)
app.use(MyUI)
```

### 2.3 按需引入

```typescript
// vite.config.ts
import Components from 'unplugin-vue-components/vite'

export default {
  plugins: [
    Components({
      resolvers: [
        // 自定义组件解析器
        (name) => {
          if (name.startsWith('My')) {
            return {
              name,
              from: '@company/vue-components'
            }
          }
        }
      ]
    })
  ]
}
```

## 3. 主题定制

### 3.1 CSS 变量覆盖

```css
/* 在项目的根样式文件中覆盖变量 */
:root {
  --primary-color: #f60;
  --border-radius: 8px;
  --font-size: 14px;
}
```

### 3.2 运行时配置

```typescript
import { setTheme } from '@company/vue-components'

// 动态设置主题
setTheme({
  'primary-color': '#f60',
  'text-color': '#333'
})
```

## 4. 最佳实践

### 4.1 版本管理

```bash
# package.json 中锁定版本
{
  "dependencies": {
    "@company/vue-components": "^1.0.0"  # 使用 ^ 允许次版本更新
  }
}

# 使用 .npmrc 配置源
save-exact=true  # 锁定具体版本
```

### 4.2 按需加载优化

```typescript
// 1. 组件按需加载
import { Button, Input } from '@company/vue-components'

// 2. 样式按需加载
import '@company/vue-components/dist/button.css'
import '@company/vue-components/dist/input.css'
```

### 4.3 类型支持

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["@company/vue-components/types"]
  }
}
```

## 5. 常见问题

### 5.1 版本冲突

```bash
# 检查已安装版本
npm ls @company/vue-components

# 清理缓存
npm cache clean --force

# 重新安装指定版本
npm i @company/vue-components@1.0.0
```

### 5.2 样式问题

```typescript
// 1. 确保样式文件已引入
import '@company/vue-components/dist/style.css'

// 2. 检查样式优先级
// 在组件上添加自定义类名覆盖样式
<my-button class="custom-button">按钮</my-button>

.custom-button {
  /* 自定义样式 */
}
```

### 5.3 按需加载失败

```typescript
// 1. 检查构建配置
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    include: ['@company/vue-components/es/button']
  }
})

// 2. 检查组件引入方式
// ✅ 正确方式
import { Button } from '@company/vue-components'
// ❌ 错误方式
import Button from '@company/vue-components/button'
```

## 6. 升级指南

1. **升级前准备**
- 查看更新日志
- 测试环境验证
- 准备回滚方案

2. **升级步骤**
```bash
# 1. 更新依赖
npm update @company/vue-components

# 2. 检查破坏性更新
npm run test

# 3. 按需修改代码
```

3. **注意事项**
- 主版本升级需要关注破坏性更新
- 升级后需要完整回归测试
- 建议渐进式升级，避免跨多个版本

通过以上内容，可以帮助团队更好地使用和维护组件库。持续关注组件库的更新和问题反馈，确保组件库的稳定性和可用性。 