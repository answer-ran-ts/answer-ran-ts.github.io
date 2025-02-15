---
title: 如何开发公司基建组件库？
date: 2025-02-10 00:09:00
tags:
  - Vue
  - 组件库
  - 基建
categories:
  - 前端
  - 架构
---

# 如何开发公司基建组件库？

组件库是前端基础建设中的重要一环，一个好的组件库可以提高开发效率、统一用户体验。本文将介绍如何基于 Vue 3 开发一个企业级组件库。

## 1. 项目初始化

### 1.1 技术选型

```json
{
  "dependencies": {
    "vue": "^3.3.0",
    "typescript": "^4.9.0",
    "sass": "^1.69.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "vue-tsc": "^1.8.0",
    "@vitejs/plugin-vue": "^5.0.0"
  }
}
```

### 1.2 Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyLib',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
```

## 2. 组件开发规范

### 2.1 目录结构

```bash
my-components/
├── src/
│   ├── components/     # 组件目录
│   │   ├── button/    
│   │   │   ├── index.ts
│   │   │   ├── button.vue
│   │   │   └── __tests__/
│   │   └── input/
│   ├── hooks/         # 组合式函数
│   ├── utils/         # 工具函数
│   └── styles/        # 全局样式
├── docs/              # 文档
└── example/           # 示例
```

### 2.2 组件示例

```vue
<!-- src/components/button/button.vue -->
<template>
  <button
    :class="[
      'my-button',
      `my-button--${type}`,
      `my-button--${size}`,
      { 'is-disabled': disabled }
    ]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
interface Props {
  type?: 'primary' | 'default' | 'text'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'medium',
  disabled: false
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
.my-button {
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  
  &--primary {
    background: var(--primary-color);
    color: white;
  }
  
  &--default {
    background: #fff;
    border: 1px solid #ddd;
  }
  
  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
```

## 3. 样式方案

### 3.1 CSS 变量

```scss
// src/styles/variables.scss
:root {
  // 主题色
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --danger-color: #f5222d;
  
  // 文字颜色
  --text-color: #333;
  --text-color-secondary: #666;
  
  // 间距
  --spacing-small: 8px;
  --spacing-medium: 16px;
  --spacing-large: 24px;
}
```

### 3.2 主题定制

```typescript
// src/utils/theme.ts
export function setTheme(theme: Record<string, string>) {
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value)
  })
}

// 使用示例
setTheme({
  'primary-color': '#f60',
  'text-color': '#222'
})
```

## 4. 单元测试

```typescript
// src/components/button/__tests__/button.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Button from '../button.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    })
    expect(wrapper.text()).toBe('Click me')
  })

  it('emits click event when not disabled', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click event when disabled', async () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true
      }
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })
})
```

## 5. 发布配置

```json
{
  "name": "@company/vue-components",
  "version": "1.0.0",
  "files": ["dist"],
  "main": "./dist/index.umd.js",
  "module": "./dist/index.es.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.umd.js"
    },
    "./dist/style.css": "./dist/style.css"
  },
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "test": "vitest",
    "lint": "eslint src",
    "type-check": "vue-tsc --noEmit"
  }
}
```

## 6. 最佳实践

1. **组件设计原则**
- 保持组件的单一职责
- 提供合理的默认值
- 支持主题定制
- 完善的类型定义
- 详细的 Props 文档

2. **性能优化**
- 合理使用 computed 和 watch
- 避免不必要的组件渲染
- 按需加载组件
- 提供 Tree Shaking 支持

3. **开发建议**
- 统一的代码风格
- 完整的测试覆盖
- 规范的 Git 提交信息
- 及时的文档更新
- 版本号语义化管理

通过以上实践，可以搭建一个高质量的 Vue 组件库。持续维护和迭代，根据用户反馈不断优化，才能打造一个好用的企业级组件库。 