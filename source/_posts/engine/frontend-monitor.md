---
title: 前端监控体系的搭建经验
date: 2024-03-19 16:00:00
tags:
  - 前端监控
  - 性能优化
  - 错误处理
categories:
  - 前端
  - 监控
---

## 一、监控维度

前端监控体系主要包含以下维度：

1. 性能监控
2. 错误监控
3. 用户行为监控
4. 业务监控
5. 资源监控

## 二、具体实现

### 1. 性能监控

#### 1.1 核心指标采集
```js
class PerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.initObservers()
  }
  
  initObservers() {
    // FCP 监控
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      this.metrics.fcp = entries[0].startTime
    }).observe({ entryTypes: ['paint'] })
    
    // LCP 监控
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      this.metrics.lcp = entries[entries.length - 1].startTime
    }).observe({ entryTypes: ['largest-contentful-paint'] })
    
    // FID 监控
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      this.metrics.fid = entries[0].processingStart - entries[0].startTime
    }).observe({ entryTypes: ['first-input'] })
  }
  
  // 获取性能指标
  getMetrics() {
    const navigationTiming = performance.getEntriesByType('navigation')[0]
    
    return {
      ...this.metrics,
      // DNS 解析时间
      dns: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
      // TCP 连接时间
      tcp: navigationTiming.connectEnd - navigationTiming.connectStart,
      // 首字节时间
      ttfb: navigationTiming.responseStart - navigationTiming.requestStart,
      // DOM 解析时间
      domParse: navigationTiming.domInteractive - navigationTiming.responseEnd,
      // 资源加载时间
      resourceLoad: navigationTiming.loadEventStart - navigationTiming.domContentLoadedEventEnd
    }
  }
}
```

#### 1.2 资源性能监控
```js
class ResourceMonitor {
  constructor() {
    this.resources = new Map()
    this.initObserver()
  }
  
  initObserver() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach(entry => {
        this.recordResource(entry)
      })
    }).observe({ entryTypes: ['resource'] })
  }
  
  recordResource(entry) {
    const metrics = {
      name: entry.name,
      type: entry.initiatorType,
      duration: entry.duration,
      size: entry.transferSize,
      protocol: entry.nextHopProtocol,
      // 资源时序信息
      timing: {
        dns: entry.domainLookupEnd - entry.domainLookupStart,
        tcp: entry.connectEnd - entry.connectStart,
        ttfb: entry.responseStart - entry.requestStart,
        download: entry.responseEnd - entry.responseStart
      }
    }
    
    this.resources.set(entry.name, metrics)
  }
  
  getSlowResources(threshold = 1000) {
    const slowResources = []
    this.resources.forEach((metrics, url) => {
      if (metrics.duration > threshold) {
        slowResources.push({ url, ...metrics })
      }
    })
    return slowResources
  }
}
```

### 2. 错误监控

#### 2.1 全局错误捕获
```js
class ErrorMonitor {
  constructor() {
    this.errors = []
    this.config = {
      maxErrors: 100,
      sampling: 1 // 采样率
    }
    this.initHandlers()
  }
  
  initHandlers() {
    // JS 运行时错误
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'runtime',
        error: event.error,
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      })
    }, true)
    
    // Promise 未捕获错误
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise',
        error: event.reason,
        message: event.reason?.message,
        stack: event.reason?.stack
      })
    })
    
    // 资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target && (event.target.src || event.target.href)) {
        this.handleError({
          type: 'resource',
          url: event.target.src || event.target.href,
          tagName: event.target.tagName,
          html: event.target.outerHTML
        })
      }
    }, true)
  }
  
  handleError(error) {
    // 采样处理
    if (Math.random() > this.config.sampling) {
      return
    }
    
    // 错误数量限制
    if (this.errors.length >= this.config.maxErrors) {
      this.errors.shift()
    }
    
    const errorInfo = {
      ...error,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }
    
    this.errors.push(errorInfo)
    this.reportError(errorInfo)
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

### 3. 用户行为监控

#### 3.1 行为采集
```js
class BehaviorMonitor {
  constructor() {
    this.events = []
    this.config = {
      maxEvents: 100,
      // 行为类型配置
      behaviorTypes: {
        CLICK: 'click',
        INPUT: 'input',
        ROUTE: 'route',
        API: 'api'
      }
    }
    this.initTrackers()
  }
  
  initTrackers() {
    // 点击行为追踪
    document.addEventListener('click', (event) => {
      const target = event.target
      this.trackEvent({
        type: this.config.behaviorTypes.CLICK,
        element: target.tagName,
        content: target.textContent,
        path: this.getElementPath(target)
      })
    }, true)
    
    // 输入行为追踪
    document.addEventListener('input', this.debounce((event) => {
      const target = event.target
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        this.trackEvent({
          type: this.config.behaviorTypes.INPUT,
          element: target.tagName,
          name: target.name || target.id
        })
      }
    }, 500), true)
    
