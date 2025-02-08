---
title: Vue 项目的性能优化方案有哪些？
date: 2024-05-10 20:11:00
tags:
  - Vue
  - 性能优化
  - 面试
categories:
  - Vue
---

## 一、代码层面优化

### 1. 数据层面

#### 1.1 合理使用 v-show 和 v-if
```js
// 频繁切换用 v-show
<template>
  <div v-show="isShow">频繁切换的内容</div>
</template>

// 条件渲染用 v-if
<template>
  <div v-if="isAdmin">管理员菜单</div>
</template>
```

#### 1.2 使用 computed 代替 methods
```js
export default {
  // 不推荐
  methods: {
    getFullName() {
      return this.firstName + ' ' + this.lastName;
    }
  },
  
  // 推荐
  computed: {
    fullName() {
      return this.firstName + ' ' + this.lastName;
    }
  }
}
```

#### 1.3 避免重复数据
```js
export default {
  data() {
    return {
      // 不推荐
      list: [],
      filterList: [], // 通过 list 过滤得到
      
      // 推荐：使用计算属性
      list: []
    }
  },
  computed: {
    filterList() {
      return this.list.filter(item => item.visible);
    }
  }
}
```

### 2. 组件优化

#### 2.1 路由懒加载
```js
// router/index.js
const routes = [
  {
    path: '/user',
    name: 'user',
    // 使用动态导入
    component: () => import('@/views/user/index.vue')
  }
]
```

#### 2.2 组件按需加载
```js
// 不推荐
import { Button, Select, Table } from 'element-plus'

// 推荐
import Button from 'element-plus/lib/button'
import Select from 'element-plus/lib/select'
```

#### 2.3 keep-alive 缓存组件
```vue
<template>
  <keep-alive :include="['UserList', 'UserInfo']">
    <router-view></router-view>
  </keep-alive>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      // 需要缓存的组件名
      cacheComponents: ['UserList', 'UserInfo']
    }
  }
}
</script>
```

### 3. 渲染优化

#### 3.1 使用 v-once 处理静态内容
```vue
<template>
  <!-- 静态内容只渲染一次 -->
  <div v-once>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </div>
</template>
```

#### 3.2 使用 v-memo 缓存模板
```vue
<template>
  <div v-memo="[item.id, item.updated]">
    <h3>{{ item.title }}</h3>
    <p>{{ item.content }}</p>
  </div>
</template>
```

#### 3.3 长列表优化
```vue
<template>
  <recycle-scroller
    class="scroller"
    :items="items"
    :item-size="32"
  >
    <template #default="{ item }">
      <div class="user-item">
        {{ item.name }}
      </div>
    </template>
  </recycle-scroller>
</template>

<script>
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

export default {
  components: {
    RecycleScroller
  },
  data() {
    return {
      items: Array.from({ length: 10000 }).map((_, i) => ({
        id: i,
        name: `User ${i}`
      }))
    }
  }
}
</script>
```

## 二、打包优化

### 1. 代码分割
```js
// vue.config.js
module.exports = {
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            chunks: 'initial'
          },
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: -20,
            chunks: 'initial',
            reuseExistingChunk: true
          }
        }
      }
    }
  }
}
```

### 2. 压缩资源
```js
// vue.config.js
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
  configureWebpack: {
    plugins: [
      new CompressionPlugin({
        test: /\.(js|css|html)$/,
        threshold: 10240, // 10KB
        deleteOriginalAssets: false
      })
    ]
  }
}
```

### 3. CDN 优化
```js
// vue.config.js
module.exports = {
  chainWebpack: config => {
    config.externals({
      'vue': 'Vue',
      'vue-router': 'VueRouter',
      'vuex': 'Vuex',
      'axios': 'axios'
    })
  }
}

// public/index.html
<head>
  <script src="https://cdn.jsdelivr.net/npm/vue@3.2.31"></script>
  <script src="https://cdn.jsdelivr.net/npm/vue-router@4.0.14"></script>
  <script src="https://cdn.jsdelivr.net/npm/vuex@4.0.2"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios@0.26.1"></script>
</head>
```

## 三、运行时优化

### 1. 事件处理
```vue
<template>
  <!-- 不推荐 -->
  <div @scroll="handleScroll">
    <!-- 内容 -->
  </div>
  
  <!-- 推荐：使用节流 -->
  <div @scroll="throttleScroll">
    <!-- 内容 -->
  </div>
</template>

<script>
import { throttle } from 'lodash-es'

export default {
  created() {
    this.throttleScroll = throttle(this.handleScroll, 200)
  },
  methods: {
    handleScroll(e) {
      // 处理滚动事件
    }
  },
  beforeDestroy() {
    // 清除节流函数
    this.throttleScroll.cancel()
  }
}
</script>
```

