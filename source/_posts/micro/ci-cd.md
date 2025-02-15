---
title: 什么是CI/CD？
date: 2025-02-12 00:09:00
tags:
  - DevOps
  - 部署
  - 最佳实践
categories:
  - 前端
  - 架构
---

# 什么是CI/CD？

CI/CD 是一种现代软件开发实践，它包含两个主要概念：持续集成（Continuous Integration）和持续交付/部署（Continuous Delivery/Deployment）。

## 持续集成（CI）

持续集成是指开发人员频繁地将代码集成到主干分支的过程。

### CI 的主要步骤

```yaml
# .gitlab-ci.yml CI配置示例
stages:
  - lint      # 代码检查
  - test      # 单元测试
  - build     # 构建

lint-job:
  stage: lint
  script:
    - npm install
    - npm run lint

test-job:
  stage: test
  script:
    - npm run test

build-job:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
```

### CI 的核心功能

1. **自动化构建**
```bash
# 常见的构建命令
npm run build
yarn build
pnpm build
```

2. **自动化测试**
```javascript
// Jest 测试示例
describe('Calculator', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(add(1, 2)).toBe(3);
  });
});
```

3. **代码质量检查**
```javascript
// ESLint 配置示例
module.exports = {
  extends: ['eslint:recommended'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error'
  }
};
```

## 持续交付/部署（CD）

持续交付/部署是将软件自动发布到生产环境的过程。

### CD 的部署流程

```yaml
# 完整的 CI/CD 流水线示例
stages:
  - build
  - test
  - deploy-test
  - deploy-prod

build:
  stage: build
  script:
    - npm install
    - npm run build
  artifacts:
    paths:
      - dist/

test:
  stage: test
  script:
    - npm run test

deploy-test:
  stage: deploy-test
  script:
    - rsync -av dist/ user@test-server:/var/www/app/
  only:
    - develop

deploy-prod:
  stage: deploy-prod
  script:
    - rsync -av dist/ user@prod-server:/var/www/app/
  only:
    - master
  when: manual  # 手动触发生产环境部署
```

### CD 的主要特点

1. **环境管理**
```javascript
// 环境配置示例
const config = {
  development: {
    api: 'http://dev-api.example.com',
    debug: true
  },
  staging: {
    api: 'http://staging-api.example.com',
    debug: false
  },
  production: {
    api: 'https://api.example.com',
    debug: false
  }
};
```

2. **自动化部署**
```bash
# 部署脚本示例
#!/bin/bash
echo "Deploying to $ENV environment..."

# 备份当前版本
cp -r /var/www/app /var/www/app_backup

# 部署新版本
rsync -av dist/ /var/www/app/

# 健康检查
if curl -s "https://$DOMAIN/health" | grep -q "ok"; then
    echo "Deploy successful!"
else
    echo "Deploy failed! Rolling back..."
    cp -r /var/www/app_backup /var/www/app
    exit 1
fi
```

## CI/CD 的优势

1. **提高开发效率**
- 自动化构建和测试
- 快速发现并修复问题
- 减少手动操作错误

2. **保证代码质量**
```javascript
// 提交前的代码检查
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

3. **快速迭代**
- 频繁、小批量的发布
- 降低发布风险
- 快速获取用户反馈

## 最佳实践

1. **分支管理策略**
```bash
# Git Flow 工作流
main      # 生产环境分支
develop   # 开发环境分支
feature/* # 功能分支
release/* # 发布分支
hotfix/*  # 热修复分支
```

2. **版本控制**
```json
{
  "version": "1.0.0",
  "scripts": {
    "release": "standard-version"
  }
}
```

3. **监控和告警**
```javascript
// 部署后的监控
app.get('/metrics', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  });
});
```

4. **回滚机制**
```bash
# 版本回滚脚本
function rollback() {
  local version=$1
  
  echo "Rolling back to version $version..."
  
  # 从备份恢复
  aws s3 cp s3://backups/app-$version.zip .
  unzip app-$version.zip -d /var/www/app
  
  # 更新数据库版本
  npm run migrate:rollback
}
```

通过实施 CI/CD，团队可以：
- 更快地交付价值
- 提高代码质量
- 减少人为错误
- 增强团队协作
- 提升用户满意度

选择合适的 CI/CD 工具和流程，对于提高团队的开发效率和产品质量至关重要。常见的 CI/CD 工具包括：Jenkins、GitLab CI、GitHub Actions、Circle CI 等。 