---
title: 前端微服务架构的实践经验
date: 2024-09-19 16:00:00
tags:
  - 微前端
  - 架构
  - 最佳实践
categories:
  - 前端
  - 架构
---

## 一、什么是微前端

微前端是一种类似于微服务的架构理念，它将前端应用分解成一些更小、更简单的能够独立开发、测试、部署的应用，而在用户看来仍然是内聚的单个产品。

### 1. 核心价值
1. 技术栈无关
2. 独立开发部署
3. 增量升级
4. 团队自治

## 二、实现方案

### 1. 基于路由分发
```js
// router.js
class MicroRouter {
  constructor() {
    this.apps = new Map()
    this.currentApp = null
    this.init()
  }
  
  init() {
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname)
    })
  }
  
  register(path, app) {
    this.apps.set(path, app)
  }
  
  handleRoute(path) {
    const app = this.apps.get(path)
    if (app) {
      if (this.currentApp) {
        this.currentApp.unmount()
      }
      this.currentApp = app
      app.mount()
    }
  }
}

// 使用示例
const router = new MicroRouter()

router.register('/app1', {
  mount: () => {
    // 加载并挂载应用1
  },
  unmount: () => {
    // 卸载应用1
  }
})
```

### 2. 基于 Web Components
```js
class MicroApp extends HTMLElement {
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }
  
  static get observedAttributes() {
    return ['name', 'url']
  }
  
  async connectedCallback() {
    const name = this.getAttribute('name')
    const url = this.getAttribute('url')
    
    try {
      const module = await this.loadModule(url)
      this.mountApp(module)
    } catch (error) {
      console.error(`Failed to load micro app ${name}:`, error)
    }
  }
  
  async loadModule(url) {
    const response = await fetch(url)
    const code = await response.text()
    return new Function('exports', code)
  }
  
  mountApp(module) {
    const exports = {}
    module(exports)
    
    if (exports.render) {
      const container = document.createElement('div')
      exports.render(container)
      this.shadow.appendChild(container)
    }
  }
  
  disconnectedCallback() {
    // 清理工作
  }
}

customElements.define('micro-app', MicroApp)
```

### 3. 基于 Module Federation
```js
// webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'container',
      remotes: {
        app1: 'app1@http://localhost:3001/remoteEntry.js',
        app2: 'app2@http://localhost:3002/remoteEntry.js'
      },
      shared: ['react', 'react-dom']
    })
  ]
}

// App.js
const App1 = React.lazy(() => import('app1/App'))
const App2 = React.lazy(() => import('app2/App'))

function Container() {
  return (
    <div>
      <React.Suspense fallback="Loading App1">
        <App1 />
      </React.Suspense>
      <React.Suspense fallback="Loading App2">
        <App2 />
      </React.Suspense>
    </div>
  )
}
```

## 三、通信机制

### 1. 事件总线
```js
class EventBus {
  constructor() {
    this.events = new Map()
  }
  
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event).add(callback)
  }
  
  off(event, callback) {
    if (this.events.has(event)) {
      this.events.get(event).delete(callback)
    }
  }
  
  emit(event, data) {
    if (this.events.has(event)) {
      for (const callback of this.events.get(event)) {
        callback(data)
      }
    }
  }
}

// 使用示例
const bus = new EventBus()

// 应用1
bus.on('data-update', (data) => {
  console.log('App1 received:', data)
})

// 应用2
bus.emit('data-update', { value: 123 })
```

### 2. 状态共享
```js
class SharedState {
  constructor() {
    this.state = {}
    this.listeners = new Set()
  }
  
  setState(path, value) {
    const oldValue = this.getState(path)
    if (oldValue !== value) {
      this.updateState(path, value)
      this.notifyListeners(path, value, oldValue)
    }
  }
  
  getState(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.state)
  }
  
  updateState(path, value) {
    const keys = path.split('.')
    const lastKey = keys.pop()
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {}
      return obj[key]
    }, this.state)
    target[lastKey] = value
  }
  
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }
  
  notifyListeners(path, value, oldValue) {
    for (const listener of this.listeners) {
      listener(path, value, oldValue)
    }
  }
}
```

## 四、部署策略

