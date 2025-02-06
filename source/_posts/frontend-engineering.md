---
title: 说说基于 Vue3 的前端工程化实践？
date: 2024-03-19 16:00:00
tags:
  - Vue3
  - 工程化
  - 最佳实践
categories:
  - 前端
  - 工程化
---

# 说说基于 Vue3 的前端工程化实践？

## 一、工程化概述

Vue3 项目工程化主要包含以下几个方面：

1. 项目搭建（Vite + Vue3 + TypeScript）
2. 代码规范
3. 组件设计
4. 状态管理
5. 自动化部署

## 二、具体实现

### 1. 项目搭建

#### 1.1 目录结构
```bash
├── src/
│   ├── api/          # API 接口
│   ├── assets/       # 静态资源
│   ├── components/   # 公共组件
│   ├── composables/  # 组合式函数
│   ├── layouts/      # 布局组件
│   ├── pages/        # 页面组件
│   ├── stores/       # Pinia 状态管理
│   ├── styles/       # 全局样式
│   ├── types/        # 类型定义
│   └── App.vue       # 根组件
├── env.d.ts          # 环境变量类型声明
├── vite.config.ts    # Vite 配置
└── tsconfig.json     # TypeScript 配置
```

#### 1.2 基础配置
```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    // 自动导入组件
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/components.d.ts'
    }),
    // 自动导入 API
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/auto-imports.d.ts'
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

### 2. 组件设计规范

#### 2.1 组件基本结构
```vue
<!-- UserProfile.vue -->
<script setup lang="ts">
interface Props {
  userId: string
  role?: 'admin' | 'user'
}

// 属性定义
const props = withDefaults(defineProps<Props>(), {
  role: 'user'
})

// 事件定义
const emit = defineEmits<{
  (e: 'update', id: string): void
  (e: 'delete', id: string): void
}>()

// 组合式函数
const { user, loading, error } = useUser(props.userId)

// 方法定义
const handleUpdate = () => {
  emit('update', props.userId)
}
</script>

<template>
  <div class="user-profile">
    <el-card v-loading="loading">
      <template #header>
        <span>{{ user?.name }}</span>
      </template>
      
      <div class="user-info">
        <el-descriptions :column="2">
          <el-descriptions-item label="Email">
            {{ user?.email }}
          </el-descriptions-item>
          <el-descriptions-item label="Role">
            {{ props.role }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <div class="actions">
        <el-button @click="handleUpdate">
          更新
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.user-profile {
  .user-info {
    margin: 16px 0;
  }
  
  .actions {
    text-align: right;
  }
}
</style>
```

#### 2.2 组合式函数
```ts
// composables/useUser.ts
import type { User } from '@/types'

export function useUser(id: string) {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<Error | null>(null)
  
  const fetchUser = async () => {
    try {
      loading.value = true
      const data = await userApi.getUser(id)
      user.value = data
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }
  
  onMounted(() => {
    fetchUser()
  })
  
  return {
    user,
    loading,
    error,
    refresh: fetchUser
  }
}
```

### 3. 状态管理

#### 3.1 Pinia Store 设计
```ts
// stores/user.ts
import { defineStore } from 'pinia'
import type { User } from '@/types'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null as User | null,
    users: [] as User[],
    loading: false
  }),
  
  getters: {
    isAdmin: (state) => state.currentUser?.role === 'admin',
    userById: (state) => {
      return (id: string) => state.users.find(u => u.id === id)
    }
  },
  
  actions: {
    async fetchUsers() {
      this.loading = true
      try {
        const users = await userApi.getUsers()
        this.users = users
      } finally {
        this.loading = false
      }
    },
    
    async updateUser(id: string, data: Partial<User>) {
      const user = await userApi.updateUser(id, data)
      const index = this.users.findIndex(u => u.id === id)
      if (index > -1) {
        this.users[index] = user
      }
    }
  }
})
```

### 4. 路由配置

#### 4.1 基于角色的路由控制
```ts
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/dashboard',
      component: () => import('@/pages/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      component: () => import('@/pages/Admin.vue'),
      meta: { requiresAuth: true, roles: ['admin'] }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.currentUser) {
    next('/login')
    return
  }
  
  if (to.meta.roles && !to.meta.roles.includes(userStore.currentUser?.role)) {
    next('/403')
    return
  }
  
  next()
})

export default router
```

### 5. API 封装

#### 5.1 请求封装
```ts
// utils/request.ts
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'

class Request {
  private instance: AxiosInstance
  
  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config)
    this.setupInterceptors()
  }
  
  private setupInterceptors() {
    this.instance.interceptors.request.use(
      config => {
        // 添加 token
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      error => Promise.reject(error)
    )
    
    this.instance.interceptors.response.use(
      response => response.data,
      error => {
        if (error.response?.status === 401) {
          // 处理未授权
          router.push('/login')
        }
        return Promise.reject(error)
      }
    )
  }
  
  public request<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.instance.request(config)
  }
}

export const request = new Request({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})
```

#### 5.2 API 模块化
```ts
// api/user.ts
import { request } from '@/utils/request'
import type { User } from '@/types'

export const userApi = {
  getUsers() {
    return request.request<User[]>({
      url: '/users',
      method: 'GET'
    })
  },
  
  getUser(id: string) {
    return request.request<User>({
      url: `/users/${id}`,
      method: 'GET'
    })
  },
  
  updateUser(id: string, data: Partial<User>) {
    return request.request<User>({
      url: `/users/${id}`,
      method: 'PUT',
      data
    })
  }
}
```

### 6. 自动化部署

#### 6.1 构建配置
```ts
// vite.config.ts 生产环境配置
export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'terser',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus'],
          'utils': [/src\/utils/],
          'components': [/src\/components/]
        }
      }
    }
  }
})
```

#### 6.2 Docker 部署
```dockerfile
# Dockerfile
FROM node:16 as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 参考文献

- [Vue3 官方文档](https://v3.vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Vue Router 文档](https://router.vuejs.org/) 