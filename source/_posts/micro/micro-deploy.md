---
title: 微前端子应用如何部署？
date: 2025-02-15 00:09:00
tags:
  - 微前端
  - 架构
  - 部署
categories:
  - 前端
  - 架构
---

# 微前端子应用如何部署？

微前端子应用的部署方案主要有以下几种：

## 1. 独立部署模式

这是最常见的部署方式，每个子应用独立部署到不同的服务器或 CDN。

```javascript
// 主应用配置
registerMicroApps([
  {
    name: 'app1',
    entry: 'https://app1.example.com', // 独立域名
    container: '#container',
    activeRule: '/app1'
  },
  {
    name: 'app2',
    entry: 'https://app2.example.com', // 独立域名
    container: '#container',
    activeRule: '/app2'
  }
]);
```

部署流程：
1. 子应用单独打包
2. 部署到独立的服务器/CDN
3. 主应用配置对应的 entry 地址

优点：
- 部署独立，互不影响
- 可以使用不同的 CDN
- 便于独立扩展和维护

缺点：
- 需要管理多个部署地址
- 跨域问题需要处理

## 2. 同域部署模式

所有子应用部署在同一个域名下的不同目录。

```javascript
registerMicroApps([
  {
    name: 'app1',
    entry: '/subapps/app1/', // 相对路径
    container: '#container',
    activeRule: '/app1'
  },
  {
    name: 'app2',
    entry: '/subapps/app2/', // 相对路径
    container: '#container',
    activeRule: '/app2'
  }
]);
```

目录结构：
```bash
/www/
  ├── index.html      # 主应用
  ├── subapps/
  │   ├── app1/      # 子应用1
  │   └── app2/      # 子应用2
  └── nginx.conf
```

Nginx 配置示例：
```nginx
server {
    listen 80;
    server_name example.com;

    # 主应用
    location / {
        root /www;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 子应用1
    location /subapps/app1/ {
        alias /www/subapps/app1/;
        try_files $uri $uri/ /subapps/app1/index.html;
    }

    # 子应用2
    location /subapps/app2/ {
        alias /www/subapps/app2/;
        try_files $uri $uri/ /subapps/app2/index.html;
    }
}
```

优点：
- 不存在跨域问题
- 部署管理更简单
- 资源共享更方便

缺点：
- 所有应用耦合在一起
- 单点故障风险
- 扩展性较差

## 3. 动态部署模式

通过配置中心动态管理子应用的部署地址。

```javascript
// 配置中心返回的数据结构
const config = {
  apps: [
    {
      name: 'app1',
      entry: process.env.APP1_ENTRY || 'https://app1.example.com',
      container: '#container',
      activeRule: '/app1'
    },
    {
      name: 'app2',
      entry: process.env.APP2_ENTRY || 'https://app2.example.com',
      container: '#container',
      activeRule: '/app2'
    }
  ]
};

// 主应用动态注册
fetch('/api/micro-config').then(res => res.json()).then(config => {
  registerMicroApps(config.apps);
});
```

配置中心实现示例：
```javascript
// config-server.js
const express = require('express');
const app = express();

app.get('/api/micro-config', (req, res) => {
  res.json({
    apps: [
      {
        name: 'app1',
        entry: process.env.NODE_ENV === 'production' 
          ? 'https://cdn.example.com/app1' 
          : 'http://localhost:8081',
        container: '#container',
        activeRule: '/app1'
      }
      // ...其他应用配置
    ]
  });
});
```

## 4. CI/CD 配置示例

使用 GitLab CI 进行自动化部署：

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy

# 子应用构建
build-subapp:
  stage: build
  script:
    - npm install
    - npm run build
  artifacts:
    paths:
      - dist/

# 部署到测试环境
deploy-test:
  stage: deploy
  script:
    - rsync -av dist/ user@test-server:/www/subapps/app1/
  only:
    - develop

# 部署到生产环境
deploy-prod:
  stage: deploy
  script:
    - aws s3 sync dist/ s3://prod-bucket/app1/
  only:
    - master
```

## 最佳实践建议

1. **环境配置**
```javascript
// config.js
export default {
  development: {
    app1: 'http://localhost:8081',
    app2: 'http://localhost:8082'
  },
  production: {
    app1: 'https://cdn.example.com/app1',
    app2: 'https://cdn.example.com/app2'
  }
}[process.env.NODE_ENV];
```

2. **公共依赖处理**
```html
<!-- index.html -->
<script src="https://cdn.example.com/vendor/react.production.min.js"></script>
<script src="https://cdn.example.com/vendor/react-dom.production.min.js"></script>
```

3. **健康检查**
```javascript
// 子应用入口添加健康检查接口
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

4. **部署检查清单**
- 确保所有静态资源路径正确
- 检查跨域配置
- 验证公共依赖加载
- 测试应用间通信
- 确认环境变量配置
- 验证路由是否正常

通过合理选择部署方案并遵循最佳实践，可以使微前端应用的部署更加可靠和高效。选择哪种部署方式主要取决于团队规模、技术栈、基础设施等因素。 