### 1. 独立部署
```js
class DeploymentManager {
  constructor() {
    this.apps = new Map()
    this.versions = new Map()
  }
  
  async deploy(appName, version, assets) {
    // 1. 上传资源
    await this.uploadAssets(appName, version, assets)
    
    // 2. 更新版本信息
    this.versions.set(appName, version)
    
    // 3. 通知其他应用
    this.notifyVersionUpdate(appName, version)
  }
  
  async uploadAssets(appName, version, assets) {
    const cdn = new CDNClient()
    const urls = await cdn.upload(`${appName}/${version}`, assets)
    this.apps.set(appName, urls)
  }
  
  notifyVersionUpdate(appName, version) {
    // 通知其他应用有新版本发布
    window.dispatchEvent(
      new CustomEvent('app-version-update', {
        detail: { appName, version }
      })
    )
  }
}
```

### 2. 灰度发布
```js
class GrayRelease {
  constructor() {
    this.rules = new Map()
  }
  
  addRule(appName, rule) {
    this.rules.set(appName, rule)
  }
  
  shouldUseNewVersion(appName, context) {
    const rule = this.rules.get(appName)
    if (!rule) return false
    
    return this.evaluateRule(rule, context)
  }
  
  evaluateRule(rule, context) {
    // 规则示例：
    // {
    //   percentage: 10,  // 灰度比例
    //   userGroups: ['test'],  // 用户组
    //   regions: ['CN']  // 地区
    // }
    
    if (rule.percentage) {
      const random = Math.random() * 100
      if (random > rule.percentage) return false
    }
    
    if (rule.userGroups && !rule.userGroups.includes(context.userGroup)) {
      return false
    }
    
    if (rule.regions && !rule.regions.includes(context.region)) {
      return false
    }
    
    return true
  }
}
```

## 五、性能优化

### 1. 资源加载优化
```js
class ResourceLoader {
  constructor() {
    this.cache = new Map()
    this.loading = new Map()
  }
  
  async load(url) {
    // 1. 检查缓存
    if (this.cache.has(url)) {
      return this.cache.get(url)
    }
    
    // 2. 检查是否正在加载
    if (this.loading.has(url)) {
      return this.loading.get(url)
    }
    
    // 3. 开始加载
    const promise = this.loadResource(url)
    this.loading.set(url, promise)
    
    try {
      const resource = await promise
      this.cache.set(url, resource)
      return resource
    } finally {
      this.loading.delete(url)
    }
  }
  
  async loadResource(url) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load ${url}`)
    }
    return response.text()
  }
}
```

### 2. 预加载策略
```js
class PreloadManager {
  constructor() {
    this.loader = new ResourceLoader()
    this.rules = new Map()
  }
  
  addRule(path, resources) {
    this.rules.set(path, resources)
  }
  
  handleRouteChange(path) {
    const resources = this.rules.get(path)
    if (resources) {
      this.preloadResources(resources)
    }
  }
  
  preloadResources(resources) {
    for (const url of resources) {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      document.head.appendChild(link)
    }
  }
}
```

## 六、监控与日志

### 1. 性能监控
```js
class PerformanceMonitor {
  constructor() {
    this.metrics = {}
  }
  
  trackAppLoad(appName) {
    const startTime = performance.now()
    
    return {
      end: () => {
        const duration = performance.now() - startTime
        this.recordMetric(appName, 'load', duration)
      }
    }
  }
  
  recordMetric(appName, metric, value) {
    if (!this.metrics[appName]) {
      this.metrics[appName] = {}
    }
    
    if (!this.metrics[appName][metric]) {
      this.metrics[appName][metric] = []
    }
    
    this.metrics[appName][metric].push({
      value,
      timestamp: Date.now()
    })
  }
  
  getMetrics(appName) {
    return this.metrics[appName] || {}
  }
}
```

### 2. 错误监控
```js
class ErrorTracker {
  constructor() {
    this.errors = []
    this.init()
  }
  
  init() {
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'runtime',
        error: event.error,
        source: event.filename,
        line: event.lineno,
        column: event.colno
      })
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'promise',
        error: event.reason
      })
    })
  }
  
  trackError(error) {
    this.errors.push({
      ...error,
      timestamp: Date.now()
    })
    
    this.reportError(error)
  }
  
  async reportError(error) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        body: JSON.stringify(error)
      })
    } catch (e) {
      console.error('Failed to report error:', e)
    }
  }
}
```

## 参考文献

- [微前端框架对比](https://micro-frontends.org/)
- [Module Federation 文档](https://webpack.js.org/concepts/module-federation/)
- [Web Components 规范](https://www.webcomponents.org/)
- [性能监控最佳实践](https://web.dev/vitals-measurement-getting-started/) 