    // 路由变化追踪
    this.trackRouteChange()
  }
  
  // 获取元素路径
  getElementPath(element) {
    const path = []
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.tagName.toLowerCase()
      if (element.id) {
        selector += `#${element.id}`
      } else if (element.className) {
        selector += `.${element.className.split(' ').join('.')}`
      }
      path.unshift(selector)
      element = element.parentNode
    }
    return path.join(' > ')
  }
  
  // 路由变化追踪
  trackRouteChange() {
    let lastUrl = window.location.href
    
    // History API
    const originalPushState = window.history.pushState
    window.history.pushState = (...args) => {
      originalPushState.apply(window.history, args)
      this.handleUrlChange()
    }
    
    // 监听 popstate 事件
    window.addEventListener('popstate', () => {
      this.handleUrlChange()
    })
  }
  
  handleUrlChange() {
    const currentUrl = window.location.href
    this.trackEvent({
      type: this.config.behaviorTypes.ROUTE,
      from: lastUrl,
      to: currentUrl
    })
    lastUrl = currentUrl
  }
  
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
  
  trackEvent(event) {
    const eventInfo = {
      ...event,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }
    
    this.events.push(eventInfo)
    if (this.events.length > this.config.maxEvents) {
      this.events.shift()
    }
    
    this.reportEvent(eventInfo)
  }
  
  async reportEvent(event) {
    try {
      await fetch('/api/events', {
        method: 'POST',
        body: JSON.stringify(event)
      })
    } catch (e) {
      console.error('Failed to report event:', e)
    }
  }
}
```

### 4. 业务监控

#### 4.1 API 监控
```js
class APIMonitor {
  constructor() {
    this.requests = new Map()
    this.initInterceptor()
  }
  
  initInterceptor() {
    // 拦截 XMLHttpRequest
    this.interceptXHR()
    // 拦截 Fetch
    this.interceptFetch()
  }
  
  interceptXHR() {
    const originalXHR = window.XMLHttpRequest
    const self = this
    
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR()
      const originalOpen = xhr.open
      const originalSend = xhr.send
      
      xhr.open = function(...args) {
        const [method, url] = args
        this._url = url
        this._method = method
        this._startTime = Date.now()
        originalOpen.apply(this, args)
      }
      
      xhr.send = function(data) {
        this.addEventListener('load', function() {
          self.handleRequest({
            url: this._url,
            method: this._method,
            status: this.status,
            duration: Date.now() - this._startTime,
            requestData: data,
            responseData: this.responseText
          })
        })
        
        originalSend.apply(this, arguments)
      }
      
      return xhr
    }
  }
  
  interceptFetch() {
    const originalFetch = window.fetch
    const self = this
    
    window.fetch = function(url, options = {}) {
      const startTime = Date.now()
      
      return originalFetch(url, options)
        .then(async (response) => {
          const duration = Date.now() - startTime
          const clonedResponse = response.clone()
          const responseData = await clonedResponse.text()
          
          self.handleRequest({
            url,
            method: options.method || 'GET',
            status: response.status,
            duration,
            requestData: options.body,
            responseData
          })
          
          return response
        })
    }
  }
  
  handleRequest(requestInfo) {
    // 记录请求信息
    this.requests.set(requestInfo.url, requestInfo)
    
    // 分析请求
    this.analyzeRequest(requestInfo)
  }
  
  analyzeRequest(requestInfo) {
    // 慢请求检测
    if (requestInfo.duration > 1000) {
      this.reportSlowAPI(requestInfo)
    }
    
    // 错误请求检测
    if (requestInfo.status >= 400) {
      this.reportErrorAPI(requestInfo)
    }
  }
  
  async reportSlowAPI(requestInfo) {
    try {
      await fetch('/api/slow-requests', {
        method: 'POST',
        body: JSON.stringify(requestInfo)
      })
    } catch (e) {
      console.error('Failed to report slow API:', e)
    }
  }
  
  async reportErrorAPI(requestInfo) {
    try {
      await fetch('/api/error-requests', {
        method: 'POST',
        body: JSON.stringify(requestInfo)
      })
    } catch (e) {
      console.error('Failed to report error API:', e)
    }
  }
}
```

## 三、数据上报

### 1. 数据上报策略
```js
class Reporter {
  constructor() {
    this.queue = []
    this.config = {
      url: '/api/collect',
      batchSize: 10,
      flushInterval: 5000
    }
    this.startTimer()
  }
  
  add(data) {
    this.queue.push({
      ...data,
      timestamp: Date.now()
    })
    
    if (this.queue.length >= this.config.batchSize) {
      this.flush()
    }
  }
  
  startTimer() {
    setInterval(() => {
      if (this.queue.length > 0) {
        this.flush()
      }
    }, this.config.flushInterval)
  }
  
  async flush() {
    if (this.queue.length === 0) return
    
    const data = this.queue.splice(0, this.config.batchSize)
    
    try {
      if (navigator.sendBeacon) {
        // 使用 Beacon API
        navigator.sendBeacon(this.config.url, JSON.stringify(data))
      } else {
        // 降级使用 fetch
        await fetch(this.config.url, {
          method: 'POST',
          body: JSON.stringify(data)
        })
      }
    } catch (e) {
      console.error('Failed to report data:', e)
      // 失败重试
      this.queue.unshift(...data)
    }
  }
}
```

## 四、监控告警

### 1. 告警规则
```js
class AlertManager {
  constructor() {
    this.rules = new Map()
  }
  
  addRule(name, rule) {
    this.rules.set(name, rule)
  }
  
  checkMetric(name, value) {
    const rule = this.rules.get(name)
    if (!rule) return
    
    if (this.evaluateRule(rule, value)) {
      this.triggerAlert(name, value)
    }
  }
  
  evaluateRule(rule, value) {
    const { operator, threshold } = rule
    
    switch (operator) {
      case '>':
        return value > threshold
      case '<':
        return value < threshold
      case '>=':
        return value >= threshold
      case '<=':
        return value <= threshold
      case '==':
        return value === threshold
      default:
        return false
    }
  }
  
  async triggerAlert(name, value) {
    const alert = {
      name,
      value,
      timestamp: Date.now()
    }
    
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify(alert)
      })
    } catch (e) {
      console.error('Failed to send alert:', e)
    }
  }
}
```

## 参考文献

- [Web Vitals](https://web.dev/vitals/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Beacon API](https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API)
- [Error Handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling) 