### 2. 大数据渲染
```vue
<template>
  <div class="list">
    <div v-for="chunk in chunks" :key="chunk[0].id">
      <div v-for="item in chunk" :key="item.id">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      list: [],
      chunkSize: 100
    }
  },
  computed: {
    chunks() {
      const chunks = []
      for (let i = 0; i < this.list.length; i += this.chunkSize) {
        chunks.push(this.list.slice(i, i + this.chunkSize))
      }
      return chunks
    }
  },
  methods: {
    async loadData() {
      const data = await fetchLargeData()
      // 使用 nextTick 分批渲染
      this.$nextTick(() => {
        this.list = data
      })
    }
  }
}
</script>
```

### 3. 内存优化
```js
export default {
  data() {
    return {
      timer: null,
      observers: {
        scroll: null,
        intersection: null,
        resize: null,
        mutation: null
      },
      domRefs: {
        listContainer: null,
        lazyImages: []
      }
    }
  },
  mounted() {
    // 1. 初始化 DOM 引用
    this.domRefs.listContainer = this.$refs.listContainer
    this.domRefs.lazyImages = this.$refs.lazyImages

    // 2. 创建交叉观察者 - 用于图片懒加载
    this.observers.intersection = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            img.src = img.dataset.src
            // 图片加载后取消观察
            this.observers.intersection.unobserve(img)
          }
        })
      },
      {
        root: this.domRefs.listContainer,
        rootMargin: '50px',
        threshold: 0.1
      }
    )

    // 3. 创建滚动观察者 - 用于无限滚动
    this.observers.scroll = new IntersectionObserver(
      (entries) => {
        const trigger = entries[0]
        if (trigger.isIntersecting) {
          this.loadMoreData()
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0
      }
    )

    // 4. 创建 ResizeObserver - 用于响应容器大小变化
    this.observers.resize = new ResizeObserver(
      this.throttle((entries) => {
        const containerSize = entries[0].contentRect
        this.handleContainerResize(containerSize)
      }, 200)
    )

    // 5. 创建 MutationObserver - 监听 DOM 变化
    this.observers.mutation = new MutationObserver(
      this.debounce((mutations) => {
        this.handleDomChanges(mutations)
      }, 200)
    )

    // 启动观察
    this.startObserving()
  },
  methods: {
    // 开始所有观察
    startObserving() {
      // 1. 观察懒加载图片
      this.domRefs.lazyImages.forEach(img => {
        this.observers.intersection.observe(img)
      })

      // 2. 观察滚动触发器
      const trigger = this.$refs.scrollTrigger
      if (trigger) {
        this.observers.scroll.observe(trigger)
      }

      // 3. 观察容器大小
      if (this.domRefs.listContainer) {
        this.observers.resize.observe(this.domRefs.listContainer)
      }

      // 4. 观察 DOM 变化
      this.observers.mutation.observe(this.domRefs.listContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      })
    },

    // 处理容器大小变化
    handleContainerResize(size) {
      // 根据新的容器大小调整布局
      this.updateLayout(size)
    },

    // 处理 DOM 变化
    handleDomChanges(mutations) {
      // 处理 DOM 变化，例如更新虚拟滚动的计算
      this.updateVirtualScroll()
    },

    // 加载更多数据
    async loadMoreData() {
      try {
        const newData = await this.fetchData()
        this.list.push(...newData)
      } catch (error) {
        console.error('Failed to load more data:', error)
      }
    },

    // 节流函数
    throttle(fn, delay) {
      let timer = null
      return function(...args) {
        if (timer) return
        timer = setTimeout(() => {
          fn.apply(this, args)
          timer = null
        }, delay)
      }
    },

    // 防抖函数
    debounce(fn, delay) {
      let timer = null
      return function(...args) {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          fn.apply(this, args)
        }, delay)
      }
    }
  },
  beforeDestroy() {
    // 清除定时器
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    
    // 断开所有观察者
    Object.values(this.observers).forEach(observer => {
      if (observer) {
        observer.disconnect()
        observer = null
      }
    })
  }
}
```

## 四、实践建议

### 1. 开发阶段
- 使用开发者工具的 Performance 面板分析性能
- 使用 Vue DevTools 检查组件渲染情况
- 编写高质量的代码，遵循最佳实践

### 2. 构建阶段
- 合理配置 webpack 优化项
- 分析并优化打包体积
- 使用动态导入和按需加载

### 3. 部署阶段
- 使用 CDN 加速资源加载
- 开启 Gzip 压缩
- 配置合理的缓存策略

## 参考文献

- [Vue.js 性能优化指南](https://vuejs.org/guide/best-practices/performance.html)
- [Vue CLI 配置指南](https://cli.vuejs.org/config/)
- [webpack 优化指南](https://webpack.js.org/guides/production/)
- [浏览器性能优化](https://web.dev/fast/) 